# Joule WorkPad

A pixel-faithful implementation of the Joule chat panel built from Figma frame [3012:83760](https://www.figma.com/design/8RAzblkG5FVIt9GtuGPhBZ/WorkPad?node-id=3012-83760).

## Structure

```
jtest/          App entry point
  index.html    Panel wiring, event handling, mock response routing
  styles.css    SAP design tokens, page shell

library/
  joule/        Shared Web Component library
    index.js                   Component barrel (registers all custom elements)
    component-styles.css       Shared shadow DOM styles for all components
    joule-panel.js             Root 416×768 card shell (slots + ResizeObserver)
    joule-header.js            Header: hamburger · title · expand · close
    joule-conversation-canvas.js  Scrollable chat canvas
    joule-message-input.js     Expanded / collapsed message input
    joule-disclaimer.js        Footer disclaimer
    assets/                    SVG icons and decorative background
```

## Running

Serve the repo root with any static file server. Example:

```bash
npx serve .         # serves on http://localhost:3000
# or
python3 -m http.server 8099
```

Then open `http://localhost:<port>/jtest/index.html`.

## Features

- Seeded conversation (timestamp, user bubbles with `@mention` gradient, Joule numbered-list response, animated loading dots)
- Message input expands / collapses:
  - **Send** → collapses to compact pill, canvas reclaims vertical space
  - **Click canvas** → collapses input (if expanded)
  - **Click pill** → re-expands with `@performance-assistant ×` tag and auto-focused editor
- Dynamic footer height via `ResizeObserver` — no hard-coded padding constants
- Type `code` → syntax-highlighted JS code block streamed line-by-line
- Type `table` → scrollable data table with status badges streamed row-by-row
- Any other text → paragraph response streamed word-by-word