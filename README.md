# Whim

A small decision-roulette web app: type in your options, spin the wheel, and let it pick one for you.

**Live demo:** https://jadeagenesis.github.io/Whim/

## Features

- Add options to a list, and remove any of them with the ✕ button
- Validation on the input: empty entries and duplicates (ignoring upper/lower case) are rejected with a short message
- A spinning wheel, divided into one equal coloured slice per option, with a fixed pointer marking the winner
- The winner is chosen before the wheel starts turning, so the result is always the same as the spin that lands
- An optional decision question ("Where should we go for the holiday?"), shown above the winner once the wheel stops

## Running it locally

No build step, no dependencies — it's plain HTML, CSS and JavaScript.

**Option 1:** open `index.html` directly in your browser.

**Option 2 (recommended):** in VS Code, right-click `index.html` and choose **Open with Live Server**. This reloads the page automatically when you save a change.

## How it works

The whole app is built around one idea: **an `options` array holds the state, and the screen is redrawn from it.**

- `options` is a plain array of strings. It's the only source of truth for what the user has added.
- `render()` wipes the list and rebuilds it from `options`, and `renderWheel()` does the same for the wheel's slices. Neither one ever reads the existing HTML, so the two can't drift apart.
- Every change (adding, removing) edits the array and then calls `render()`.

Spinning follows the same pattern. `spinWheel()` picks a random index first and stores it as `winner`, then calculates how far to rotate the wheel so that winner's slice ends up under the pointer. CSS handles the animation, and the result is revealed only when it finishes.

There are three files:

| File         | What's in it                           |
| ------------ | -------------------------------------- |
| `index.html` | The page structure                     |
| `style.css`  | All the styling and the spin animation |
| `script.js`  | The state and logic                    |

## Planned improvements

- **Saving options in the browser** — store the list and question in `localStorage` so they survive a page reload.
- **A redesigned look** — the current visual style is functional rather than finished.
- **Handling edge cases** — for example, adding or removing options mid-spin can leave the wheel and the result out of step, and there's no `prefers-reduced-motion` support for people who'd rather skip the animation.

## Notes

Built as a learning project, with heavy commenting in the code for anyone new to HTML, CSS or JavaScript.
