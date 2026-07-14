package com.henlygames.patientangler;

import android.app.Activity;
import android.util.Log;

import com.android.billingclient.api.AcknowledgePurchaseParams;
import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.ConsumeParams;
import com.android.billingclient.api.PendingPurchasesParams;
import com.android.billingclient.api.ProductDetails;
import com.android.billingclient.api.Purchase;
import com.android.billingclient.api.PurchasesUpdatedListener;
import com.android.billingclient.api.QueryProductDetailsParams;
import com.android.billingclient.api.QueryPurchasesParams;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@CapacitorPlugin(name = "Billing")
public class BillingPlugin extends Plugin implements PurchasesUpdatedListener {

    private static final String TAG = "BillingPlugin";

    // Consumables (diamond packs) — consumed immediately so player can repurchase
    private static final List<String> CONSUMABLE_IDS = Arrays.asList(
        "starter", "pouch", "chest", "vault"
    );

    private BillingClient billingClient;
    private PluginCall pendingPurchaseCall;
    private final Map<String, ProductDetails> productDetailsCache = new HashMap<>();

    // ── Lifecycle ─────────────────────────────────────────────────────────────

    @Override
    public void load() {
        billingClient = BillingClient.newBuilder(getContext())
            .setListener(this)
            .enablePendingPurchases(
                PendingPurchasesParams.newBuilder().enableOneTimeProducts().build()
            )
            .build();
        connectBilling();
    }

    private void connectBilling() {
        if (billingClient.isReady()) return;
        billingClient.startConnection(new BillingClientStateListener() {
            @Override
            public void onBillingSetupFinished(BillingResult result) {
                if (result.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                    Log.d(TAG, "Billing connected");
                }
            }
            @Override
            public void onBillingServiceDisconnected() {
                Log.d(TAG, "Billing disconnected — will reconnect on next call");
            }
        });
    }

    // FIX #8: ensureConnected now accepts an onError runnable so callers can
    // reject their PluginCall if the billing service disconnects mid-connect.
    private void ensureConnected(Runnable onReady, Runnable onError) {
        if (billingClient.isReady()) {
            onReady.run();
            return;
        }
        billingClient.startConnection(new BillingClientStateListener() {
            @Override
            public void onBillingSetupFinished(BillingResult result) {
                if (result.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                    onReady.run();
                } else if (onError != null) {
                    onError.run();
                }
            }
            @Override
            public void onBillingServiceDisconnected() {
                // FIX #8: no longer a no-op — caller is notified so its Promise settles
                if (onError != null) onError.run();
            }
        });
    }

    // ── Plugin methods ────────────────────────────────────────────────────────

    @PluginMethod
    public void getProducts(PluginCall call) {
        JSArray ids = call.getArray("productIds");
        if (ids == null) { call.reject("productIds required"); return; }

        List<QueryProductDetailsParams.Product> products = new ArrayList<>();
        try {
            for (int i = 0; i < ids.length(); i++) {
                products.add(
                    QueryProductDetailsParams.Product.newBuilder()
                        .setProductId(ids.getString(i))
                        .setProductType(BillingClient.ProductType.INAPP)
                        .build()
                );
            }
        } catch (Exception e) {
            call.reject("Invalid productIds");
            return;
        }

        QueryProductDetailsParams params = QueryProductDetailsParams.newBuilder()
            .setProductList(products)
            .build();

        ensureConnected(
            () -> billingClient.queryProductDetailsAsync(params, (result, detailsList) -> {
                if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                    call.reject("getProducts failed: " + result.getDebugMessage());
                    return;
                }
                JSArray out = new JSArray();
                for (ProductDetails pd : detailsList) {
                    productDetailsCache.put(pd.getProductId(), pd);
                    JSObject obj = new JSObject();
                    obj.put("productId", pd.getProductId());
                    obj.put("title", pd.getTitle());
                    obj.put("description", pd.getDescription());
                    if (pd.getOneTimePurchaseOfferDetails() != null) {
                        obj.put("price", pd.getOneTimePurchaseOfferDetails().getFormattedPrice());
                        obj.put("priceMicros", pd.getOneTimePurchaseOfferDetails().getPriceAmountMicros());
                        obj.put("currency", pd.getOneTimePurchaseOfferDetails().getPriceCurrencyCode());
                    }
                    out.put(obj);
                }
                JSObject res = new JSObject();
                res.put("products", out);
                call.resolve(res);
            }),
            () -> call.reject("BILLING_DISCONNECTED")
        );
    }

    @PluginMethod
    public void purchaseProduct(PluginCall call) {
        String productId = call.getString("productId");
        if (productId == null) { call.reject("productId required"); return; }

        // FIX #4: guard against concurrent purchases — second tap would orphan the first call
        if (pendingPurchaseCall != null) {
            call.reject("PURCHASE_IN_PROGRESS");
            return;
        }

        ensureConnected(
            () -> {
                ProductDetails pd = productDetailsCache.get(productId);
                if (pd == null) {
                    List<QueryProductDetailsParams.Product> products = new ArrayList<>(Arrays.asList(
                        QueryProductDetailsParams.Product.newBuilder()
                            .setProductId(productId)
                            .setProductType(BillingClient.ProductType.INAPP)
                            .build()
                    ));
                    billingClient.queryProductDetailsAsync(
                        QueryProductDetailsParams.newBuilder().setProductList(products).build(),
                        (result, detailsList) -> {
                            if (detailsList == null || detailsList.isEmpty()) {
                                call.reject("Product not found: " + productId);
                                return;
                            }
                            productDetailsCache.put(productId, detailsList.get(0));
                            launchFlow(call, detailsList.get(0));
                        }
                    );
                } else {
                    launchFlow(call, pd);
                }
            },
            () -> call.reject("BILLING_DISCONNECTED")
        );
    }

    private void launchFlow(PluginCall call, ProductDetails pd) {
        // FIX #4: double-check guard (queryProductDetailsAsync is async; state may have changed)
        if (pendingPurchaseCall != null) {
            call.reject("PURCHASE_IN_PROGRESS");
            return;
        }
        pendingPurchaseCall = call;
        call.setKeepAlive(true);

        List<BillingFlowParams.ProductDetailsParams> productList = new ArrayList<>(Arrays.asList(
            BillingFlowParams.ProductDetailsParams.newBuilder()
                .setProductDetails(pd)
                .build()
        ));

        BillingFlowParams flowParams = BillingFlowParams.newBuilder()
            .setProductDetailsParamsList(productList)
            .build();

        Activity activity = getActivity();
        activity.runOnUiThread(() -> {
            BillingResult result = billingClient.launchBillingFlow(activity, flowParams);
            if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                pendingPurchaseCall = null;
                call.setKeepAlive(false);
                call.reject("Launch failed: " + result.getDebugMessage());
            }
        });
    }

    @PluginMethod
    public void restoreTransactions(PluginCall call) {
        ensureConnected(
            () -> billingClient.queryPurchasesAsync(
                QueryPurchasesParams.newBuilder()
                    .setProductType(BillingClient.ProductType.INAPP)
                    .build(),
                (result, purchases) -> {
                    if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                        call.reject("Restore failed: " + result.getDebugMessage());
                        return;
                    }
                    JSArray out = new JSArray();
                    for (Purchase p : purchases) {
                        if (p.getPurchaseState() == Purchase.PurchaseState.PURCHASED) {
                            JSObject obj = purchaseToJs(p);
                            out.put(obj);
                            for (String pid : p.getProducts()) {
                                if (CONSUMABLE_IDS.contains(pid)) {
                                    // FIX #5: stuck consumable (consume previously failed) —
                                    // re-consume silently so player can repurchase the SKU
                                    consumePurchaseInternal(p, null);
                                } else if (!p.isAcknowledged()) {
                                    // Non-consumable not yet acknowledged — acknowledge now
                                    acknowledgePurchaseInternal(p, null);
                                }
                            }
                        }
                    }
                    JSObject res = new JSObject();
                    res.put("purchases", out);
                    call.resolve(res);
                }
            ),
            () -> call.reject("BILLING_DISCONNECTED")
        );
    }

    // ── Purchase result callback ──────────────────────────────────────────────

    @Override
    public void onPurchasesUpdated(BillingResult result, List<Purchase> purchases) {
        PluginCall call = pendingPurchaseCall;
        pendingPurchaseCall = null;
        if (call != null) call.setKeepAlive(false);

        int code = result.getResponseCode();

        if (code == BillingClient.BillingResponseCode.USER_CANCELED) {
            if (call != null) call.reject("USER_CANCELLED");
            return;
        }
        // FIX #7: surface ITEM_ALREADY_OWNED so JS can show "Use Restore Purchases" guidance
        if (code == BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED) {
            if (call != null) call.reject("ITEM_ALREADY_OWNED");
            return;
        }
        if (code != BillingClient.BillingResponseCode.OK || purchases == null) {
            if (call != null) call.reject("Purchase failed: " + result.getDebugMessage());
            return;
        }

        for (Purchase purchase : purchases) {
            if (purchase.getPurchaseState() != Purchase.PurchaseState.PURCHASED) continue;
            for (String pid : purchase.getProducts()) {
                if (CONSUMABLE_IDS.contains(pid)) {
                    consumePurchaseInternal(purchase, call);
                    call = null; // FIX #1: prevent trailing reject — consumeAsync resolves the call asynchronously
                } else {
                    // FIX #2: resolve INSIDE the ack callback, not before it
                    acknowledgePurchaseInternal(purchase, call);
                    call = null;
                }
            }
        }
        if (call != null) call.reject("No completed purchase found");
    }

    // ── Internal helpers ──────────────────────────────────────────────────────

    private void consumePurchaseInternal(Purchase purchase, PluginCall call) {
        ConsumeParams params = ConsumeParams.newBuilder()
            .setPurchaseToken(purchase.getPurchaseToken())
            .build();
        billingClient.consumeAsync(params, (result, token) -> {
            if (call == null) return;
            if (result.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                call.resolve(purchaseToJs(purchase));
            } else {
                call.reject("Consume failed: " + result.getDebugMessage());
            }
        });
    }

    // FIX #2: overload that resolves/rejects the call when ack completes
    private void acknowledgePurchaseInternal(Purchase purchase, PluginCall call) {
        if (purchase.isAcknowledged()) {
            if (call != null) call.resolve(purchaseToJs(purchase));
            return;
        }
        AcknowledgePurchaseParams params = AcknowledgePurchaseParams.newBuilder()
            .setPurchaseToken(purchase.getPurchaseToken())
            .build();
        billingClient.acknowledgePurchase(params, r -> {
            if (r.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                Log.d(TAG, "Acknowledged " + purchase.getProducts());
                if (call != null) call.resolve(purchaseToJs(purchase));
            } else {
                Log.e(TAG, "Ack failed: " + r.getDebugMessage());
                if (call != null) call.reject("Ack failed: " + r.getDebugMessage());
            }
        });
    }

    private JSObject purchaseToJs(Purchase purchase) {
        JSObject obj = new JSObject();
        obj.put("orderId", purchase.getOrderId());
        obj.put("purchaseToken", purchase.getPurchaseToken());
        obj.put("state", "purchased");
        JSArray prods = new JSArray();
        for (String p : purchase.getProducts()) prods.put(p);
        obj.put("productIds", prods);
        return obj;
    }
}
