# Central Heating Card

[![Validate](https://github.com/hoentaex/ha-central-heating-card/actions/workflows/validate.yml/badge.svg)](https://github.com/hoentaex/ha-central-heating-card/actions/workflows/validate.yml)
[![HACS Validation](https://github.com/hoentaex/ha-central-heating-card/actions/workflows/hacs.yml/badge.svg)](https://github.com/hoentaex/ha-central-heating-card/actions/workflows/hacs.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**[Deutsch](#deutsch) · [English](#english)**

> [!NOTE]
> **In Arbeit.** Die Karte entsteht in Phasen; fertig sind „Jetzt“, Brenner, Heizkurve, Warmwasser, Solar,
> Effizienz und Fußzeile. Optimierungs-Hinweise, Editor und Popup folgen.

---

## Deutsch

Lovelace-Karte für eine **Öl- oder Gas-Zentralheizung**: Brenner mit animierter Flamme, Temperaturen mit Soll-Werten
und Pumpen in einer Karte. Sie findet die Entitäten der Integrationen
[Wolf SmartSet](https://www.home-assistant.io/integrations/wolflink/) (`wolflink`) und
[Viessmann ViCare](https://www.home-assistant.io/integrations/vicare/) (`vicare`) selbst.

Aufbau und Look orientieren sich an den Karten von [juju35](https://github.com/juju35). Schwesterprojekte:
[Oil Overview Card](https://github.com/hoentaex/ha-oil-overview-card),
[Energy Overview Card](https://github.com/hoentaex/ha-energy-overview-card),
[Tibber Battery Card](https://github.com/hoentaex/ha-tibber-battery-card).

> [!WARNING]
> **Privates Hobbyprojekt.** Die Karte ist für meine eigene Installation entstanden und wird in der Freizeit gepflegt.
> Es gibt keine Gewährleistung und keinen Support: **Die Nutzung erfolgt auf eigene Gefahr.**

### Was die Karte zeigt (Phase 1)

- **Kopf:** Flamme, Name, Hersteller · Betriebsart · Programm · Stand, Status (Brenner läuft, Warmwasser lädt,
  Bereit, Keine Verbindung).
- **Jetzt:** Brenner mit animierter Flamme – die Höhe folgt der Modulation (Viessmann), bei Wolf eine feste Höhe.
  Kacheln für Kessel, Vorlauf, Warmwasser und Außen mit Soll-Balken. Bei Viessmann berechnet die Karte das
  Vorlauf-Soll aus der eingestellten Heizkurve (Steigung, Niveau, Raum-Soll des aktiven Programms).
  Pumpen als Chips. Eine unplausible Raumtemperatur (unter 8 oder über 30 °C, z. B. Fühler am Kessel) wird
  durchgestrichen.
- **Brenner** in drei Ansichten, mit Finger oder Maus abfahrbar:
  - **Takt 7 Tage:** Starts je Tag und Ø Laufzeit je Start aus dem Verlauf (minutengenau), Balken in Ampelfarben
    (unter 5 min rot, 5–10 min gelb, darüber grün). Starts kommen vom Startzähler oder – ohne Zähler – aus den
    Wechseln aus → an. Die Ampel steht auch im Kopf.
  - **30 Tage:** Brennerstunden je Tag mit Außentemperatur, Stunden je Heizgradtag.
  - **12 Monate:** Brennerstunden je Monat neben dem Vorjahresmonat, mit Starts und Laufzeit je Start.
- **Heizkurve** (letzte 48 h): Vorlauf über Außentemperatur aus Stundenmitteln, Normalbetrieb als Punkte,
  Absenkung oder Warmwasser-Vorrang als Ringe (aus den Daten erkannt), Trendlinie mit „°C Vorlauf bei 0 °C“ und
  „K je 1 K kälter“. Bei Viessmann zusätzlich die eingestellten Soll-Kurven (normal und reduziert).
- **Warmwasser** (letzte 48 h): Speichertemperatur gegen Soll, Ladungen je Tag mit Dauer und Zirkulationsstunden je
  Tag aus dem Verlauf der Pumpen.
- **Solar** (nur Viessmann): Ertrag je Tag über 30 Tage, Kollektor- und Speichertemperatur, Laufzeit der
  Solarpumpe, Ertrag der letzten 12 Monate mit bestem Monat und dem ersetzten Brennstoff.
- **Effizienz** (30 Tage): Brennerstunden und Starts je Heizgradtag, Anteil der 2. Brennerstufe (Wolf), Modulation
  im Betrieb (Viessmann), Brennstoff je Brennerstunde und je Heizgradtag (mit `fuel_entity`), Sommer-Grundlast.
- **Fußzeile:** Brennerstunden und Starts mit Ø Laufzeit je Start, Stunden und Starts seit der letzten Wartung
  (`maintenance_date`), Erreichbarkeit der Hersteller-Cloud über 7 Tage.
- **Mini-Karte:** eine Zeile mit Flamme, Takt-Ampel, Starts heute, Kessel, Warmwasser, Außentemperatur und einem
  kleinen Balkendiagramm der Starts.

### Konfiguration

```yaml
type: custom:central-heating-card
preset: auto            # auto | wolflink | vicare
name: Heizung Wolf
outdoor_entity: sensor.wetter_aussentemperatur   # optional, ersetzt den Außenfühler der Heizung
entities:               # optional: einzelne Rollen überschreiben ("" blendet sie aus)
  room_temp: ""
hide: [room]            # optional: boiler, flow, dhw, outdoor, room, pumps
sections: [header, now, burner, curve, dhw, solar, efficiency, footer]
fuel: oil               # oil | gas
fuel_entity: sensor.oilfox_verbrauch_gesamt     # optional, Zähler in L bzw. m³ (total_increasing)
kwh_per_unit: 10        # Energie je L bzw. m³ (für „ersetzt“ beim Solar)
boiler_efficiency: 0.85
maintenance_date: "2026-04-15"   # optional, letzte Wartung
default_view: takt      # takt | days | months
heating_base_temp: 15  # Heizgrenze für Heizgradtage
takt_warn_min: 5        # Ampel: rot unter 5 min je Start
takt_good_min: 10       # Ampel: grün ab 10 min je Start
animations: true
```

```yaml
type: custom:central-heating-mini-card
preset: vicare
name: Heizung Viessmann
```

Rollen: `burner`, `modulation`, `boiler_temp`, `boiler_target`, `boiler_supply`, `flow_temp`, `dhw_temp`,
`dhw_target`, `outdoor`, `room_temp`, `room_target`, `mode`, `pump_boiler`, `pump_heating`, `pump_mixer`,
`pump_dhw_charge`, `pump_dhw_circ`, `pump_solar`, `curve_slope`, `curve_shift`, `normal_temp`, `reduced_temp`,
`comfort_temp`, `burner_hours`, `burner_hours_2`, `burner_starts`, `solar_collector`, `solar_storage`, `solar_today`.

### Entwicklung

```bash
npm install
npm run demo     # http://127.0.0.1:8772/demo/
npm test
npm run check
```

---

## English

Lovelace card for an **oil or gas central heating**: burner with an animated flame, temperatures with their targets
and pumps in one card. It finds the entities of the Wolf SmartSet (`wolflink`) and Viessmann ViCare (`vicare`)
integrations by itself; every role can be overridden under `entities:`. Work in progress – see the German section for
the options.

> [!WARNING]
> **Private hobby project**, no warranty, no support: **use at your own risk.**

MIT licence.
