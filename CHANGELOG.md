# Changelog

## 0.1.1 (2026-11-15)

- **Fix:** cycling showed absurd numbers (Wolf: Ø 0,4 min, 982 starts a day, −347.000 starts/year). Wolf's cloud
  now and then reports a bogus value of the starts counter for a few minutes (327680 between 333890 and 333892); the
  card took the difference as starts. Readings that fall or rise faster than one start per minute are now skipped;
  a new value is only followed when the next reading continues from it (real reset)

## 0.1.0 (2026-11-15)

First release.

- **Detection** of the Wolf SmartSet (`wolflink`) and Viessmann ViCare (`vicare`) entities by role (German or English
  names, translation keys); every role can be overridden under `entities:`, `outdoor_entity` replaces the heating's
  outdoor sensor
- **Header** with the cycling rating, **now** section with an animated flame (three flickering layers, glow, sparks;
  height follows the modulation; off: outline only; calm with reduced motion), temperature tiles with targets (ViCare
  flow target from the heating curve of the active program), pumps, plausibility check of the room temperature
- **Optimisation tips** from fixed rules (short cycling, hot-water charges, weather compensation, room target,
  heating-curve level, circulation, heating in summer weather) with evidence, reasons, steps and a rough saving; a
  button sets ViCare number entities after a confirmation (`number.set_value`); done / hidden is kept in Home
  Assistant's per-user frontend data; done tips compare burner hours per heating degree day before and after
- **Burner** panel with three scrubbable views: cycling over 7 days from the history (to the minute, starts from the
  counter or the off→on changes, rating < 5 / 5–10 / > 10 min per start), 30 days of burner hours with the outdoor
  temperature and hours per heating degree day, 13 months next to the previous year
- **Heating curve** from the hourly means of the last 48 hours (setback / hot-water priority found from the data,
  trend line; ViCare: the set curves for the normal and reduced program)
- **Hot water:** cylinder over 48 hours against the target, charges and circulation hours per day
- **Solar** (ViCare): yield per day over 30 days, collector and cylinder, solar pump hours, 12-month yield with the
  best month and the fuel it replaced
- **Efficiency** over 30 days: burner hours and starts per heating degree day, share of burner stage 2, modulation while
  running, fuel per burner hour and per degree day (`fuel_entity`), summer base load
- **Footer:** burner hours and starts with the mean running time, hours and starts since the last service
  (`maintenance_date`), how reachable the cloud was over 7 days
- **Mini card** with flame, rating, starts today, temperatures and a sparkline; opens the main card as a popup or
  expands it below
- Visual editor for both cards, German and English
