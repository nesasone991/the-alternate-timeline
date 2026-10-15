# Third-party notices

## Runtime dependencies (shipped to users)

| Package | Licence | Purpose |
| --- | --- | --- |
| react, react-dom | MIT | UI library |
| react-router | MIT | Client-side routing |

## Build and test tools (not shipped)

| Package | Licence | Purpose |
| --- | --- | --- |
| vite, @vitejs/plugin-react | MIT | Dev server and production bundler |
| tailwindcss, @tailwindcss/vite | MIT | Utility CSS compiled at build time |
| typescript | Apache-2.0 | Type checking |
| vitest | MIT | Test runner |
| @testing-library/react, @testing-library/dom | MIT | Component tests |
| jsdom | MIT | Browser environment for tests |
| eslint, @eslint/js, typescript-eslint, eslint-plugin-react-hooks, globals | MIT | Linting |

Verify licences again after `npm install` (for example with `npx license-checker --summary`) before release; versions resolve at install time.

## Assets

- **Icons:** original, drawn for this project (`src/components/ui/Icon.tsx`). No icon library is bundled.
- **Brand mark and favicon:** original SVG.
- **Fonts:** none bundled. The interface uses fonts already installed on the visitor's device (Palatino-family serif with Georgia fallback; the system sans-serif). No font is downloaded from a third party.
- **Images, audio, maps:** none yet.

## Text and data

Historical summaries are original writing. Facts are drawn from the sources in `src/data/scenarios/rome/sources.ts`; no source text is reproduced beyond short factual statements. Wikipedia is used only as a pointer to scholarship and is CC BY-SA 4.0 licensed; no Wikipedia text is copied.
