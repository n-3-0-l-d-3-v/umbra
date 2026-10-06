# Umbra

**Don't watch the algorithm. Fly it.**

Umbra is a set of three short browser games built for a Design and Analysis of Algorithms course. In each one you take the place of a classic algorithm and make every decision it would make. Your moves are scored against par, the fewest decisions the algorithm itself needs.

**Live:** https://umbra-daa.vercel.app

## Missions

| # | Mission | Algorithm | What you decide |
|---|---|---|---|
| 01 | **Convoy** | Merge sort | Where to cut the array, and which of two sorted lanes sends its front pod next |
| 02 | **Signal Lock** | Binary search | Which sector to ping to find a hidden value in a sorted row (or prove it is not there) |
| 03 | **Starlane** | Dijkstra's algorithm | Which star to settle next on a weighted graph |

Every round is generated fresh. Convoy rotates through seven input patterns (scrambled, nearly sorted, reversed, many duplicates and others), Signal Lock changes its spacing and sometimes hides a value that is not in the row, and Starlane builds a new star map with new lanes and costs each time.

## Two modes

- **Manual** – the simulation stops at every point where the algorithm has to choose and waits for you. A wrong pick explains exactly why the algorithm would have chosen differently. The round ends with a rank from Cadet to Commander.
- **Autopilot** – the algorithm runs by itself, one step at a time, with a plain-language explanation of each step, the matching pseudocode line highlighted, and live counters. You can step forward and back, change speed, or scrub to any point.

## Controls

| Where | Keys |
|---|---|
| Autopilot | `←` `→` step, `Space` run / hold, `Home` `End` jump |
| Convoy (Manual) | `←` take from the left lane, `→` take from the right |
| Anywhere in a mission | `Esc` back to the index |

Convoy also accepts your own numbers: type up to 12 values into the box in the header and press Enter.

The address bar always holds the current round, so copying the link (or using **Copy challenge link** on the debrief screen) lets someone else fly exactly the same round.

## How it works

Each mission runs its real algorithm once, up front, and records a snapshot after every meaningful action: a call, a split, a comparison, a write, a relaxation. A snapshot holds everything needed to draw that moment, plus the explanation and the pseudocode line.

Some snapshots carry a `decision`: the options, the correct one, and why. On Autopilot a decision is just explained. On Manual the engine stops there and waits for a pick.

This has two useful consequences:

- **Stepping backwards is free.** Going back just draws the previous snapshot.
- **What you see cannot drift from the algorithm.** The visuals are drawn from an actual run, not from a separately scripted animation.

The board is patched in place rather than rebuilt on every step, so elements keep their identity and CSS transitions run between states.

Signal Lock's Manual mode is the one exception to the recorded script, because any sector is a legal ping. It keeps the live search range instead and tells you how many candidates your ping could have left compared with the middle one.

## Complexity, as shown in the game

| Mission | Time | Why you can feel it |
|---|---|---|
| Convoy | Θ(n log n) | Merging k pods never takes more than k − 1 decisions, and there are only ⌈log₂n⌉ levels of merging |
| Signal Lock | Θ(log n) | Par is ⌊log₂n⌋ + 1 pings; pinging one sector at a time blows straight past it |
| Starlane | O((V + E) log V) with a min-heap | Every star is settled once and every lane is relaxed once |

## Run it locally

No build step and no dependencies. Open `index.html` in a browser, or serve the folder:

```bash
python -m http.server 8000
```

Fonts are loaded from Google Fonts, so the type falls back to system fonts when offline.

## Project layout

```
index.html              page markup: index (home) and cockpit (game)
css/
  base.css              tokens, type, buttons, grain, cursor, intro, page wipe
  home.css              hero, ticker, mission list, method, footer
  game.css              header, readouts, stage, controls, debrief, number tiles
  missions.css          board styles for the three missions
js/
  util.js               small shared helpers
  missions/convoy.js    merge sort: step recorder + renderer
  missions/signal.js    binary search: step recorder, live play, renderer
  missions/starlane.js  Dijkstra: map generator, step recorder, renderer
  sky.js                starfield and particle canvas
  engine.js             modes, scoring, ranks, stage patching, input
  motion.js             intro, page wipe, cursor, parallax, scroll reveals
  main.js               boot and challenge links
```

## Notes

Five essays sit alongside the game at [/blog](https://umbra-daa.vercel.app/blog/): merge sort, binary search, Dijkstra's algorithm, the Master Theorem, and the 0/1 knapsack problem. Each has a worked example, a complexity analysis and measurements from the scripts in `analysis/`.

```bash
python analysis/merge_sort.py      # likewise binary_search.py, dijkstra.py, recurrences.py, knapsack.py
```

## Author

Neil Thomas Mathew
