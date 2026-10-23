# Treino — a gym-mode PWA for wger

A mobile-first web app for doing your workout at the gym. It talks to the
[wger](https://wger.de) REST API (v2) and the allauth headless login endpoint on
the same origin, and turns a wger routine into a one-handed workout screen:
sets, weights, reps, RIR, rest countdown and cardio — all recorded straight into
wger.

It is a static site (HTML + CSS + vanilla JS, no build step, no npm
dependencies). Drop it on the same host as your wger instance, install it from
the browser, and it behaves like a native app.

## Features

- **Mobile-first "gym mode"** — a single, top-down, one-handed layout: the set
  you are doing stays in reach, and the rest timer sits in a bar at the bottom.
- **Rest countdown** — confirming a set starts a countdown using the rest time
  prescribed in the routine; it keeps running while you scroll or edit values.
- **Per-set RIR picker** — record reps in reserve per set, either by typing a
  number or picking from a list with plain-language descriptions. Empty means
  the routine default.
- **Per-exercise timers** — an exercise timer starts on its first confirmed set,
  plus an overall session timer at the top.
- **Editable sets after the fact** — kg and reps can be corrected at any time;
  the app sends a `PATCH` with only the changed field.
- **Cardio exercises** — record time (minutes) and distance (km) instead of
  sets, stored as wger workout logs.
- **Cancel session** — abort a workout and delete the logs and session it
  created, with a confirmation sheet.
- **History** — browse previous sessions, set by set.
- **Draft recovery** — an in-progress workout survives a reload or a dropped
  connection; finishing retries anything that failed to sync.
- **Three languages** — pt-BR, English and Spanish, including exercise names
  from wger translations with pt-BR fallback.
- **Light theme** and a bottom-sheet UI tuned for phones.
- **Extended mode on wide screens** — on tablets and desktops the workout gets a
  second column with all sets and timers side by side.
- **Installable PWA** — manifest and service worker; the app shell is cached and
  the API is always fetched from the network.

## Requirements

- A running wger instance with the REST API v2 enabled.
- The allauth **headless app client** login endpoint at
  `/allauth/app/v1/auth/login` (this is what wger's own frontend uses).
- The app served from the **same origin** as wger, or with the `?api=` query
  parameter pointing at the API origin (useful for development).

By default the app calls the API on its own origin:

```js
var API_BASE = (qs.get('api') || location.origin).replace(/\/+$/, '');
```

`?api=https://wger.example.com` overrides it. That cross-origin mode requires
CORS on the wger side; same-origin deployment avoids the issue entirely.

## Self-hosting

The app is plain static files. Serve the contents of this repository (or a
subdirectory) from the same host that serves wger. A common setup is a
`/treino/` path on the same domain:

```
https://wger.example.com/          <- your wger instance
https://wger.example.com/treino/   <- this app
```

Copy the static files to the web root of that path:

```sh
sudo mkdir -p /var/www/treino
sudo cp -r index.html app.js style.css manifest.json sw.js icons /var/www/treino/
```

Then add a location block to the nginx site that already serves wger:

```nginx
location /treino/ {
    alias /var/www/treino/;
    try_files $uri $uri/ /treino/index.html;
}
```

No rewrite of the API path is needed: `/api/` and `/allauth/` keep going to
wger on the same origin, and the service worker only intercepts the app's own
static assets (its scope is the directory it is served from).

Reload nginx, open `https://wger.example.com/treino/`, and log in with your wger
credentials. Install it from the browser menu ("Install app" on Chrome for
Android, "Add to Home Screen" on Safari for iOS). Firefox for Android does not
support PWA installation — use Chrome there.

The app also works in any other subpath (or at the domain root) without code
changes: all asset URLs are relative, and the service worker derives its scope
from its own location.

## Tests

End-to-end tests drive the real app in a headless Chromium against an in-memory
mock of the wger API. No npm dependencies:

```sh
node tests/run.js
```

Requirements: Node 18+ and Chromium/Chrome on `PATH` (override with
`CHROMIUM=/path/to/binary`). A run takes about 20 seconds and exits `0` only
when every check passes. There are 201 checks covering login, the strength
workout flow, iteration 2, cardio, cancelling sessions, rest days, i18n, the
360 px layout, the menu, and extended mode on desktop and mobile.

See [`tests/README.md`](tests/README.md) for the mock data, the determinism
setup, the full scenario list and how to add a scenario.

## Usage guide

[`GUIA.md`](GUIA.md) is a step-by-step install and usage guide in Brazilian
Portuguese, written for the person actually training.

## License

[AGPL-3.0](LICENSE), the same license as wger. If you run a modified version as
a network service, you must offer its source.

## Disclosure

Built with AI assistance (Kimi/DeepSeek agents), human-supervised.
