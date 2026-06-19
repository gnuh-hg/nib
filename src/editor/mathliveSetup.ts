// Register the <math-field> custom element + configure MathLive ONCE, before any
// block mounts (build-verify mistakes: web component must be registered first).
import { MathfieldElement } from 'mathlive';
// NOTE: static result rendering now uses KaTeX (see services/mathMarkup.ts +
// katex.min.css in main.tsx). The interactive <math-field> injects its own
// shadow-DOM styles, so no document-level MathLive CSS is needed here.

// Avoid 404 noise in the mock: no key sounds; load glyph fonts from a CDN
// (Phase 0 runs in a browser online; the Tauri offline build will bundle fonts).
// Guard: MathfieldElement is undefined in non-browser test env (jsdom).
if (typeof MathfieldElement !== 'undefined' && MathfieldElement) {
  MathfieldElement.soundsDirectory = null;
  MathfieldElement.fontsDirectory =
    'https://cdn.jsdelivr.net/npm/mathlive@0.105.3/dist/fonts';
}

export { MathfieldElement };
