'use strict';

const COOKIE_NAME = 'swimMeetTracker';
const COOKIE_DAYS = 30;

const PLACES = ['1st', '2nd', '3rd', 'none'];
const PLACE_POINTS = { '1st': 5, '2nd': 3, '3rd': 1, 'none': 0 };

const AGE_GROUPS_ALL = [
  'Girls 8U',   'Boys 8U',
  'Girls 9/10', 'Boys 9/10',
  'Girls 11/12', 'Boys 11/12',
  'Girls 13/14', 'Boys 13/14',
  'Girls 15O',  'Boys 15O',
];

const AGE_GROUPS_IM = [
  'Girls 11/12', 'Boys 11/12',
  'Girls 13/14', 'Boys 13/14',
  'Girls 15O',   'Boys 15O',
];

const EVENTS = [
  { id: 'individual-medley', name: 'Individual Medley', type: 'individual', groups: AGE_GROUPS_IM },
  { id: 'medley-relay',      name: 'Medley Relay',      type: 'relay',      groups: AGE_GROUPS_ALL },
  { id: 'freestyle',         name: 'Freestyle',          type: 'individual', groups: AGE_GROUPS_ALL },
  { id: 'backstroke',        name: 'Backstroke',         type: 'individual', groups: AGE_GROUPS_ALL },
  { id: 'breaststroke',      name: 'Breaststroke',       type: 'individual', groups: AGE_GROUPS_ALL },
  { id: 'butterfly',         name: 'Butterfly',          type: 'individual', groups: AGE_GROUPS_ALL },
  { id: 'freestyle-relay',   name: 'Freestyle Relay',    type: 'relay',      groups: AGE_GROUPS_ALL },
];

// Total number of sub-events — used to validate cookie length (6 + 10*6 = 66)
const TOTAL_SUB_EVENTS = EVENTS.reduce((n, e) => n + e.groups.length, 0);

// --- Helpers ---

function toSlug(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// Unique key per sub-event, e.g. "freestyle--girls-9-10"
function subKey(eventId, group) {
  return `${eventId}--${toSlug(group)}`;
}

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

// --- Render ---

function buildRelayControls(key) {
  const controls = document.createElement('div');
  controls.className = 'event-controls';
  ['win', 'none'].forEach(val => {
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = key;
    input.value = val;
    label.appendChild(input);
    label.appendChild(document.createTextNode(' ' + (val === 'win' ? 'Win' : 'None')));
    controls.appendChild(label);
  });
  return controls;
}

function buildIndividualControls(key) {
  const controls = document.createElement('div');
  controls.className = 'event-controls';
  PLACES.forEach(place => {
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.dataset.event = key;
    input.dataset.place = place;
    label.appendChild(input);
    label.appendChild(document.createTextNode(' ' + (place === 'none' ? 'None' : place)));
    controls.appendChild(label);
  });
  return controls;
}

function render() {
  const container = document.getElementById('events-container');

  EVENTS.forEach(event => {
    const eventDiv = document.createElement('div');
    eventDiv.className = 'event';

    // Header (always visible, toggles body)
    const header = document.createElement('div');
    header.className = 'event-header';

    const nameSpan = document.createElement('span');
    nameSpan.className = 'event-name';
    nameSpan.textContent = event.name;

    const subtotalSpan = document.createElement('span');
    subtotalSpan.className = 'event-subtotal';
    subtotalSpan.id = `subtotal-${event.id}`;
    subtotalSpan.textContent = '0 pts';

    const toggleSpan = document.createElement('span');
    toggleSpan.className = 'event-toggle';
    toggleSpan.textContent = '▼';

    header.appendChild(nameSpan);
    header.appendChild(subtotalSpan);
    header.appendChild(toggleSpan);
    header.addEventListener('click', () => eventDiv.classList.toggle('open'));
    eventDiv.appendChild(header);

    // Body (collapsed by default)
    const body = document.createElement('div');
    body.className = 'event-body';

    event.groups.forEach(group => {
      const key = subKey(event.id, group);

      const subDiv = document.createElement('div');
      subDiv.className = 'sub-event';

      const groupLabel = document.createElement('div');
      groupLabel.className = 'group-name';
      groupLabel.textContent = group;
      subDiv.appendChild(groupLabel);

      const controls = event.type === 'relay'
        ? buildRelayControls(key)
        : buildIndividualControls(key);

      subDiv.appendChild(controls);
      body.appendChild(subDiv);
    });

    eventDiv.appendChild(body);
    container.appendChild(eventDiv);
  });
}

// --- Scoring ---

function getEventPoints(event) {
  let pts = 0;
  event.groups.forEach(group => {
    const key = subKey(event.id, group);
    if (event.type === 'relay') {
      const checked = document.querySelector(`input[name="${key}"]:checked`);
      if (checked && checked.value === 'win') pts += 7;
    } else {
      document.querySelectorAll(`input[data-event="${key}"]:checked`).forEach(cb => {
        pts += PLACE_POINTS[cb.dataset.place] || 0;
      });
    }
  });
  return pts;
}

function updateTotals() {
  let grand = 0;
  EVENTS.forEach(event => {
    const pts = getEventPoints(event);
    document.getElementById(`subtotal-${event.id}`).textContent = `${pts} pts`;
    grand += pts;
  });
  document.getElementById('total').textContent = `Total: ${grand} pts`;
}

// --- State persistence ---
//
// Cookie format: a compact string of exactly TOTAL_SUB_EVENTS characters.
// Events are written in EVENTS order, groups in their defined order.
//
// Relay sub-event: one char — '0' nothing, '1' win, '2' none
// Individual sub-event: one hex char (0–f) encoding 4 bits:
//   bit 0 = 1st, bit 1 = 2nd, bit 2 = 3rd, bit 3 = none
//
// Total: 66 chars — well within the 4KB cookie limit.

function serializeState() {
  let compact = '';
  EVENTS.forEach(event => {
    event.groups.forEach(group => {
      const key = subKey(event.id, group);
      if (event.type === 'relay') {
        const checked = document.querySelector(`input[name="${key}"]:checked`);
        compact += !checked ? '0' : checked.value === 'win' ? '1' : '2';
      } else {
        let bits = 0;
        PLACES.forEach((place, i) => {
          const cb = document.querySelector(`input[data-event="${key}"][data-place="${place}"]`);
          if (cb && cb.checked) bits |= (1 << i);
        });
        compact += bits.toString(16);
      }
    });
  });
  return compact;
}

function deserializeState(compact) {
  let i = 0;
  EVENTS.forEach(event => {
    event.groups.forEach(group => {
      if (i >= compact.length) return;
      const key = subKey(event.id, group);
      const char = compact[i++];

      if (event.type === 'relay') {
        const val = char === '1' ? 'win' : char === '2' ? 'none' : null;
        if (val) {
          const radio = document.querySelector(`input[name="${key}"][value="${val}"]`);
          if (radio) radio.checked = true;
        }
      } else {
        const bits = parseInt(char, 16);
        PLACES.forEach((place, idx) => {
          const cb = document.querySelector(`input[data-event="${key}"][data-place="${place}"]`);
          if (cb) cb.checked = !!(bits & (1 << idx));
        });
      }
    });
  });
}

function saveState() {
  setCookie(COOKIE_NAME, serializeState(), COOKIE_DAYS);
}

function loadState() {
  const raw = getCookie(COOKIE_NAME);
  if (!raw) return;
  if (raw.length !== TOTAL_SUB_EVENTS) {
    // Wrong length means stale or old-format cookie — clear it.
    deleteCookie(COOKIE_NAME);
    return;
  }
  deserializeState(raw);
}

// --- Checkbox mutual exclusion (None <-> 1st/2nd/3rd) ---

function handleIndividualCheckbox(input) {
  if (!input.checked) return;
  const key = input.dataset.event;
  const place = input.dataset.place;

  if (place === 'none') {
    PLACES.filter(p => p !== 'none').forEach(p => {
      const cb = document.querySelector(`input[data-event="${key}"][data-place="${p}"]`);
      if (cb) cb.checked = false;
    });
  } else {
    const noneCb = document.querySelector(`input[data-event="${key}"][data-place="none"]`);
    if (noneCb) noneCb.checked = false;
  }
}

// --- Reset ---

function resetAll() {
  document.querySelectorAll('input[type="radio"]').forEach(r => r.checked = false);
  document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
  updateTotals();
  deleteCookie(COOKIE_NAME);
}

// --- Event listeners ---

document.addEventListener('change', e => {
  const input = e.target;
  if (input.type === 'checkbox' && input.dataset.event) {
    handleIndividualCheckbox(input);
  }
  updateTotals();
  saveState();
});

document.getElementById('reset-btn').addEventListener('click', () => {
  if (confirm('Reset all selections and clear saved data?')) resetAll();
});

// --- Init ---

render();
loadState();
updateTotals();
