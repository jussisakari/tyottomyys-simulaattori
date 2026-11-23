# Työttömyys-simulaattori – notes for Claude

A dry black-comedy browser game: one day (07:00 → 07:00) in the life of Keijo, an
unemployed 45-year-old Finn in a messy studio flat. Send 4 job applications before midnight
or Kela stops the money. `PLAN.md` describes every scene and feature.

## Rules of the project
- Plain HTML + classic scripts, no build step, must work from `file://`. Namespace `window.TS`.
- Game texts in Finnish, **all in `js/texts.js`**, except phone conversations, which are
  dialogue trees in `js/calls.js` (run with `TS.talk(tree, 'start')`). Code comments in English.
- Look: "a bit pixel-y" flat cartoon. The game world is 320x180 units, and the canvas is 960x540
  (3x) so text and shapes are smooth. Draw with `TS.rect`, `TS.ell`, `TS.rbox` and `TS.text`
  (a smooth sans font; sizes in units, `s: 1` = normal). Keijo is drawn with shapes in `sprites.js`.
- Time passes only through `TS.advance(min)` / `TS.doAction({...})`. Timed events are in `js/events.js`.
- No real brands or real people, except the place names Kela, TE-palvelut, Alko and the
  Sabrina poster that the user asked for.
- New script files go into the `files` list of the loader in `index.html` (the order matters: scenes after `events.js`, `main.js` last).

## Releases
Bump the number in `version.txt` before every push to `main`: the loader in `index.html` adds it to every script address, so phones load the new files instead of old cached ones.
Live at https://jussisakari.github.io/tyottomyys-simulaattori/ (GitHub Pages, built from the
`main` branch root): every push to `main` updates the live game. Releases are tags + GitHub
releases made with `gh release create vN`.

## Testing
Shortcuts in the address are listed at the top of `js/main.js`
(e.g. `index.html#t=14:50&hak=3`, `#paikka=bar`, `#scene=laptop&phone`, `#loppu`).
The laptop is slow: keep headless Chrome runs short and kill headless Chrome afterwards:
`Get-CimInstance Win32_Process -Filter "name='chrome.exe'" | ? { $_.CommandLine -like '*headless*' } | % { Stop-Process -Id $_.ProcessId -Force }`
