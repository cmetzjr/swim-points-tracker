const COOKIE_NAME = 'swimMeetTracker';
const COOKIE_DAYS = 30;

const RELAY_NAMES = ['medley-relay', 'freestyle-relay'];
const INDIVIDUAL_EVENTS = ['individual-medley', 'freestyle', 'backstroke', 'breaststroke', 'butterfly'];
const PLACE_POINTS = { '1st': 5, '2nd': 3, '3rd': 1, 'none': 0 };

// --- Cookie helpers ---

function getCookie(name) {
  const match = document.cookie.split('; ').find(row => row.startsWith(name + '='));
  return match ? decodeURIComponent(match.split('=')[1]) : null;
}

function setCookie(name, value, days) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
}

function deleteCookie(name) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
}

// --- Scoring ---

function updateTotal() {
  let total = 0;

  RELAY_NAMES.forEach(name => {
    const checked = document.querySelector(`input[name="${name}"]:checked`);
    if (checked && checked.value === 'win') total += 7;
  });

  INDIVIDUAL_EVENTS.forEach(eventId => {
    document.querySelectorAll(`input[data-event="${eventId}"]:checked`).forEach(cb => {
      total += PLACE_POINTS[cb.dataset.place] || 0;
    });
  });

  document.getElementById('total').textContent = `Total: ${total} pts`;
}

// --- State persistence ---

function saveState() {
  const state = {};

  RELAY_NAMES.forEach(name => {
    const checked = document.querySelector(`input[name="${name}"]:checked`);
    state[name] = checked ? checked.value : '';
  });

  INDIVIDUAL_EVENTS.forEach(eventId => {
    state[eventId] = {};
    Object.keys(PLACE_POINTS).forEach(place => {
      const cb = document.querySelector(`input[data-event="${eventId}"][data-place="${place}"]`);
      state[eventId][place] = cb ? cb.checked : false;
    });
  });

  setCookie(COOKIE_NAME, JSON.stringify(state), COOKIE_DAYS);
}

function loadState() {
  const raw = getCookie(COOKIE_NAME);
  if (!raw) return;

  let state;
  try {
    state = JSON.parse(raw);
  } catch (e) {
    return; // corrupt cookie — start fresh
  }

  RELAY_NAMES.forEach(name => {
    if (state[name]) {
      const radio = document.querySelector(`input[name="${name}"][value="${state[name]}"]`);
      if (radio) radio.checked = true;
    }
  });

  INDIVIDUAL_EVENTS.forEach(eventId => {
    if (!state[eventId]) return;
    Object.keys(PLACE_POINTS).forEach(place => {
      const cb = document.querySelector(`input[data-event="${eventId}"][data-place="${place}"]`);
      if (cb) cb.checked = !!state[eventId][place];
    });
  });
}

// --- Checkbox mutual exclusion (None <-> 1st/2nd/3rd) ---

function handleIndividualCheckbox(input) {
  if (!input.checked) return;

  const eventId = input.dataset.event;
  const place = input.dataset.place;

  if (place === 'none') {
    // Checking None: clear all place checkboxes
    ['1st', '2nd', '3rd'].forEach(p => {
      const cb = document.querySelector(`input[data-event="${eventId}"][data-place="${p}"]`);
      if (cb) cb.checked = false;
    });
  } else {
    // Checking a place: clear None
    const noneCb = document.querySelector(`input[data-event="${eventId}"][data-place="none"]`);
    if (noneCb) noneCb.checked = false;
  }
}

// --- Reset ---

function resetAll() {
  document.querySelectorAll('input[type="radio"]').forEach(r => r.checked = false);
  document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
  updateTotal();
  deleteCookie(COOKIE_NAME);
}

// --- Event listeners ---

document.addEventListener('change', e => {
  const input = e.target;

  if (input.type === 'checkbox' && input.dataset.event) {
    handleIndividualCheckbox(input);
  }

  updateTotal();
  saveState();
});

document.getElementById('reset-btn').addEventListener('click', () => {
  if (confirm('Reset all selections and clear saved data?')) {
    resetAll();
  }
});

// --- Init ---

loadState();
updateTotal();
