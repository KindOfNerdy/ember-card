/*
 * Ember Card
 * Lovelace card for Ember mugs, cups, tumblers and travel mugs set up with the
 * Ember Mug integration (sopelj/hass-ember-mug-component).
 * Finds every device of the integration by itself; colors and fonts come only
 * from the Home Assistant theme.
 */

const CARD_VERSION = "0.2.1";
const PLATFORM = "ember_mug";
const MODES = ["full", "row"];
const PARTS = ["picture", "level", "keep_warm", "target", "presets", "battery", "led"];

const TEXT = {
  en: {
    no_device: "No Ember device found. Set one up with the Ember Mug integration.",
    st_standby: "Standby",
    st_empty: "Empty",
    st_filling: "Filling",
    st_cold_no_control: "Cold",
    st_cooling: "Cooling down",
    st_heating: "Heating up",
    st_perfect: "Perfect",
    st_warm_no_control: "Warm",
    st_unknown: "Connecting …",
    asleep: "Asleep",
    as_of: "as of {when}",
    target: "Target {value}",
    keep_warm: "Keep warm",
    keep_warm_on: "Keep warm: on",
    keep_warm_off: "Keep warm: off",
    lower: "Lower target temperature",
    raise: "Raise target temperature",
    battery: "Battery",
    charging: "Charging",
    level: "Fill level",
    led: "LED",
    led_color: "LED color",
    preset: "Preset",
    preset_none: "Custom",
    p_latte: "Latte",
    p_cappuccino: "Cappuccino",
    p_coffee: "Coffee",
    "p_black-tea": "Black tea",
    "p_green-tea": "Green tea",
    error: "Could not change it: {msg}",
    ed_title: "Title",
    ed_mode: "Display",
    mode_full: "Full card",
    mode_row: "Row (one per mug in use)",
    ed_tap_action: "Tap action (row)",
    ed_hold_action: "Hold action (row)",
    ed_devices: "Devices (empty = all)",
    ed_show_sleeping: "Show devices that are asleep",
    ed_compact_empty: "Empty devices as a short row",
    ed_more: "More options",
    ed_max_columns: "Columns at most",
    ed_target_step: "Step for the target temperature",
    ed_hide: "Hide parts",
    ed_hide_picture: "Picture",
    ed_hide_level: "Fill level",
    ed_hide_keep_warm: "Keep warm switch",
    ed_hide_target: "Target temperature",
    ed_hide_presets: "Presets",
    ed_hide_battery: "Battery",
    ed_hide_led: "LED color",
  },
  de: {
    no_device: "Kein Ember-Gerät gefunden. Richte eines mit der Integration Ember Mug ein.",
    st_standby: "Bereit",
    st_empty: "Leer",
    st_filling: "Wird befüllt",
    st_cold_no_control: "Kalt",
    st_cooling: "Kühlt ab",
    st_heating: "Heizt auf",
    st_perfect: "Perfekt",
    st_warm_no_control: "Warm",
    st_unknown: "Verbinde …",
    asleep: "Schläft",
    as_of: "Stand {when}",
    target: "Ziel {value}",
    keep_warm: "Warmhalten",
    keep_warm_on: "Warmhalten: an",
    keep_warm_off: "Warmhalten: aus",
    lower: "Zieltemperatur senken",
    raise: "Zieltemperatur erhöhen",
    battery: "Akku",
    charging: "Lädt",
    level: "Füllstand",
    led: "LED",
    led_color: "LED-Farbe",
    preset: "Voreinstellung",
    preset_none: "Eigene",
    p_latte: "Latte",
    p_cappuccino: "Cappuccino",
    p_coffee: "Kaffee",
    "p_black-tea": "Schwarztee",
    "p_green-tea": "Grüntee",
    error: "Änderung fehlgeschlagen: {msg}",
    ed_title: "Titel",
    ed_mode: "Darstellung",
    mode_full: "Volle Karte",
    mode_row: "Zeile (eine je benutztem Becher)",
    ed_tap_action: "Aktion beim Antippen (Zeile)",
    ed_hold_action: "Aktion beim Halten (Zeile)",
    ed_devices: "Geräte (leer = alle)",
    ed_show_sleeping: "Schlafende Geräte zeigen",
    ed_compact_empty: "Leere Geräte als schmale Zeile",
    ed_more: "Weitere Einstellungen",
    ed_max_columns: "Höchstens so viele Spalten",
    ed_target_step: "Schrittweite der Zieltemperatur",
    ed_hide: "Teile ausblenden",
    ed_hide_picture: "Bild",
    ed_hide_level: "Füllstand",
    ed_hide_keep_warm: "Schalter Warmhalten",
    ed_hide_target: "Zieltemperatur",
    ed_hide_presets: "Voreinstellungen",
    ed_hide_battery: "Akku",
    ed_hide_led: "LED-Farbe",
  },
};

const OFF = ["unavailable", "unknown", undefined, null, ""];
// Status → theme color (HA defines these variables in every theme).
// Battery levels that ask for the coaster (percent).
const BAT_LOW = 20;
const BAT_CRIT = 10;

const STATE_COLOR = {
  heating: "var(--state-climate-heat-color, var(--orange-color))",
  cooling: "var(--state-climate-cool-color, var(--blue-color))",
  perfect: "var(--success-color)",
  filling: "var(--info-color, var(--primary-color))",
  warm_no_control: "var(--warning-color)",
};

function uiText(key) {
  const lang = (document.querySelector("home-assistant")?.hass?.language || navigator.language || "en").split("-")[0];
  return (TEXT[lang] || TEXT.en)[key] || TEXT.en[key] || key;
}

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const toHex = (rgb) => "#" + rgb.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
const fromHex = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

// ---- device shapes ------------------------------------------------------------
// Drawn in a 100×100 box: body, inner (liquid) area, optional handle, LED position.
function shapeFor(model) {
  const m = String(model || "").toLowerCase();
  if (m.includes("travel")) return "travel";
  if (m.includes("tumbler")) return "tumbler";
  if (m.includes("cup")) return "cup";
  return "mug";
}

const SHAPES = {
  mug: {
    body: "M20,22 h50 a3,3 0 0 1 3,3 v46 q0,15 -14,17 h-28 q-14,-2 -14,-17 v-46 a3,3 0 0 1 3,-3 z",
    inner: "M24,26 h42 v44 q0,12 -11,14 h-20 q-11,-2 -11,-14 z",
    top: 26, bottom: 84,
    handle: "M73,34 h6 a8,8 0 0 1 8,8 v16 a8,8 0 0 1 -8,8 h-6",
  },
  cup: {
    body: "M18,40 h54 a3,3 0 0 1 3,3 v28 q0,15 -16,17 h-28 q-16,-2 -16,-17 v-28 a3,3 0 0 1 3,-3 z",
    inner: "M22,44 h46 v26 q0,12 -12,14 h-22 q-12,-2 -12,-14 z",
    top: 44, bottom: 84,
    handle: "M75,48 h5 a7,7 0 0 1 7,7 v6 a7,7 0 0 1 -7,7 h-6",
  },
  tumbler: {
    body: "M24,8 h42 a3,3 0 0 1 3,3 l-3,72 q-1,5 -6,5 h-30 q-5,0 -6,-5 l-3,-72 a3,3 0 0 1 3,-3 z",
    inner: "M28,12 h34 l-3,68 q-1,4 -5,4 h-18 q-4,0 -5,-4 z",
    top: 12, bottom: 84,
    handle: "M68,24 h7 a7,7 0 0 1 7,7 v26 a7,7 0 0 1 -7,7 h-9",
  },
  travel: {
    body: "M30,4 h30 a4,4 0 0 1 4,4 v6 h-38 v-6 a4,4 0 0 1 4,-4 z M26,16 h38 v66 q0,6 -6,6 h-26 q-6,0 -6,-6 z",
    inner: "M30,20 h30 v60 q0,4 -4,4 h-22 q-4,0 -4,-4 z",
    top: 20, bottom: 84,
    handle: "",
  },
};

class EmberCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._sig = null;
    this._pending = {}; // deviceId → { target, at } and `${id}:led` → { rgb, at }
    this._timers = {};
    this._error = "";
    this._lastBattery = {}; // deviceId → last battery level before it fell asleep (null = none found)

    this.shadowRoot.addEventListener("click", (e) => {
      const el = e.target.closest("[data-act]");
      if (!el) {
        const tile = e.target.closest("[data-tap]");
        if (tile && !this._held) this._action(tile.dataset.tap, "tap");
        this._held = false;
        return;
      }
      if (el.disabled) return;
      const { act, entity, dev } = el.dataset;
      if (act === "step") this._step(dev, Number(el.dataset.dir));
      if (act === "toggle") this._call("switch", "toggle", entity);
      if (act === "more") this._moreInfo(entity);
    });
    this.shadowRoot.addEventListener("change", (e) => {
      const el = e.target;
      if (el.matches?.("select[data-act='preset']") && el.value) {
        this._call("select", "select_option", el.dataset.entity, { option: el.value });
      }
      if (el.matches?.("input[data-act='led']")) {
        const rgb = fromHex(el.value);
        this._pending[`${el.dataset.dev}:led`] = { rgb, at: Date.now() };
        this._call("light", "turn_on", el.dataset.entity, { rgb_color: rgb });
        this._refresh();
      }
    });
    // row: hold action after half a second, Enter/Space as tap
    this.shadowRoot.addEventListener("pointerdown", (e) => {
      const tile = e.target.closest("[data-tap]");
      if (!tile || e.target.closest("[data-act]") || !this._config.hold_action) return;
      this._held = false;
      clearTimeout(this._holdTimer);
      this._holdTimer = setTimeout(() => {
        this._held = true;
        this._action(tile.dataset.tap, "hold");
      }, 500);
    });
    for (const ev of ["pointerup", "pointercancel", "pointerleave"]) {
      this.shadowRoot.addEventListener(ev, () => clearTimeout(this._holdTimer), true);
    }
    this.shadowRoot.addEventListener("keydown", (e) => {
      const tile = e.target.matches?.("[data-tap]") ? e.target : null;
      if (tile && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        this._action(tile.dataset.tap, "tap");
      }
    });
    // keep the card still while a drop-down or the color picker is open
    this.shadowRoot.addEventListener("focusin", (e) => {
      if (e.target.matches?.("select, input")) this._hold = true;
    });
    this.shadowRoot.addEventListener("focusout", () => {
      this._hold = false;
      setTimeout(() => this._refresh(), 0);
    });
  }

  // ---- Lovelace API ----------------------------------------------------------

  static getConfigForm() {
    return {
      schema: [
        {
          name: "mode",
          default: "full",
          selector: { select: { mode: "dropdown", options: MODES.map((m) => ({ value: m, label: uiText(`mode_${m}`) })) } },
        },
        { name: "title", selector: { text: {} } },
        { name: "devices", selector: { device: { multiple: true, filter: { integration: PLATFORM } } } },
        { name: "show_sleeping", default: true, selector: { boolean: {} } },
        { name: "compact_empty", default: false, selector: { boolean: {} } },
        {
          name: "hide",
          selector: {
            select: { multiple: true, mode: "list", options: PARTS.map((p) => ({ value: p, label: uiText(`ed_hide_${p}`) })) },
          },
        },
        {
          type: "expandable",
          name: "more",
          title: uiText("ed_more"),
          flatten: true,
          schema: [
            { name: "max_columns", default: 3, selector: { number: { min: 1, max: 3, mode: "box" } } },
            { name: "target_step", selector: { number: { min: 0.1, max: 5, step: 0.1, mode: "box" } } },
            { name: "tap_action", selector: { ui_action: {} } },
            { name: "hold_action", selector: { ui_action: {} } },
          ],
        },
      ],
      computeLabel: (schema) => uiText(`ed_${schema.name}`),
    };
  }

  static getStubConfig() {
    return {};
  }

  getCardSize() {
    if (this._row) return Math.max(1, this._lastCount || 1);
    return 3 * Math.max(1, this._lastCount || 1);
  }

  // Row: one grid row per mug in use ("auto", so two mugs in use get two rows).
  getGridOptions() {
    if (this._row) return { rows: "auto", columns: 12, min_columns: 6 };
    return { columns: 12, min_columns: 4 };
  }

  get _row() {
    return this._config?.mode === "row";
  }

  setConfig(config) {
    if (config.mode && !MODES.includes(config.mode)) throw new Error(`mode must be ${MODES.join(" or ")}`);
    this._config = {
      compact_empty: false,
      ...config,
      mode: config.mode || "full",
      // hide_sleeping is the name from 0.1.x
      show_sleeping: config.show_sleeping ?? !config.hide_sleeping,
      max_columns: Math.min(3, Math.max(1, Number(config.max_columns) || 3)),
      devices: [].concat(config.devices || config.device_id || []),
      hide: [].concat(config.hide || []),
    };
    this._sig = null;
    if (this._hass) this._update();
  }

  set hass(hass) {
    this._hass = hass;
    this._update();
  }

  _refresh() {
    this._sig = null;
    if (this._hass) this._update();
  }

  _t(key, vars = {}) {
    const lang = (this._hass?.language || "en").split("-")[0];
    const table = TEXT[lang] || TEXT.en;
    return (table[key] ?? TEXT.en[key] ?? key).replace(/\{(\w+)\}/g, (_, k) => vars[k]);
  }

  _shows(part) {
    return !this._config.hide.includes(part);
  }

  // ---- discovery -------------------------------------------------------------

  // All devices of the integration, each with its entities by translation key.
  _discover() {
    const hass = this._hass;
    const byDevice = {};
    for (const [id, reg] of Object.entries(hass.entities || {})) {
      if (reg.platform !== PLATFORM || !reg.device_id || !reg.translation_key) continue;
      (byDevice[reg.device_id] ||= {})[reg.translation_key] = id;
    }
    let ids = Object.keys(byDevice);
    if (this._config.devices.length) ids = this._config.devices.filter((d) => byDevice[d]);
    else ids.sort((a, b) => this._devName(a).localeCompare(this._devName(b)));
    return ids.map((id) => ({ id, name: this._devName(id), model: hass.devices?.[id]?.model || "", e: byDevice[id] }));
  }

  _devName(id) {
    const d = this._hass.devices?.[id];
    return d?.name_by_user || d?.name || "Ember";
  }

  _st(dev, key) {
    const id = dev.e[key];
    return id ? this._hass.states[id] : undefined;
  }

  // Battery entity, level and whether it charges (on the coaster).
  _battery(dev) {
    const st = this._st(dev, "battery_percent");
    const charging = st?.attributes?.battery_charging === true || this._st(dev, "power")?.state === "on";
    return { st, v: this._num(st), charging };
  }

  _awake(dev) {
    const st = this._st(dev, "state");
    return !!st && st.state !== "unavailable";
  }

  // ---- last battery level of a device that is asleep ------------------------
  // Asleep, the integration reports every entity as unavailable; the last level
  // before that comes from the recorder, once per sleep.

  async _fetchLastBattery(dev) {
    const id = dev.e.battery_percent;
    if (!id || dev.id in this._lastBattery) return;
    this._lastBattery[dev.id] = null;
    try {
      const start = new Date(Date.now() - 30 * 86400000).toISOString();
      const res = await this._hass.callWS({
        type: "history/history_during_period",
        start_time: start,
        entity_ids: [id],
        minimal_response: true,
        no_attributes: true,
        significant_changes_only: false,
      });
      const rows = res?.[id] || [];
      for (let i = rows.length - 1; i >= 0; i--) {
        const v = Number(rows[i].s ?? rows[i].state);
        if (rows[i].s !== "unavailable" && Number.isFinite(v)) {
          const t = rows[i].lu ?? rows[i].last_updated;
          this._lastBattery[dev.id] = { value: v, at: typeof t === "number" ? t * 1000 : Date.parse(t) };
          break;
        }
      }
      // Asleep for longer than the recorder keeps its history: take the last
      // hour of the long-term statistics instead.
      if (this._lastBattery[dev.id] == null) {
        const stats = await this._hass.callWS({
          type: "recorder/statistics_during_period",
          start_time: new Date(Date.now() - 365 * 86400000).toISOString(),
          statistic_ids: [id],
          period: "hour",
          types: ["mean"],
        });
        const last = (stats?.[id] || []).at(-1);
        if (Number.isFinite(last?.mean)) this._lastBattery[dev.id] = { value: last.mean, at: last.end };
      }
    } catch (_) {
      /* no history (recorder off or no access): the row just says asleep */
    }
    this._refresh();
  }

  // ---- actions ---------------------------------------------------------------

  async _call(domain, service, entity, data = {}) {
    if (!entity) return;
    try {
      this._error = "";
      await this._hass.callService(domain, service, { entity_id: entity, ...data });
    } catch (err) {
      this._error = this._t("error", { msg: err?.message || err });
      this._refresh();
    }
  }

  // Row tap/hold: HA runs the action (more-info by default, navigate, perform-action …).
  _action(entity, kind) {
    const config = { entity, tap_action: { action: "more-info" }, ...this._config };
    this.dispatchEvent(new CustomEvent("hass-action", { detail: { config, action: kind }, bubbles: true, composed: true }));
  }

  _moreInfo(entityId) {
    this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId }, bubbles: true, composed: true }));
  }

  _limits(dev) {
    const a = this._st(dev, "target_temp")?.attributes || {};
    const fahrenheit = String(a.unit_of_measurement || "").includes("F");
    const own = Number(this._config.target_step);
    const step = own > 0 ? own : Number(a.step) > 0 && Number(a.step) < 1 ? Number(a.step) : fahrenheit ? 1 : 0.5;
    return { min: Number(a.min ?? 48.8), max: Number(a.max ?? 63), step, unit: a.unit_of_measurement || "°C" };
  }

  // Shown target: the value just picked until the device reports it (15 s at most).
  _target(dev) {
    const p = this._pending[dev.id];
    if (p && Date.now() - p.at < 15000) return p.target;
    return this._num(this._st(dev, "target_temp"));
  }

  _ledColor(dev) {
    const p = this._pending[`${dev.id}:led`];
    if (p && Date.now() - p.at < 15000) return p.rgb;
    return this._st(dev, "led")?.attributes?.rgb_color || null;
  }

  // Plus/minus change the shown value at once and send it after a short pause,
  // so several taps become one Bluetooth write.
  _step(devId, dir) {
    const dev = this._devices.find((d) => d.id === devId);
    if (!dev) return;
    const { min, max, step } = this._limits(dev);
    const cur = this._target(dev);
    if (cur == null) return;
    const next = Math.min(max, Math.max(min, Number((Math.round((cur + dir * step) / step) * step).toFixed(1))));
    this._pending[devId] = { target: next, at: Date.now() };
    clearTimeout(this._timers[devId]);
    this._timers[devId] = setTimeout(() => {
      this._pending[devId].at = Date.now();
      this._call("number", "set_value", dev.e.target_temp, { value: next });
    }, 700);
    this._refresh();
  }

  // ---- rendering -------------------------------------------------------------

  _update() {
    if (!this._config || this._hold) return;
    const hass = this._hass;
    const devices = this._discover();
    this._devices = devices;
    for (const dev of devices) {
      const p = this._pending[dev.id];
      const reported = this._num(this._st(dev, "target_temp"));
      if (p && reported != null && Math.abs(reported - p.target) < 0.05 && Date.now() - p.at > 1000) delete this._pending[dev.id];
      const l = this._pending[`${dev.id}:led`];
      const rgb = this._st(dev, "led")?.attributes?.rgb_color;
      if (l && rgb && rgb.every((v, i) => Math.abs(v - l.rgb[i]) <= 3)) delete this._pending[`${dev.id}:led`];
    }
    const ids = devices.flatMap((d) => Object.values(d.e));
    const sig = JSON.stringify([
      ids.map((id) => {
        const s = hass.states[id];
        return [s?.state, s?.attributes?.rgb_color, s?.attributes?.battery_charging, s?.attributes?.options];
      }),
      this._pending,
      this._error,
      this._config,
      hass.language,
    ]);
    if (sig === this._sig) return;
    this._sig = sig;

    if (this._row) return this._renderTiles(devices);
    this.removeAttribute("hidden");

    const show = this._config.show_sleeping;
    for (const d of devices) {
      if (this._awake(d)) delete this._lastBattery[d.id];
      else if (show && this._shows("battery")) this._fetchLastBattery(d);
    }
    // In use: full panels. Resting (asleep, or empty if wished): one quiet panel of short rows.
    const compact = (d) => this._config.compact_empty && this._st(d, "state")?.state === "empty";
    const active = devices.filter((d) => this._awake(d) && !compact(d));
    const resting = devices.filter((d) => (this._awake(d) ? compact(d) : show));
    resting.sort((a, b) => this._awake(b) - this._awake(a));
    this._lastCount = active.length + Math.ceil(resting.length / 3);
    const shown = active.length + resting.length;

    let body = "";
    if (!devices.length) body = `<div class="note">${this._t("no_device")}</div>`;
    if (active.length) body += `<div class="list cols-${this._config.max_columns}">${active.map((d) => this._renderAwake(d)).join("")}</div>`;
    if (resting.length) body += `<div class="rest">${resting.map((d) => this._renderRow(d)).join("")}</div>`;

    const title = this._config.title ? `<div class="title">${esc(this._config.title)}</div>` : "";
    const err = this._error ? `<div class="msg" role="alert">${esc(this._error)}</div>` : "";
    this.shadowRoot.innerHTML = `<style>${this._css()}</style>
      <ha-card class="${devices.length && !shown ? "hidden" : ""}">${title}${body}${err}</ha-card>`;
  }

  _num(st) {
    return st && !OFF.includes(st.state) && Number.isFinite(Number(st.state)) ? Number(st.state) : null;
  }

  _fmtTemp(v, unit) {
    if (v == null) return "–";
    return `${new Intl.NumberFormat(this._hass.language, { maximumFractionDigits: 1 }).format(v)} ${unit}`;
  }

  // "charging" while it charges (until full), "crit"/"low" when it needs the coaster, else "".
  _batState(v, charging) {
    if (v == null) return "";
    if (charging) return v < 100 ? "charging" : "";
    return v <= BAT_CRIT ? "crit" : v <= BAT_LOW ? "low" : "";
  }

  // Badge on the mug picture: charging, low, almost empty.
  _batBadge(state) {
    const icon = { charging: "mdi:lightning-bolt", low: "mdi:battery-low", crit: "mdi:battery-alert-variant" }[state];
    return icon ? `<span class="badge bat-${state}"><ha-icon icon="${icon}"></ha-icon></span>` : "";
  }

  _batIcon(v, charging) {
    if (v == null) return "mdi:battery-unknown";
    if (!charging && v <= BAT_CRIT) return "mdi:battery-alert-variant";
    const step = Math.min(100, Math.max(10, Math.round(v / 10) * 10));
    if (charging) return `mdi:battery-charging-${step}`;
    return step === 100 ? "mdi:battery" : `mdi:battery-${step}`;
  }

  _pic(dev, level, rgb, asleep, batState = "") {
    const badge = this._shows("battery") ? this._batBadge(batState) : "";
    if (!this._shows("picture")) {
      return `<div class="icon"><ha-icon icon="${asleep ? "mdi:sleep" : "mdi:coffee-outline"}"></ha-icon>${badge}</div>`;
    }
    return `<div class="pic ${asleep ? "asleep" : ""}">${this._mugSvg(dev, asleep ? 0 : level, asleep ? null : rgb)}${badge}</div>`;
  }

  // "Stand 16:39" / "Stand 21.02." / "Stand 21.02.2025"
  _asOf(ms) {
    const at = new Date(ms);
    const now = new Date();
    const opts =
      at.toDateString() === now.toDateString()
        ? { hour: "2-digit", minute: "2-digit" }
        : at.getFullYear() === now.getFullYear()
          ? { day: "2-digit", month: "2-digit" }
          : { day: "2-digit", month: "2-digit", year: "numeric" };
    return this._t("as_of", { when: new Intl.DateTimeFormat(this._hass.language, opts).format(at) });
  }

  // A resting device: asleep, or awake but empty (with compact_empty).
  _renderRow(dev) {
    const awake = this._awake(dev);
    let battery = "";
    if (this._shows("battery")) {
      if (awake) {
        const { st: bat, v, charging } = this._battery(dev);
        if (bat && v != null) {
          const bs = this._batState(v, charging);
          battery = `<button class="bat bat-${bs}" data-act="more" data-entity="${bat.entity_id}" aria-label="${this._t(charging ? "charging" : "battery")}: ${Math.round(v)} %">
            <span class="bat-v"><ha-icon icon="${this._batIcon(v, charging)}"></ha-icon>${Math.round(v)} %</span>
            </button>`;
        }
      } else {
        const last = this._lastBattery[dev.id];
        if (Number.isFinite(last?.value)) {
          // the battery drains while asleep, so the value always says when it was read
          battery = `<div class="bat bat-${this._batState(last.value, false)}">
            <span class="bat-v"><ha-icon icon="${this._batIcon(last.value, false)}"></ha-icon>${Math.round(last.value)} %</span>
            ${Number.isFinite(last.at) ? `<span class="bat-t">${this._asOf(last.at)}</span>` : ""}</div>`;
        }
      }
    }
    const status = awake ? this._t("st_empty") : this._t("asleep");
    const b = this._battery(dev);
    const rowState = awake ? this._batState(b.v, b.charging) : this._batState(this._lastBattery[dev.id]?.value, false);
    return `
      <div class="row ${awake ? "" : "asleep"}">
        ${this._pic(dev, 0, null, !awake, rowState)}
        <div class="text">
          <div class="r-name">${esc(dev.name)}</div>
          <div class="sub">${status}</div>
        </div>
        ${battery}
      </div>`;
  }

  _renderAwake(dev) {
    const state = this._st(dev, "state")?.state;
    const color = STATE_COLOR[state] || "var(--primary-text-color)";
    const curSt = this._st(dev, "current_temp");
    const temp = this._num(curSt);
    const level = this._num(this._st(dev, "liquid_level"));
    const { st: bat, v: batVal, charging } = this._battery(dev);
    const ctrl = this._st(dev, "temperature_control");
    const ctrlOn = ctrl?.state === "on";
    const lim = this._limits(dev);
    const target = this._target(dev);
    const pending = !!this._pending[dev.id];
    const led = this._st(dev, "led");
    const rgb = this._ledColor(dev);
    const empty = state === "empty";
    const statusText = state ? this._t(`st_${state}`) : this._t("st_unknown");
    const unit = curSt?.attributes?.unit_of_measurement || lim.unit;

    // head: picture, name, temperature, state; keep warm as the round button
    const big = empty || temp == null ? statusText : this._fmtTemp(temp, unit);
    const subParts = [];
    if (!empty && temp != null) subParts.push(`<span style="color:${color}">${esc(statusText)}</span>`);
    if (ctrlOn && target != null && !this._shows("target")) subParts.push(esc(this._t("target", { value: this._fmtTemp(target, lim.unit) })));
    // charging / low / almost empty shows as a badge on the mug and a coloured chip
    const batState = this._shows("battery") ? this._batState(batVal, charging) : "";
    const power = this._powerBtn(ctrl);
    const bar = this._levelBar(level);
    const head = `
      <div class="head">
        ${this._pic(dev, level, rgb, false, batState)}
        <div class="text">
          <div class="name">${esc(dev.name)}</div>
          <div class="status">${esc(big)}</div>
          ${subParts.length ? `<div class="sub">${subParts.join(" · ")}</div>` : ""}
        </div>
        ${power}
        ${bar}
      </div>`;

    // controls: preset drop-down and target temperature, like the airfryer card
    const pre = this._st(dev, "temperature_preset");
    const presetSel =
      ctrlOn && this._shows("presets") && pre?.attributes?.options?.length
        ? `<select data-act="preset" data-entity="${pre.entity_id}" aria-label="${this._t("preset")}">
            ${OFF.includes(pre.state) ? `<option value="" selected>${this._t("preset_none")}</option>` : ""}
            ${pre.attributes.options
              .map((o) => {
                const label = TEXT.en[`p_${o}`] ? this._t(`p_${o}`) : o.replace(/[-_]/g, " ");
                return `<option value="${esc(o)}" ${pre.state === o ? "selected" : ""}>${esc(label)}</option>`;
              })
              .join("")}
          </select>`
        : "";
    const stepper =
      ctrlOn && this._shows("target") && dev.e.target_temp
        ? `<div class="stepper">
            <button data-act="step" data-dev="${dev.id}" data-dir="-1" ${target == null || target <= lim.min ? "disabled" : ""}
              aria-label="${this._t("lower")}"><ha-icon icon="mdi:minus"></ha-icon></button>
            <span class="val ${pending ? "pending" : ""}" aria-live="polite">${this._fmtTemp(target, lim.unit)}</span>
            <button data-act="step" data-dev="${dev.id}" data-dir="1" ${target == null || target >= lim.max ? "disabled" : ""}
              aria-label="${this._t("raise")}"><ha-icon icon="mdi:plus"></ha-icon></button>
          </div>`
        : "";
    const controls = presetSel || stepper ? `<div class="controls">${presetSel}${stepper}</div>` : "";

    // small things: battery and LED color
    const battery =
      bat && this._shows("battery")
        ? `<button class="btn small bat-${batState}" data-act="more" data-entity="${bat.entity_id}"
             aria-label="${this._t(charging ? "charging" : "battery")}: ${batVal == null ? "–" : Math.round(batVal)} %">
             <ha-icon icon="${this._batIcon(batVal, charging)}"></ha-icon>${
               batVal == null ? "–" : `${Math.round(batVal)} %`
             }</button>`
        : "";
    const ledPick =
      led && this._shows("led") && !OFF.includes(led.state)
        ? `<label class="btn small" title="${this._t("led_color")}">
             <span class="swatch" style="background:${rgb ? `rgb(${rgb.join(",")})` : "var(--disabled-color)"}"></span>${this._t("led")}
             <input type="color" data-act="led" data-dev="${dev.id}" data-entity="${led.entity_id}"
               value="${rgb ? toHex(rgb) : "#ffffff"}" aria-label="${this._t("led_color")}">
           </label>`
        : "";
    const extras = battery || ledPick ? `<div class="extras">${battery}${ledPick}</div>` : "";

    return `<div class="dev">${head}${controls}${extras}</div>`;
  }

  // Keep warm as the round button (full card and row).
  _powerBtn(ctrl) {
    if (!ctrl || !this._shows("keep_warm")) return "";
    const on = ctrl.state === "on";
    return `<button class="power ${on ? "on" : ""}" data-act="toggle" data-entity="${ctrl.entity_id}"
      role="switch" aria-checked="${on}" title="${this._t(on ? "keep_warm_on" : "keep_warm_off")}"
      aria-label="${this._t("keep_warm")}"><ha-icon icon="mdi:${on ? "fire" : "fire-off"}"></ha-icon></button>`;
  }

  _levelBar(level) {
    if (!this._shows("level") || level == null) return "";
    return `<div class="bar" role="progressbar" aria-label="${this._t("level")}" aria-valuenow="${Math.round(level)}"
      aria-valuemin="0" aria-valuemax="100"><div style="width:${Math.max(0, Math.min(100, level))}%"></div></div>`;
  }

  // ---- row (mode: row) ------------------------------------------------------
  // One tile-sized card per mug in use; asleep mugs are left out, so with all
  // asleep the card takes no room.
  _renderTiles(devices) {
    const awake = devices.filter((d) => this._awake(d));
    this._lastCount = awake.length;
    this.toggleAttribute("hidden", !awake.length);
    const err = this._error ? `<div class="msg" role="alert">${esc(this._error)}</div>` : "";
    this.shadowRoot.innerHTML = `<style>${this._css()}</style>
      <div class="tiles">${awake.map((d) => this._renderTile(d)).join("")}${err}</div>`;
  }

  _renderTile(dev) {
    const state = this._st(dev, "state")?.state;
    const curSt = this._st(dev, "current_temp");
    const temp = this._num(curSt);
    const level = this._num(this._st(dev, "liquid_level"));
    const { v: batVal, charging } = this._battery(dev);
    const ctrl = this._st(dev, "temperature_control");
    const lim = this._limits(dev);
    const target = this._target(dev);
    const unit = curSt?.attributes?.unit_of_measurement || lim.unit;
    const statusText = state ? this._t(`st_${state}`) : this._t("st_unknown");
    const batState = this._shows("battery") ? this._batState(batVal, charging) : "";

    // "58 °C → 57 °C · Perfekt"; empty or no reading: just the state
    let line = `<span style="color:${STATE_COLOR[state] || "inherit"}">${esc(statusText)}</span>`;
    if (state !== "empty" && temp != null) {
      const now = this._fmtTemp(temp, unit);
      const goal = ctrl?.state === "on" && target != null ? this._fmtTemp(target, lim.unit) : now;
      line = `<span class="t-temp">${now}${goal !== now ? ` → ${goal}` : ""}</span> · ${line}`;
    }
    const main = dev.e.current_temp || dev.e.state;
    return `
      <ha-card class="tile" data-tap="${main}" role="button" tabindex="0" aria-label="${esc(dev.name)}"><div class="t-in">
        <div class="t-icon">${this._pic(dev, level, this._ledColor(dev), false, batState)}</div>
        <div class="text">
          <div class="r-name">${esc(dev.name)}</div>
          <div class="sub t-line">${line}</div>
          ${state !== "empty" ? this._levelBar(level) : ""}
        </div>
        ${this._powerBtn(ctrl)}
      </div></ha-card>`;
  }

  _mugSvg(dev, level, rgb) {
    const s = SHAPES[shapeFor(dev.model)];
    const id = `m${dev.id.replace(/[^a-z0-9]/gi, "")}`;
    const lvl = Math.max(0, Math.min(100, level ?? 0));
    const y = s.bottom - ((s.bottom - s.top) * lvl) / 100;
    const glow = rgb ? `rgb(${rgb.join(",")})` : "var(--divider-color)";
    return `
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <defs><clipPath id="${id}c"><path d="${s.inner}"/></clipPath></defs>
        ${s.handle ? `<path class="handle" d="${s.handle}"/>` : ""}
        <path class="body" d="${s.body}"/>
        <path class="inner" d="${s.inner}"/>
        ${lvl > 0 ? `<rect class="liquid" x="0" y="${y.toFixed(1)}" width="100" height="100" clip-path="url(#${id}c)"/>` : ""}
        <rect x="30" y="92" width="30" height="4" rx="2" style="fill:${glow}"/>
      </svg>`;
  }

  // Same building blocks as the cremalink and airfryer cards.
  _css() {
    return `
      :host { display: block; container-type: inline-size; }
      ha-card { padding: 12px 14px; }
      ha-card.hidden { display: none; }
      .title { font-size: 16px; font-weight: 500; margin: 2px 2px 10px; }
      .note { color: var(--secondary-text-color); padding: 4px; }
      .list { display: grid; grid-template-columns: minmax(0, 1fr); gap: 10px; align-items: start; }
      @container (min-width: 620px) { .list:not(.cols-1) { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
      @container (min-width: 960px) { .list.cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); } }

      /* resting devices: one quiet panel, a short row each */
      .rest { padding: 2px 12px; border-radius: var(--ha-card-border-radius, 12px); background: var(--secondary-background-color); }
      .list + .rest { margin-top: 10px; }
      .row { display: grid; grid-template-columns: 28px minmax(0, 1fr) auto; column-gap: 12px; align-items: center; padding: 8px 0; }
      .row + .row { border-top: 1px solid var(--divider-color); }
      .row .pic, .row .icon { width: 28px; }
      .row .icon { --mdc-icon-size: 22px; }
      .r-name { font-size: 14px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .bat { all: unset; display: flex; flex-direction: column; align-items: flex-end; font-size: 13px; color: var(--secondary-text-color);
        font-variant-numeric: tabular-nums; }
      button.bat { cursor: pointer; padding: 2px 6px; margin-right: -6px; border-radius: 8px; }
      button.bat:hover { background: var(--card-background-color); }
      .bat-v { display: inline-flex; align-items: center; gap: 2px; color: var(--primary-text-color); }
      .bat-v ha-icon { --mdc-icon-size: 16px; color: var(--secondary-text-color); }
      .bat-t { font-size: 12px; }
      /* battery: the badge on the mug is the one loud signal; chips and rows only colour their icon */
      .bat-low ha-icon { color: var(--warning-color) !important; }
      .bat-crit ha-icon { color: var(--error-color) !important; }
      .bat-charging ha-icon { color: var(--success-color) !important; }
      .pic, .icon { position: relative; }
      .badge { position: absolute; top: -5px; right: -7px; width: 24px; height: 24px; border-radius: 50%; display: flex;
        align-items: center; justify-content: center; box-shadow: 0 0 0 2px var(--secondary-background-color); }
      .badge ha-icon { --mdc-icon-size: 16px; color: var(--text-primary-color) !important; }
      .badge.bat-low { background: var(--warning-color); }
      .badge.bat-crit { background: var(--error-color); }
      .badge.bat-charging { background: var(--success-color); animation: bat-pulse 2.4s ease-in-out infinite; }
      .row .badge { width: 16px; height: 16px; top: -5px; right: -3px; }
      .row .badge ha-icon { --mdc-icon-size: 11px; }
      @keyframes bat-pulse { 50% { opacity: .55; } }
      @media (prefers-reduced-motion: reduce) { .badge.bat-charging { animation: none; } }

      .dev { padding: 10px 12px; border-radius: var(--ha-card-border-radius, 12px); background: var(--secondary-background-color); }
      .head { display: grid; grid-template-columns: 56px minmax(0, 1fr) auto; column-gap: 14px; align-items: center; }
      .text { display: flex; flex-direction: column; min-width: 0; }
      .name { font-size: 14px; color: var(--secondary-text-color); line-height: 1.2; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .status { font-size: 22px; line-height: 1.2; font-weight: 600; font-variant-numeric: tabular-nums; }
      .sub { font-size: 12px; color: var(--secondary-text-color); }
      .icon { --mdc-icon-size: 40px; color: var(--secondary-text-color); display: flex; justify-content: center; }
      .bar { grid-column: 1 / -1; margin-top: 8px; height: 6px; border-radius: 3px; background: var(--divider-color); overflow: hidden; }
      .bar div { height: 100%; border-radius: 3px; background: var(--accent-color, var(--primary-color)); transition: width .6s ease; }

      .pic svg { width: 100%; height: auto; display: block; }
      .pic.asleep { opacity: .5; }
      .body { fill: var(--card-background-color); stroke: var(--accent-color, var(--secondary-text-color)); stroke-width: 3; stroke-linejoin: round; }
      .handle { fill: none; stroke: var(--accent-color, var(--secondary-text-color)); stroke-width: 6; stroke-linecap: round; }
      .pic.asleep .body, .pic.asleep .handle { stroke: var(--secondary-text-color); }
      .inner { fill: var(--secondary-background-color); }
      .liquid { fill: var(--brown-color, var(--secondary-text-color)); transition: y .6s ease; }

      .power { all: unset; box-sizing: border-box; width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center;
        cursor: pointer; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--secondary-text-color); }
      .power ha-icon { --mdc-icon-size: 22px; }
      .power:hover { filter: brightness(1.08); }
      .power.on { background: var(--primary-color); border-color: var(--primary-color); color: var(--text-primary-color); }

      .controls { display: grid; grid-template-columns: repeat(auto-fit, minmax(128px, 1fr)); gap: 8px; margin-top: 10px; }
      select, .stepper, .btn { box-sizing: border-box; min-height: 38px; border-radius: var(--ha-card-border-radius, 12px);
        border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color); font: inherit; }
      select { width: 100%; padding: 0 8px; min-width: 0; text-overflow: ellipsis; cursor: pointer; }
      .stepper { display: flex; align-items: center; justify-content: space-between; overflow: hidden; }
      .stepper button { all: unset; box-sizing: border-box; width: 36px; align-self: stretch; display: flex;
        align-items: center; justify-content: center; cursor: pointer; color: var(--primary-color); }
      .stepper button:hover { background: var(--secondary-background-color); }
      .stepper ha-icon { --mdc-icon-size: 18px; }
      .val { font-size: 15px; font-weight: 600; white-space: nowrap; font-variant-numeric: tabular-nums; color: var(--accent-color, var(--primary-text-color)); }
      .val.pending { opacity: .6; }

      .extras { display: flex; gap: 8px; margin-top: 8px; flex-wrap: wrap; }
      .btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 0 12px; cursor: pointer; position: relative; }
      .btn.small { min-height: 32px; font-size: 13px; padding: 0 10px; color: var(--secondary-text-color); }
      .btn:hover { background: var(--secondary-background-color); border-color: var(--primary-color); }
      .btn ha-icon { --mdc-icon-size: 18px; }
      .swatch { width: 12px; height: 12px; border-radius: 50%; box-shadow: 0 0 0 1px var(--divider-color); }
      .btn input[type="color"] { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; border: 0; padding: 0; }

      button[disabled] { opacity: .4; cursor: default; pointer-events: none; }
      button:focus-visible, select:focus-visible, .btn:focus-within { outline: 2px solid var(--primary-color); outline-offset: 2px; }
      .msg { margin-top: 8px; font-size: 13px; color: var(--error-color); }

      @container (max-width: 360px) {
        ha-card { padding: 10px; }
        .head { grid-template-columns: 44px minmax(0, 1fr) auto; column-gap: 10px; }
        .status { font-size: 18px; }
      }
      @media (prefers-reduced-motion: reduce) { .liquid, .bar div { transition: none; } }

      /* row: tile-sized, one per mug in use */
      :host([hidden]) { display: none; }
      .tiles { display: flex; flex-direction: column; gap: 8px; }
      ha-card.tile { padding: 0; cursor: pointer; overflow: hidden; }
      .t-in { box-sizing: border-box; height: 56px; padding: 0 10px; display: grid; grid-template-columns: 40px minmax(0, 1fr) auto;
        column-gap: 10px; align-items: center; }
      ha-card.tile:hover { background: color-mix(in srgb, var(--primary-text-color) 4%, var(--card-background-color)); }
      ha-card.tile:focus-visible { outline: 2px solid var(--primary-color); outline-offset: -2px; }
      /* like the tiles around it: the icon stands free, the button is a rounded square */
      .t-icon { width: 40px; height: 40px; display: grid; place-items: center; }
      .t-icon .pic { width: 32px; }
      .t-icon .icon { --mdc-icon-size: 24px; color: var(--accent-color, var(--primary-color)); }
      .t-icon .inner { fill: var(--secondary-background-color); }
      .t-icon .badge { width: 16px; height: 16px; top: -6px; right: -7px; box-shadow: 0 0 0 2px var(--card-background-color); }
      .t-icon .badge ha-icon { --mdc-icon-size: 11px; }
      .tile .r-name { line-height: 20px; }
      .t-line { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; line-height: 16px; }
      .t-temp { color: var(--primary-text-color); font-variant-numeric: tabular-nums; }
      .tile .bar { margin-top: 4px; height: 3px; border-radius: 2px; }
      .tile .power { width: 48px; height: 36px; border: 0; border-radius: 12px; color: var(--primary-text-color);
        background: color-mix(in srgb, var(--primary-text-color) 6%, transparent); }
      .tile .power.on { color: var(--primary-color); background: color-mix(in srgb, var(--primary-color) 20%, transparent); }
      .tile .power:focus-visible { outline-offset: 2px; }
      .tile .power ha-icon { --mdc-icon-size: 20px; }
      .tiles .msg { margin: 0 4px; }
    `;
  }
}

customElements.define("ember-card", EmberCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "ember-card",
  name: "Ember",
  description: "All your Ember mugs, cups, tumblers and travel mugs: temperature, keep warm, target, presets, fill level, battery and LED color.",
  preview: true,
});

console.info(`%c EMBER-CARD %c ${CARD_VERSION} `, "font-weight: 700", "");
