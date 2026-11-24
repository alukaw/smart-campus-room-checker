# Appsmith app "Smart Campus A101 Low-code" – widget and binding manifest

Platform: Appsmith Cloud (app.appsmith.com), free plan, fixed-layout canvas, one page (Page1).
Export check (24 Nov 2026, "Export application" API): JSON, 74,809 bytes, serverSchemaVersion 13, clientSchemaVersion 2, 10 widgets (incl. canvas), 1 JS object, 9 JS functions, 0 datasources.

The full export JSON can be downloaded from the app menu (app name ▸ Export application). It is Appsmith-specific and can only be imported into another Appsmith instance (Cloud or self-hosted).

| Widget | Type | Key properties / bindings |
|---|---|---|
| TitleText | Text | static title, "fictional data, now = 09:00" |
| StartInput | Input (Single-line text) | label "Start time (HH:MM)", placeholder "e.g. 13:30"; no widget-level validation (rules live in the JS object) |
| DurationInput | Input (Number) | label "Duration (minutes)", placeholder "e.g. 60"; no Min/Max (rules live in the JS object) |
| BlockedSwitch | Switch | label "Room blocked for maintenance", default state off (room-status control) |
| CheckButton | Button | label "Check A101"; onClick: *Execute a JS function* → `AvailabilityRules.check()` (set with the visual action selector) |
| ResultText | Text | `{{AvailabilityRules.result.status}}` / `{{AvailabilityRules.result.message}}` / `Reason code: {{AvailabilityRules.result.reasonCode}}`; background colour bound to the status (green / red / amber / grey) |
| BookingsTable | Table v2 | Table data `{{AvailabilityRules.bookingRows()}}`; read-only (no inline editing, no "add row") |
| SelfTestButton | Button | label "Run T1-T8 self-test"; onClick `{{AvailabilityRules.runContractTests()}}` |
| SelfTestTable | Table v2 | Table data `{{AvailabilityRules.testRows}}` |

JS object source: [`AvailabilityRules.js`](AvailabilityRules.js) (98 lines) – copied 1:1 from the Appsmith editor.

Labelled workarounds / simulated behaviour:

- Bookings are a static JS array inside the JS object (no datasource) – a simulated data store.
- "now" is fixed at 09:00 – simulated clock.
- The self-test button is a workaround: Appsmith has no built-in unit-test runner, so T1–T8 are re-run through the same `evaluate()` function inside the app.
- The business rules are a small script (JS object), not pure visual configuration.
