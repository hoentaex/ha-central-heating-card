# Central Heating Card

[![Validate](https://github.com/hoentaex/ha-central-heating-card/actions/workflows/validate.yml/badge.svg)](https://github.com/hoentaex/ha-central-heating-card/actions/workflows/validate.yml)
[![HACS Validation](https://github.com/hoentaex/ha-central-heating-card/actions/workflows/hacs.yml/badge.svg)](https://github.com/hoentaex/ha-central-heating-card/actions/workflows/hacs.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**[Deutsch](#deutsch) · [English](#english)**

> [!NOTE]
> **In Arbeit.** Die Karte entsteht in Phasen; Phase 1 (Gerüst, Erkennung, „Jetzt“, Mini-Karte) ist fertig.
> Verlauf, Heizkurve, Warmwasser, Solar, Effizienz und Optimierungs-Hinweise folgen.

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
- **Mini-Karte:** eine Zeile mit Flamme, Status, Kessel, Warmwasser und Außentemperatur.

### Konfiguration

```yaml
type: custom:central-heating-card
preset: auto            # auto | wolflink | vicare
name: Heizung Wolf
outdoor_entity: sensor.wetter_aussentemperatur   # optional, ersetzt den Außenfühler der Heizung
entities:               # optional: einzelne Rollen überschreiben ("" blendet sie aus)
  room_temp: ""
hide: [room]            # optional: boiler, flow, dhw, outdoor, room, pumps
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
