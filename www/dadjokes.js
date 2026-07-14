// ─── DAD JOKES ─────────────────────────────────────────────────────────────────
// Shuffle-bag system: all jokes cycle through before repeating.
// Compound key: "fileNumber:id" (e.g. "1:42").
// State persisted in G.dadJokesRemainingKeys / G.dadJokesLastShownKey.

const DAD_JOKE_FILES = [
  'img/Dad jokes/patient_angler_dad_jokes_fishing_01.json',
  'img/Dad jokes/patient_angler_dad_jokes_general_02.json',
  'img/Dad jokes/patient_angler_dad_jokes_general_03.json',
  'img/Dad jokes/patient_angler_dad_jokes_general_04.json',
  'img/Dad jokes/patient_angler_dad_jokes_general_05.json',
  'img/Dad jokes/patient_angler_dad_jokes_general_06.json',
  'img/Dad jokes/patient_angler_dad_jokes_general_07.json',
];

// Loaded once at init. Map: "fileNumber:id" → { setup, punchline }
const _djMap = new Map();

let _djLoaded = false;
let _djLoadPromise = null;

function _djShuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function _djRebuildBag(excludeKey) {
  let keys = Array.from(_djMap.keys());
  // Shuffle first, then if first key matches excludeKey swap with second
  _djShuffle(keys);
  if (keys.length > 1 && keys[0] === excludeKey) {
    [keys[0], keys[1]] = [keys[1], keys[0]];
  }
  return keys;
}

function initDadJokes() {
  if (_djLoadPromise) return _djLoadPromise;
  _djLoadPromise = Promise.all(DAD_JOKE_FILES.map(url =>
    fetch(url).then(r => r.json()).catch(() => null)
  )).then(results => {
    // Dedup by text: set of "setup|||punchline"
    const seen = new Set();
    results.forEach(data => {
      if (!data || !Array.isArray(data.jokes)) return;
      const fn = data.fileNumber;
      data.jokes.forEach(j => {
        if (!j || !j.id || !j.setup || !j.punchline) return;
        const key = fn + ':' + j.id;
        const textKey = j.setup + '|||' + j.punchline;
        if (seen.has(textKey) || _djMap.has(key)) return;
        seen.add(textKey);
        _djMap.set(key, { setup: j.setup, punchline: j.punchline });
      });
    });
    _djLoaded = true;
    // Repair bag: if stored keys reference entries that no longer exist, drop them
    if (G.dadJokesRemainingKeys && G.dadJokesRemainingKeys.length > 0) {
      G.dadJokesRemainingKeys = G.dadJokesRemainingKeys.filter(k => _djMap.has(k));
    }
  }).catch(() => { _djLoaded = true; });
  return _djLoadPromise;
}

// Returns { setup, punchline } or null if not loaded / no jokes
function getNextDadJoke() {
  if (!_djLoaded || _djMap.size === 0) return null;

  if (!G.dadJokesRemainingKeys || G.dadJokesRemainingKeys.length === 0) {
    G.dadJokesRemainingKeys = _djRebuildBag(G.dadJokesLastShownKey || '');
  }

  const key = G.dadJokesRemainingKeys.shift();
  if (!key || !_djMap.has(key)) return null;
  G.dadJokesLastShownKey = key;
  if (typeof saveState === 'function') saveState();
  return _djMap.get(key);
}

// Injects (or removes) the dad joke section inside the catch popup.
// isManualFish: only show for manual fish (not trash, plant, autofish)
function renderDadJokeInPopup(isManualFish) {
  const inner = document.querySelector('#catch-popup .catch-popup-inner');
  if (!inner) return;

  // Remove existing joke block if any
  const existing = inner.querySelector('.dad-joke-section');
  if (existing) existing.remove();

  if (!isManualFish || !G.dadJokesEnabled) return;

  // Lazy-load joke files on first use
  if (!_djLoaded) { initDadJokes(); return; }

  const joke = getNextDadJoke();
  if (!joke) return;

  const section = document.createElement('div');
  section.className = 'dad-joke-section';

  const setup = document.createElement('p');
  setup.className = 'dad-joke-setup';
  setup.textContent = joke.setup;

  const punchline = document.createElement('p');
  punchline.className = 'dad-joke-punchline';
  punchline.textContent = joke.punchline;

  section.appendChild(setup);
  section.appendChild(punchline);
  inner.appendChild(section);
}

// Shows the dad jokes info/help popup (called from Settings)
function showDadJokesHelp() {
  const overlay = document.getElementById('dadjokes-help-overlay');
  if (!overlay) return;
  const countEl = overlay.querySelector('#dadjokes-help-count');
  if (countEl) countEl.textContent = _djMap.size;
  overlay.classList.remove('hidden');
}

function closeDadJokesHelp() {
  const overlay = document.getElementById('dadjokes-help-overlay');
  if (overlay) overlay.classList.add('hidden');
}

// Lazy init: only load joke files when dad jokes are actually enabled.
// Call initDadJokes() before first use (renderDadJokeInPopup handles this).
