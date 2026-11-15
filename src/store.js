// Where the card remembers which tips are done or hidden: Home Assistant's per-user frontend data
// (`frontend/get_user_data` / `frontend/set_user_data`), so it is the same on every device of that user.
// Without it (old versions, errors) the browser's localStorage is used.
//
// Value: { [heatingId]: { [tipId]: { done: "2026-11-15", before: 0.77 } | { hidden: true } } }

export const STORE_KEY = "central_heating_card";

const local = {
  get() {
    try {
      return JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
    } catch {
      return {};
    }
  },
  set(v) {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(v));
    } catch {
      // private mode, quota: nothing to do
    }
  },
};

export class TipStore {
  constructor() {
    this._value = null;
    this._loading = null;
    this._remote = true;
    this._listeners = new Set();
  }

  /** Loads once per page (all cards share the store). */
  load(hass) {
    if (this._value) return Promise.resolve(this._value);
    if (!this._loading)
      this._loading = (async () => {
        try {
          const res = await hass.callWS({ type: "frontend/get_user_data", key: STORE_KEY });
          this._value = res?.value && typeof res.value === "object" ? res.value : {};
        } catch {
          this._remote = false;
          this._value = local.get();
        }
        return this._value;
      })();
    return this._loading;
  }

  /** Entry of one tip, or undefined. */
  get(heating, tip) {
    return this._value?.[heating]?.[tip];
  }

  /** Sets (or with null removes) one tip's entry and saves. */
  async set(hass, heating, tip, entry) {
    await this.load(hass);
    const all = { ...this._value, [heating]: { ...(this._value[heating] || {}) } };
    if (entry === null) delete all[heating][tip];
    else all[heating][tip] = entry;
    this._value = all;
    for (const fn of this._listeners) fn();
    if (this._remote) {
      try {
        await hass.callWS({ type: "frontend/set_user_data", key: STORE_KEY, value: all });
        return;
      } catch {
        this._remote = false;
      }
    }
    local.set(all);
  }

  onChange(fn) {
    this._listeners.add(fn);
    return () => this._listeners.delete(fn);
  }
}
