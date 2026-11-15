# Changelog

## 0.1.0 (in Arbeit)

- **Phase 1:** scaffold, entity detection for Wolf SmartSet (`wolflink`) and Viessmann ViCare (`vicare`), header with
  status, "now" section with an animated flame (height follows the modulation), temperature tiles with targets
  (ViCare flow target from the heating curve), pumps, plausibility check of the room temperature, mini card
- **Phase 2:** burner panel with three scrubbable views: cycling over the last 7 days from the history (starts from
  the counter or the burner's off→on changes, running time to the minute, rating < 5 / 5–10 / > 10 min per start),
  30 days of burner hours with the outdoor temperature and hours per heating degree day, 13 months next to the
  previous year; the header pill and the mini card (sparkline, starts today) show the cycling rating
- **Phase 3:** heating curve from the hourly means of the last 48 hours (flow over outdoor temperature, setback or
  hot-water-priority hours found from the data, trend line; ViCare: the set curves for the normal and reduced
  program from slope, level and room targets); hot water: cylinder over 48 hours against the target, charges per
  day and circulation hours per day from the pumps' history
