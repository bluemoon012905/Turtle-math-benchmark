# Turtle Math Benchmark

Static browser-based mental math game for practicing running totals and reviewing weak spots over time.

No build step, framework, or backend is required. The app is plain HTML, CSS, and JavaScript and can be opened locally or hosted with GitHub Pages.

## What It Does

The player picks a die mode and repeatedly enters the new total after each roll.

- `D4` target: `35`
- `D6` target: `50`
- `D12` target: `100`
- `D20` target: `150`

The goal is to reach the target or pass it.

There are two play variants:

- Standard mode: one die roll per turn
- Proper Turtle Mode: three rolls per turn, with a doubled target

## Features

- Auto-accepts answers when the entered total is correct
- Optional on-page number pad for mobile use
- Fullscreen toggle
- Correct-answer sound with volume slider
- End-of-run summary modal
- Dedicated stats page at `stats.html`
- Client-side persistence of successful pass runs with `localStorage`

## Stats Tracking

Successful pass runs are saved on the current device only under the `localStorage` key `turtle-math-stats-v1`.

The stats page tracks:

- Calculation speed: correct answers per second
- Growth speed: how many numbers are gained per second
- Weakest number ranges
- Weakest time windows within runs
- Slowest end-digit pairs

Each correct answer records:

- Time spent on that answer
- Elapsed run time at that moment
- Starting total and resulting total
- Growth amount for that step
- Number-range bucket
- Time-window bucket
- End-digit pair in the form `current ones digit + growth ones digit`

Only successful pass runs are persisted. Failed runs still show the lightweight run summary modal but are not added to saved stats.

## Project Structure

- [index.html](/home/moonbox/personal_project/Turtle-math-benchmark/index.html): mode select screen, game screen, and run summary modal
- [stats.html](/home/moonbox/personal_project/Turtle-math-benchmark/stats.html): dedicated persistent stats page
- [script.js](/home/moonbox/personal_project/Turtle-math-benchmark/script.js): gameplay logic, persistence, stats aggregation, and page-specific initialization
- [styles.css](/home/moonbox/personal_project/Turtle-math-benchmark/styles.css): all styling for the game and stats page

## Run Locally

Open `index.html` directly in a browser.

If you want to serve it over a local web server instead:

```bash
python3 -m http.server
```

Then open `http://localhost:8000/`.

## Deploy

This repo is suitable for static hosting.

- GitHub Pages works without changes
- Any static file host will work

## Notes

- Stats are browser-local and device-local
- Clearing browser storage will erase saved pass runs
- There are no external runtime dependencies beyond the Google Fonts stylesheet used by the HTML pages
