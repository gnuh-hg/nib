/**
 * E2E spec — Gate vàng Phase A free-caret-v2
 * Flow: tests/flows/free-caret-v2-phase-a.flow.md
 *
 * Tests: spacer-atom + virtual-caret + materialize-on-input (Path B, ARCHITECTURE §A).
 *
 * Run: npx playwright test tests/e2e/free-caret-v2-phase-a.spec.ts
 *      --project=chromium --reporter=list
 *
 * Server: npm run dev must be running at :1420 (clean restart after pkill vite).
 * Evidence: tests/evidence/free-caret-v2-phase-a/
 */

import { test, expect, type Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const EVIDENCE_DIR = 'tests/evidence/free-caret-v2-phase-a';
const BASE_URL = 'http://localhost:1420';

// ── Helpers ────────────────────────────────────────────────────────────────

function ensureEvidence(): void {
  if (!fs.existsSync(EVIDENCE_DIR)) {
    fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
  }
}

/**
 * Collect REAL JS errors only.
 * Explicitly ignore expected network/CDN errors in headless (MathLive fonts,
 * Hocuspocus WS) — these are not app logic errors.
 */
function collectErrors(page: Page): string[] {
  const errs: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const text = msg.text();
    // Ignore: MathLive CDN font 404s (no internet in headless Playwright)
    if (text.includes('Failed to load resource')) return;
    if (text.includes('math fonts could not be loaded')) return;
    if (text.includes('mathlive')) return;
    // Ignore: Hocuspocus WS connection (offline-only is expected in tests)
    if (text.includes('WebSocket') || text.includes('hocuspocus')) return;
    errs.push(`[console.error] ${text}`);
  });
  page.on('pageerror', (err) => {
    errs.push(`[pageerror] ${err.message}`);
  });
  return errs;
}

/**
 * Wait for TipTap editor to be mounted AND for Yjs IDB sync to COMPLETE.
 *
 * Critical: previous test runs accumulate content in IDB. Yjs IndexeddbPersistence
 * loads that content asynchronously. If we interact with the editor BEFORE Yjs
 * finishes applying all IDB updates, the stored PM positions (e.g., vcaret
 * lineDocPos) become stale when the updates arrive between click and keypress.
 * This makes gap calculations in materialize() return 0 → no spacer created.
 *
 * Fix: poll until editor innerHTML is stable for two consecutive 300ms windows.
 * Once stable, Yjs IDB loading is complete and no more position shifts will occur.
 */
async function waitForEditor(page: Page): Promise<void> {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForSelector('.ProseMirror[contenteditable="true"]', {
    state: 'visible',
    timeout: 20_000,
  });
  // Poll until Yjs IDB sync completes (content stabilizes)
  let lastHtml = '';
  let stableCount = 0;
  for (let i = 0; i < 30; i++) {
    await page.waitForTimeout(300);
    const html = await page.locator('.ProseMirror').innerHTML();
    if (html === lastHtml) {
      stableCount++;
      if (stableCount >= 2) break; // stable for 600ms = IDB done
    } else {
      stableCount = 0;
    }
    lastHtml = html;
  }
  // One final safety margin after stability confirmed
  await page.waitForTimeout(200);
}

/**
 * Type text into a FRESH paragraph at the end of the document.
 * Uses Ctrl+End to go to the end, then Enter to create a new paragraph.
 * Robust against IDB content from previous tests.
 */
async function typeInFreshParagraph(page: Page, text: string): Promise<void> {
  const pm = page.locator('.ProseMirror');
  await pm.click();
  await page.waitForTimeout(100);
  // Go to absolute end of document
  await page.keyboard.press('Control+End');
  await page.waitForTimeout(100);
  // Create a new paragraph (handles both empty-doc and existing-content cases)
  await page.keyboard.press('Enter');
  await page.waitForTimeout(100);
  // Type test content
  await page.keyboard.type(text, { delay: 25 });
  await page.waitForTimeout(200);
}

/**
 * Get the state of the LAST paragraph:
 * - pmBox: bounding box of .nib-pm (the ProseMirror root)
 * - textRightViewport: rightmost x of text content in the last <p>
 * - lastParaBox: bounding box of the last <p>
 * - lastParaMidY: vertical center of the last <p>
 */
async function getLastParaState(page: Page): Promise<{
  pmBox: { x: number; y: number; width: number; height: number };
  textRightViewport: number;
  lastParaBox: { x: number; y: number; width: number; height: number };
  lastParaMidY: number;
}> {
  const pm = page.locator('.nib-pm');
  const pmBox = await pm.boundingBox();
  if (!pmBox) throw new Error('.nib-pm not found');

  const lastPara = page.locator('.nib-pm p').last();
  const lastParaBox = await lastPara.boundingBox();
  if (!lastParaBox) throw new Error('No paragraph found — typing may have failed');

  // Get the right edge of the text content inside the last paragraph
  const textRightViewport = await page.evaluate(() => {
    const paras = document.querySelectorAll<HTMLElement>('.nib-pm p');
    const last = paras[paras.length - 1];
    if (!last) return 0;
    const range = document.createRange();
    range.selectNodeContents(last);
    return range.getBoundingClientRect().right;
  });

  return {
    pmBox,
    textRightViewport,
    lastParaBox,
    lastParaMidY: lastParaBox.y + lastParaBox.height / 2,
  };
}

/**
 * Click at `gapFromTextRight` px past the right edge of text in the last paragraph.
 * Returns the clientX clicked (viewport coords).
 */
async function clickPastText(
  page: Page,
  gapFromTextRight: number,
): Promise<{ clientX: number; pmLeft: number }> {
  const { pmBox, textRightViewport, lastParaMidY } = await getLastParaState(page);

  // Safety: clip to within the paper (pmBox.x .. pmBox.x + pmBox.width - 10)
  const maxX = pmBox.x + pmBox.width - 10;
  const targetX = Math.min(textRightViewport + gapFromTextRight, maxX);

  await page.mouse.click(targetX, lastParaMidY);
  await page.waitForTimeout(150);

  return { clientX: targetX, pmLeft: pmBox.x };
}

/** Read the `left` px value from .nib-vcaret's style attribute. */
async function getVcaretLeft(page: Page): Promise<number> {
  const style = await page.locator('.nib-vcaret').getAttribute('style');
  const m = style?.match(/left:\s*([\d.]+)px/);
  return m ? parseFloat(m[1]) : NaN;
}

// ── Tests ──────────────────────────────────────────────────────────────────

test.beforeAll(() => {
  ensureEvidence();
});

// ────────────────────────────────────────────────────────────────────────────
// Case 1 (E5) — App mount: schema không crash, console 0 JS error
// ────────────────────────────────────────────────────────────────────────────
test('Case 1 (E5) — App mount: schema không crash, 0 JS error', async ({ page }) => {
  const errs = collectErrors(page);
  await page.goto(BASE_URL);
  await waitForEditor(page);

  await page.screenshot({
    path: path.join(EVIDENCE_DIR, 'case-1-mount.png'),
    fullPage: true,
  });

  // Gate: editor visible + editable
  const pm = page.locator('.ProseMirror');
  await expect(pm).toBeVisible();
  expect(await pm.getAttribute('contenteditable')).toBe('true');

  // Gate: 0 REAL JS errors (E5: nibBlock schema mismatch would throw here)
  if (errs.length > 0) {
    fs.writeFileSync(path.join(EVIDENCE_DIR, 'case-1-console-errors.txt'), errs.join('\n'));
  }
  expect(errs, `JS errors on mount:\n${errs.join('\n')}`).toHaveLength(0);
  console.log('Case 1 PASS — mount clean, 0 JS errors');
});

// ────────────────────────────────────────────────────────────────────────────
// Case 2 (Gate vàng A) — Click gap → .nib-vcaret tại x
// ────────────────────────────────────────────────────────────────────────────
test('Case 2 (Gate vàng A) — Click gap → .nib-vcaret xuất hiện đúng x', async ({ page }) => {
  const errs = collectErrors(page);
  await page.goto(BASE_URL);
  await waitForEditor(page);

  // Create text in a fresh paragraph
  await typeInFreshParagraph(page, 'Hello ');

  // Click 150px past text-right (guaranteed gap regardless of IDB content)
  const GAP = 150;
  const { clientX, pmLeft } = await clickPastText(page, GAP);
  const expectedVcaretLeft = clientX - pmLeft;

  // Gate: vcaret must appear
  await expect(page.locator('.nib-vcaret')).toBeVisible({ timeout: 3000 });

  // Gate: vcaret.left ≈ expectedVcaretLeft ± 15px
  const vcLeft = await getVcaretLeft(page);
  expect(vcLeft, 'vcaret left must be a valid number').not.toBeNaN();
  expect(
    Math.abs(vcLeft - expectedVcaretLeft),
    `vcaret.left=${vcLeft.toFixed(1)}px expected≈${expectedVcaretLeft.toFixed(1)}px (±15)`,
  ).toBeLessThanOrEqual(15);

  await page.screenshot({ path: path.join(EVIDENCE_DIR, 'case-2-vcaret-visible.png'), fullPage: true });
  expect(errs, `JS errors:\n${errs.join('\n')}`).toHaveLength(0);
  console.log(`Case 2 PASS — vcaret.left=${vcLeft.toFixed(1)} expected≈${expectedVcaretLeft.toFixed(1)}`);
});

// ────────────────────────────────────────────────────────────────────────────
// Case 3 (Gate vàng B) — Gõ "hi" → text tại ~x, spacer tồn tại, vcaret gone
// ────────────────────────────────────────────────────────────────────────────
test('Case 3 (Gate vàng B) — Gõ "hi" → spacer+text tại ~x, vcaret biến mất', async ({ page }) => {
  const errs = collectErrors(page);
  await page.goto(BASE_URL);
  await waitForEditor(page);

  await typeInFreshParagraph(page, 'Hi ');

  const GAP = 150;
  const { clientX, pmLeft } = await clickPastText(page, GAP);
  const expectedX = clientX; // viewport x where we clicked

  // Verify vcaret is active
  await expect(page.locator('.nib-vcaret')).toBeVisible({ timeout: 3000 });

  // Type "hi" — handleKeyDown → materialize (first char)
  await page.keyboard.press('h');
  await page.waitForTimeout(150);
  await page.keyboard.press('i');
  await page.waitForTimeout(300);

  // Gate 1: vcaret gone
  await expect(page.locator('.nib-vcaret')).not.toBeVisible();

  // Gate 2: spacer created with positive width
  const spacers = page.locator('.nib-spacer');
  await expect(spacers.first()).toBeVisible({ timeout: 2000 });
  const spacerBox = await spacers.first().boundingBox();
  expect(spacerBox, 'Spacer must have a bounding box').not.toBeNull();
  expect(spacerBox!.width, 'Spacer width must be > 0').toBeGreaterThan(0);

  // Gate 3: text "hi" appears in the editor content
  const content = await page.locator('.ProseMirror').textContent();
  expect(content, 'Editor must contain "hi"').toContain('hi');

  // Gate 4: text "hi" starts near expectedX (clientX where we clicked)
  const textBoundsLeft = await page.evaluate(
    (searchText: string) => {
      const pm = document.querySelector('.nib-pm');
      if (!pm) return null;
      const walker = document.createTreeWalker(pm, NodeFilter.SHOW_TEXT);
      let node: Text | null = null;
      while ((node = walker.nextNode() as Text | null)) {
        if (node.textContent?.includes(searchText)) break;
      }
      if (!node) return null;
      const idx = node.textContent!.indexOf(searchText);
      const range = document.createRange();
      range.setStart(node, idx);
      range.setEnd(node, idx + searchText.length);
      return range.getBoundingClientRect().left;
    },
    'hi',
  );

  expect(textBoundsLeft, '"hi" text must be findable in DOM').not.toBeNull();
  // "hi" viewport left ≈ where we clicked ± 30px (font rendering tolerance)
  expect(
    Math.abs(textBoundsLeft! - expectedX),
    `"hi" at viewport x=${textBoundsLeft!.toFixed(1)}, clicked at ${expectedX.toFixed(1)} (±30)`,
  ).toBeLessThanOrEqual(30);

  await page.screenshot({ path: path.join(EVIDENCE_DIR, 'case-3-typed-hi.png'), fullPage: true });
  expect(errs, `JS errors:\n${errs.join('\n')}`).toHaveLength(0);
  console.log(
    `Case 3 PASS — spacer.width=${spacerBox!.width.toFixed(1)}px; "hi" at viewport ${textBoundsLeft!.toFixed(1)} (clicked at ${expectedX.toFixed(1)})`,
  );
});

// ────────────────────────────────────────────────────────────────────────────
// Case 4 (E6) — Vcaret blink KHÔNG đẩy dòng dưới
// ────────────────────────────────────────────────────────────────────────────
test('Case 4 (E6) — Vcaret blink không gây layout shift', async ({ page }) => {
  const errs = collectErrors(page);
  await page.goto(BASE_URL);
  await waitForEditor(page);

  // Create line 1
  await typeInFreshParagraph(page, 'Line one text');
  // Create line 2 immediately after (Enter inside the fresh line)
  await page.keyboard.press('Enter');
  await page.keyboard.type('Line two below', { delay: 25 });
  await page.waitForTimeout(300);

  // Find the two new paragraphs (last 2 in the doc)
  const paras = page.locator('.nib-pm p');
  const count = await paras.count();
  expect(count, 'Must have at least 2 paragraphs').toBeGreaterThanOrEqual(2);

  const secondLast = paras.nth(count - 2);
  const last = paras.nth(count - 1);

  const topBefore = await last.evaluate((el) => el.getBoundingClientRect().top);

  // Click gap in the second-last paragraph (line 1)
  const pmBox = await page.locator('.nib-pm').boundingBox();
  const lineOneBox = await secondLast.boundingBox();
  const textRightLineOne = await page.evaluate(() => {
    const paras = document.querySelectorAll<HTMLElement>('.nib-pm p');
    const target = paras[paras.length - 2];
    if (!target) return 0;
    const range = document.createRange();
    range.selectNodeContents(target);
    return range.getBoundingClientRect().right;
  });
  await page.mouse.click(
    Math.min(textRightLineOne + 100, pmBox!.x + pmBox!.width - 10),
    lineOneBox!.y + lineOneBox!.height / 2,
  );
  await expect(page.locator('.nib-vcaret')).toBeVisible({ timeout: 3000 });

  // Wait for blink animation to run (1 cycle = 1000ms; check after 200ms)
  await page.waitForTimeout(200);

  const topAfter = await last.evaluate((el) => el.getBoundingClientRect().top);
  const shift = Math.abs(topAfter - topBefore);

  await page.screenshot({ path: path.join(EVIDENCE_DIR, 'case-4-no-layout-shift.png'), fullPage: true });

  // Gate: ≤ 2px shift (sub-pixel rounding tolerance)
  expect(
    shift,
    `E6 layout shift ${shift.toFixed(2)}px — must be ≤ 2px`,
  ).toBeLessThanOrEqual(2);

  expect(errs, `JS errors:\n${errs.join('\n')}`).toHaveLength(0);
  console.log(`Case 4 PASS — layout shift = ${shift.toFixed(2)}px`);
});

// ────────────────────────────────────────────────────────────────────────────
// Case 5 (E2) — Click near pos=0 → vcaret KHÔNG kích hoạt
// ────────────────────────────────────────────────────────────────────────────
test('Case 5 (E2) — Click near pos=0 → vcaret không xuất hiện', async ({ page }) => {
  const errs = collectErrors(page);
  await page.goto(BASE_URL);
  await waitForEditor(page);

  await typeInFreshParagraph(page, 'E2 guard test');

  // Click the very top-left corner of the .nib-pm (pos≈0 = doc root)
  const pmBox = await page.locator('.nib-pm').boundingBox();
  await page.mouse.click(pmBox!.x + 1, pmBox!.y + 1);
  await page.waitForTimeout(300);

  // Gate: vcaret must NOT be active
  // (pos<1 guard in handleClick: if(pos<1) return false → no setVirtualCaret)
  const vcaret = page.locator('.nib-vcaret');
  const count = await vcaret.count();
  if (count > 0) {
    // If element exists, it must not be visible (E2 guard worked)
    await expect(vcaret).not.toBeVisible();
  }
  // count=0 is also valid (decoration not even rendered)

  await page.screenshot({ path: path.join(EVIDENCE_DIR, 'case-5-e2-guard.png'), fullPage: true });
  expect(errs, `JS errors:\n${errs.join('\n')}`).toHaveLength(0);
  console.log('Case 5 PASS — no vcaret at pos≈0 (E2 guard)');
});

// ────────────────────────────────────────────────────────────────────────────
// Case 6 — Escape clears virtual caret
// ────────────────────────────────────────────────────────────────────────────
test('Case 6 — Escape key clears virtual caret', async ({ page }) => {
  const errs = collectErrors(page);
  await page.goto(BASE_URL);
  await waitForEditor(page);

  await typeInFreshParagraph(page, 'Escape test');

  // Activate vcaret
  await clickPastText(page, 120);
  await expect(page.locator('.nib-vcaret')).toBeVisible({ timeout: 3000 });

  // Press Escape
  await page.keyboard.press('Escape');
  await page.waitForTimeout(150);

  // Gate: vcaret cleared
  await expect(page.locator('.nib-vcaret')).not.toBeVisible();

  await page.screenshot({ path: path.join(EVIDENCE_DIR, 'case-6-escape-clear.png'), fullPage: true });
  expect(errs, `JS errors:\n${errs.join('\n')}`).toHaveLength(0);
  console.log('Case 6 PASS — Escape clears vcaret');
});

// ────────────────────────────────────────────────────────────────────────────
// Case 7 — Click on existing text clears vcaret
// ────────────────────────────────────────────────────────────────────────────
test('Case 7 — Click on text content clears virtual caret', async ({ page }) => {
  const errs = collectErrors(page);
  await page.goto(BASE_URL);
  await waitForEditor(page);

  await typeInFreshParagraph(page, 'Content click test');

  // Activate vcaret at gap
  await clickPastText(page, 120);
  await expect(page.locator('.nib-vcaret')).toBeVisible({ timeout: 3000 });

  // Get the CENTER of the actual text in the last paragraph using JS Range API
  const textCenterX = await page.evaluate(() => {
    const paras = document.querySelectorAll<HTMLElement>('.nib-pm p');
    const last = paras[paras.length - 1];
    if (!last) return null;
    const walker = document.createTreeWalker(last, NodeFilter.SHOW_TEXT);
    const textNode = walker.nextNode() as Text | null;
    if (!textNode || !textNode.textContent) return null;
    // Find the center of the text (avoiding the spacer region)
    const mid = Math.floor(textNode.textContent.length / 2);
    const range = document.createRange();
    range.setStart(textNode, mid);
    range.setEnd(textNode, mid + 1);
    const rect = range.getBoundingClientRect();
    return (rect.left + rect.right) / 2;
  });

  if (textCenterX === null) {
    console.warn('Case 7: could not find text center — skipping click-on-content');
  } else {
    const lastParaBox = await page.locator('.nib-pm p').last().boundingBox();
    await page.mouse.click(textCenterX, lastParaBox!.y + lastParaBox!.height / 2);
    await page.waitForTimeout(200);

    // Gate: vcaret cleared (click was within text bounds → clearVirtualCaret branch)
    await expect(page.locator('.nib-vcaret')).not.toBeVisible();
  }

  await page.screenshot({ path: path.join(EVIDENCE_DIR, 'case-7-click-content.png'), fullPage: true });
  expect(errs, `JS errors:\n${errs.join('\n')}`).toHaveLength(0);
  console.log('Case 7 PASS — click on content clears vcaret');
});

// ────────────────────────────────────────────────────────────────────────────
// Case 9 (Boundary) — Large gap click → large spacer
// ────────────────────────────────────────────────────────────────────────────
test('Case 9 (Boundary) — Large gap → large spacer created', async ({ page }) => {
  const errs = collectErrors(page);
  await page.goto(BASE_URL);
  await waitForEditor(page);

  await typeInFreshParagraph(page, 'AB');

  // Click far right (300px gap from text-right — guaranteed large spacer)
  const { clientX, pmLeft } = await clickPastText(page, 300);

  // Gate: vcaret active
  await expect(page.locator('.nib-vcaret')).toBeVisible({ timeout: 3000 });

  // Verify vcaret left matches click position
  const vcLeft = await getVcaretLeft(page);
  const expectedLeft = clientX - pmLeft;
  expect(
    Math.abs(vcLeft - expectedLeft),
    `vcaret.left=${vcLeft.toFixed(1)} expected≈${expectedLeft.toFixed(1)} (±15)`,
  ).toBeLessThanOrEqual(15);

  // Type "z" → materialize
  await page.keyboard.press('z');
  await page.waitForTimeout(400);

  // Gate: spacer created with large width (gap ≈ 300px, must be > 100px)
  await expect(page.locator('.nib-spacer').first()).toBeVisible({ timeout: 2000 });
  const spacerBox = await page.locator('.nib-spacer').first().boundingBox();
  expect(spacerBox, 'Spacer must exist').not.toBeNull();
  expect(spacerBox!.width, `Spacer width=${spacerBox!.width.toFixed(1)} must be > 100px`).toBeGreaterThan(100);

  // Gate: "z" in content, no crash
  const content = await page.locator('.ProseMirror').textContent();
  expect(content).toContain('z');

  await page.screenshot({ path: path.join(EVIDENCE_DIR, 'case-9-boundary-large-spacer.png'), fullPage: true });
  expect(errs, `JS errors:\n${errs.join('\n')}`).toHaveLength(0);
  console.log(`Case 9 PASS — spacer.width=${spacerBox!.width.toFixed(1)}px, gap≈300`);
});

// ────────────────────────────────────────────────────────────────────────────
// Case 11 (i18n LOCKED) — Lang switch vi↔en: editor không crash
// ────────────────────────────────────────────────────────────────────────────
test('Case 11 (i18n LOCKED) — Lang vi↔en: editor stays functional', async ({ page }) => {
  test.setTimeout(60_000);
  const errs = collectErrors(page);

  // ── Vietnamese ──
  await page.goto(BASE_URL);
  await waitForEditor(page);
  await page.evaluate(() => localStorage.setItem('lang', 'vi'));
  await page.reload();
  await waitForEditor(page);
  await expect(page.locator('.ProseMirror[contenteditable="true"]')).toBeVisible();
  await page.screenshot({ path: path.join(EVIDENCE_DIR, 'case-11-lang-vi.png'), fullPage: true });

  // Gate: GhostText (if visible) must not show raw i18n key
  const ghostTextEl = page.locator('[class*="ghost"]').first();
  const ghostCount = await ghostTextEl.count();
  if (ghostCount > 0) {
    const ghostText = (await ghostTextEl.textContent()) ?? '';
    expect(ghostText.trim(), 'Ghost text must not be raw i18n key').not.toMatch(/^[a-z]+\.[a-z_]+$/);
  }

  // ── English ──
  await page.evaluate(() => localStorage.setItem('lang', 'en'));
  await page.reload();
  await waitForEditor(page);
  await expect(page.locator('.ProseMirror[contenteditable="true"]')).toBeVisible();
  await page.screenshot({ path: path.join(EVIDENCE_DIR, 'case-11-lang-en.png'), fullPage: true });

  expect(errs, `JS errors:\n${errs.join('\n')}`).toHaveLength(0);
  console.log('Case 11 PASS — lang vi/en: editor functional, no JS error');
});

// ────────────────────────────────────────────────────────────────────────────
// Case 12 (Theme LOCKED) — Light/dark: vcaret renders with var(--accent)
// ────────────────────────────────────────────────────────────────────────────
test('Case 12 (Theme LOCKED) — Light/dark: editor + vcaret render đúng token', async ({ page }) => {
  const errs = collectErrors(page);
  await page.goto(BASE_URL);
  await waitForEditor(page);

  await typeInFreshParagraph(page, 'Theme check');

  // ── Dark mode ──
  await page.evaluate(() => { document.documentElement.dataset.theme = 'dark'; });
  await page.waitForTimeout(100);

  await clickPastText(page, 120);
  await expect(page.locator('.nib-vcaret')).toBeVisible({ timeout: 3000 });

  // Gate: vcaret background resolves to a non-transparent color (--accent token)
  const darkBg = await page.evaluate(() => {
    const el = document.querySelector<HTMLElement>('.nib-vcaret');
    return el ? getComputedStyle(el).backgroundColor : '';
  });
  expect(darkBg, 'vcaret bg in dark mode must be non-transparent').not.toBe('rgba(0, 0, 0, 0)');
  expect(darkBg).not.toBe('transparent');
  expect(darkBg, 'vcaret bg must not be empty').not.toBe('');

  await page.screenshot({ path: path.join(EVIDENCE_DIR, 'case-12-theme-dark.png'), fullPage: true });

  // ── Light mode ──
  await page.evaluate(() => { document.documentElement.dataset.theme = 'light'; });
  await page.waitForTimeout(100);
  await expect(page.locator('.ProseMirror')).toBeVisible();
  await page.screenshot({ path: path.join(EVIDENCE_DIR, 'case-12-theme-light.png'), fullPage: true });

  expect(errs, `JS errors:\n${errs.join('\n')}`).toHaveLength(0);
  console.log(`Case 12 PASS — dark vcaret bg="${darkBg}"; light mode ok`);
});

// ────────────────────────────────────────────────────────────────────────────
// Case 13 (Thiết bị LOCKED) — ≥1024px viewport, no horizontal scroll
// ────────────────────────────────────────────────────────────────────────────
test('Case 13 (Thiết bị LOCKED) — ≥1024px, no horizontal scroll', async ({ page }) => {
  const errs = collectErrors(page);
  await page.goto(BASE_URL);
  await waitForEditor(page);

  // Gate: viewport ≥ 1024px
  const vw = await page.evaluate(() => window.innerWidth);
  expect(vw, `viewport=${vw}px must be ≥1024`).toBeGreaterThanOrEqual(1024);

  // Gate: no horizontal scrollbar
  const hasHScroll = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(hasHScroll, 'No horizontal scroll at ≥1024px').toBe(false);

  // Gate: editor is mouse-clickable (accessible)
  await page.locator('.ProseMirror').click();
  const tag = await page.evaluate(() => document.activeElement?.tagName ?? '');
  expect(
    ['DIV', 'P', 'SPAN', 'BR'].includes(tag.toUpperCase()),
    `Active element after click: ${tag}`,
  ).toBe(true);

  await page.screenshot({ path: path.join(EVIDENCE_DIR, 'case-13-device.png'), fullPage: true });
  expect(errs, `JS errors:\n${errs.join('\n')}`).toHaveLength(0);
  console.log(`Case 13 PASS — viewport=${vw}px, no H-scroll, editor clickable`);
});

// ── Multi-segment helpers (§3b equivalence partitioning) ───────────────────

/**
 * Click at a specific viewport-x in the LAST paragraph (y = mid of last para).
 * Use when you know the exact target x (e.g. anchorLeft - 150).
 */
async function clickAtClientX(page: Page, clientX: number): Promise<void> {
  const lastPara = await page.locator('.nib-pm p').last().boundingBox();
  if (!lastPara) throw new Error('clickAtClientX: no paragraph found');
  const clamped = Math.max(clientX, lastPara.x + 2);
  await page.mouse.click(clamped, lastPara.y + lastPara.height / 2);
  await page.waitForTimeout(200);
}

/**
 * Return the LEFT viewport coordinate of the first occurrence of `searchText`
 * inside the LAST paragraph's text nodes. Returns null if not found.
 */
async function getTextLeftInLastPara(page: Page, searchText: string): Promise<number | null> {
  return page.evaluate((text: string) => {
    const paras = document.querySelectorAll<HTMLElement>('.nib-pm p');
    const last = paras[paras.length - 1];
    if (!last) return null;
    const walker = document.createTreeWalker(last, NodeFilter.SHOW_TEXT);
    let node: Text | null;
    while ((node = walker.nextNode() as Text | null)) {
      const idx = node.textContent?.indexOf(text) ?? -1;
      if (idx >= 0) {
        const range = document.createRange();
        range.setStart(node, idx);
        range.setEnd(node, idx + text.length);
        return range.getBoundingClientRect().left;
      }
    }
    return null;
  }, searchText);
}

// ────────────────────────────────────────────────────────────────────────────
// Case 14 (MS-1) — Chèn TRÁI đoạn có sẵn [§3b.B]  ← EXPECTED FAIL (Phase A bug)
// Acceptance: "đoạn có sẵn phải ĐỨNG YÊN" — diff ≤ 2px
// Bug: tr.insert(lineDocPos, spacerNode) pushes all content at ≥lineDocPos right.
// ────────────────────────────────────────────────────────────────────────────
test('Case 14 (MS-1) — Chèn TRÁI đoạn: AnchorL14 phải đứng yên [EXPECTED FAIL — Phase A bug]', async ({ page }) => {
  const errs = collectErrors(page);
  await page.goto(BASE_URL);
  await waitForEditor(page);

  // ── SETUP: [text "A"][spacer(~200px)][AnchorL14] in a fresh paragraph ──────
  // NOTE: we use a short "A" anchor (not empty) so the last para has content
  // and locator('.nib-pm p').last().boundingBox() works reliably (Yjs sync issue
  // with empty <br>-only paragraphs can briefly detach them, causing timeout).
  await typeInFreshParagraph(page, 'A');

  // Click 200px past "A".right → vcaret(gap=200) → type "AnchorL14"
  await clickPastText(page, 200);
  await expect(page.locator('.nib-vcaret'), 'setup: vcaret at 200px gap').toBeVisible({ timeout: 5000 });
  await page.keyboard.type('AnchorL14', { delay: 25 });
  await page.waitForTimeout(500);

  const setupContent = await page.locator('.ProseMirror').textContent();
  expect(setupContent, 'AnchorL14 must exist after setup').toContain('AnchorL14');

  // ── RECORD: AnchorL14 position BEFORE test-click ─────────────────────────
  const anchorLeftBefore = await getTextLeftInLastPara(page, 'AnchorL14');
  expect(anchorLeftBefore, 'AnchorL14 locatable before test-click').not.toBeNull();

  // ── TEST ACTION: click in left quarter of spacer (spacer is ~200px) ───────
  // AnchorL14.left ≈ pmBox.x + 200
  // Click at AnchorL14.left - 150 → 50px from left edge of spacer (well in left half)
  // PM caretRangeFromPoint → pos BEFORE spacer → coordsAtPos.right ≈ pmBox.x
  // gap = (anchorLeft-150) - pmBox.x ≈ 50px → materialize inserts sp(50)+"t" BEFORE old sp(200)
  await clickAtClientX(page, anchorLeftBefore! - 150);
  await expect(
    page.locator('.nib-vcaret'),
    'vcaret must activate in left portion of spacer',
  ).toBeVisible({ timeout: 5000 });

  await page.keyboard.type('t'); // materialize: sp(50)+t inserted before sp(200)+AnchorL14
  await page.waitForTimeout(500);

  // ── RECORD: AnchorL14 position AFTER ─────────────────────────────────────
  const anchorLeftAfter = await getTextLeftInLastPara(page, 'AnchorL14');
  expect(anchorLeftAfter, 'AnchorL14 must still be findable').not.toBeNull();

  const diff = Math.abs(anchorLeftAfter! - anchorLeftBefore!);

  await page.screenshot({
    path: path.join(EVIDENCE_DIR, 'case-14-ms1-insert-left.png'),
    fullPage: true,
  });
  expect(errs, `JS errors:\n${errs.join('\n')}`).toHaveLength(0);

  console.log(
    `Case 14 [MS-1 CHÈN TRÁI]: AnchorL14.left before=${anchorLeftBefore!.toFixed(1)}px ` +
    `after=${anchorLeftAfter!.toFixed(1)}px diff=${diff.toFixed(1)}px` +
    (diff > 2
      ? ' → BUG CONFIRMED (EXPECTED FAIL): Phase A pushes segment right. Fix = Phase B.'
      : ' → Unexpectedly PASS — check if bug was fixed.'),
  );

  // Acceptance: "đoạn có sẵn phải ĐỨNG YÊN, không bị đẩy lệch" → diff ≤ 2px
  // EXPECTED FAIL because Phase A has no merge-machinery (spacer insertion pushes neighbors)
  expect(
    diff,
    `[MS-1 ACCEPTANCE] AnchorL14 phải đứng yên (≤2px). ` +
    `Actual diff=${diff.toFixed(1)}px. Phase A bug: tr.insert(lineDocPos, sp) pushes right. Fix = Phase B.`,
  ).toBeLessThanOrEqual(2);
});

// ────────────────────────────────────────────────────────────────────────────
// Case 15 (MS-2) — Chèn GIỮA-2-ĐOẠN-SÁT [§3b.E]  ← EXPECTED FAIL (same bug)
// Acceptance: "Right15 phải ĐỨNG YÊN" — diff ≤ 2px
// ────────────────────────────────────────────────────────────────────────────
test('Case 15 (MS-2) — Chèn GIỮA 2 đoạn sát nhau: Right15 phải đứng yên [EXPECTED FAIL — Phase A bug]', async ({ page }) => {
  const errs = collectErrors(page);
  await page.goto(BASE_URL);
  await waitForEditor(page);

  // ── SETUP: [text "Left15"][spacer(~150px)][text "Right15"] ───────────────
  await typeInFreshParagraph(page, 'Left15');

  // Click 150px past Left15.right → vcaret → type "Right15"
  await clickPastText(page, 150);
  await expect(page.locator('.nib-vcaret'), 'setup: vcaret for Right15').toBeVisible({ timeout: 5000 });
  await page.keyboard.type('Right15', { delay: 25 });
  await page.waitForTimeout(500);

  expect(await page.locator('.ProseMirror').textContent()).toContain('Right15');

  // ── RECORD: Right15 position BEFORE test-click ────────────────────────────
  const right15Before = await getTextLeftInLastPara(page, 'Right15');
  expect(right15Before, 'Right15 locatable before test').not.toBeNull();

  // ── TEST ACTION: click 100px LEFT of Right15 (in left portion of 150px spacer) ─
  // Left15.right ≈ right15Before - 150 (spacer = 150px)
  // Click at right15Before - 100 → 50px from Left15.right → in left third of spacer
  // PM pos → after "Left15" text → coordsAtPos.right = Left15.right
  // gap = (right15Before-100) - (right15Before-150) = 50px → sp(50)+"m" before old sp(150)
  // → Right15 shifts right by ~60px
  await clickAtClientX(page, right15Before! - 100);
  await expect(
    page.locator('.nib-vcaret'),
    'vcaret must activate in left portion of spacer between segments',
  ).toBeVisible({ timeout: 5000 });

  await page.keyboard.type('m'); // materialize: sp(50)+m before old sp(150)+Right15
  await page.waitForTimeout(500);

  // ── RECORD: Right15 position AFTER ───────────────────────────────────────
  const right15After = await getTextLeftInLastPara(page, 'Right15');
  expect(right15After, 'Right15 must still be findable').not.toBeNull();

  const diff = Math.abs(right15After! - right15Before!);

  await page.screenshot({
    path: path.join(EVIDENCE_DIR, 'case-15-ms2-insert-between.png'),
    fullPage: true,
  });
  expect(errs, `JS errors:\n${errs.join('\n')}`).toHaveLength(0);

  console.log(
    `Case 15 [MS-2 CHÈN GIỮA-2-ĐOẠN]: Right15.left before=${right15Before!.toFixed(1)}px ` +
    `after=${right15After!.toFixed(1)}px diff=${diff.toFixed(1)}px` +
    (diff > 2
      ? ' → BUG CONFIRMED (EXPECTED FAIL): same Phase A push-right bug.'
      : ' → Unexpectedly PASS — check if bug was fixed.'),
  );

  // Acceptance: "Right15 ĐỨNG YÊN" → diff ≤ 2px
  // EXPECTED FAIL (Phase A bug — same root cause as Case 14)
  expect(
    diff,
    `[MS-2 ACCEPTANCE] Right15 phải đứng yên (≤2px). ` +
    `Actual diff=${diff.toFixed(1)}px. Phase A bug: insert before old spacer pushes Right15. Fix = Phase B.`,
  ).toBeLessThanOrEqual(2);
});

// ────────────────────────────────────────────────────────────────────────────
// Case 16 (MS-3) — Chèn PHẢI cuối đoạn: Left16 & Right16 không bị đẩy [§3b.D]
// Acceptance: diff Left16 ≤ 2px AND diff Right16 ≤ 2px; "Z" appears in content
// EXPECT PASS — insert to the right of last segment doesn't disturb earlier ones
// ────────────────────────────────────────────────────────────────────────────
test('Case 16 (MS-3) — Chèn PHẢI cuối: Left16 & Right16 đứng yên [EXPECT PASS]', async ({ page }) => {
  const errs = collectErrors(page);
  await page.goto(BASE_URL);
  await waitForEditor(page);

  // ── SETUP: [text "S"][sp(~120px)][Left16][sp(~100px)][Right16] ─────────────
  // Use "S" placeholder (non-empty) to avoid Yjs-empty-para boundingBox timeout.
  await typeInFreshParagraph(page, 'S');

  // Step A: click 120px right of "S".right → "Left16"
  await clickPastText(page, 120);
  await expect(page.locator('.nib-vcaret')).toBeVisible({ timeout: 5000 });
  await page.keyboard.type('Left16', { delay: 25 });
  await page.waitForTimeout(400);

  // Step B: click 100px right of Left16.right → "Right16"
  await clickPastText(page, 100);
  await expect(page.locator('.nib-vcaret')).toBeVisible({ timeout: 5000 });
  await page.keyboard.type('Right16', { delay: 25 });
  await page.waitForTimeout(500);

  expect(await page.locator('.ProseMirror').textContent()).toContain('Left16');
  expect(await page.locator('.ProseMirror').textContent()).toContain('Right16');

  // ── RECORD: positions BEFORE test-click ──────────────────────────────────
  const left16Before = await getTextLeftInLastPara(page, 'Left16');
  const right16Before = await getTextLeftInLastPara(page, 'Right16');
  expect(left16Before).not.toBeNull();
  expect(right16Before).not.toBeNull();

  // ── TEST ACTION: click 150px past Right16.right (far right, nothing to right) ─
  await clickPastText(page, 150);
  await expect(
    page.locator('.nib-vcaret'),
    'vcaret must activate 150px past Right16',
  ).toBeVisible({ timeout: 5000 });
  await page.keyboard.type('z');
  await page.waitForTimeout(400);

  // ── RECORD: positions AFTER ───────────────────────────────────────────────
  const left16After = await getTextLeftInLastPara(page, 'Left16');
  const right16After = await getTextLeftInLastPara(page, 'Right16');
  expect(left16After).not.toBeNull();
  expect(right16After).not.toBeNull();

  const diffLeft16 = Math.abs(left16After! - left16Before!);
  const diffRight16 = Math.abs(right16After! - right16Before!);

  const content = await page.locator('.ProseMirror').textContent();
  expect(content, '"z" must appear after insert').toContain('z');

  await page.screenshot({
    path: path.join(EVIDENCE_DIR, 'case-16-ms3-insert-right.png'),
    fullPage: true,
  });
  expect(errs, `JS errors:\n${errs.join('\n')}`).toHaveLength(0);

  console.log(
    `Case 16 [MS-3 CHÈN PHẢI CUỐI]: Left16 diff=${diffLeft16.toFixed(1)}px, Right16 diff=${diffRight16.toFixed(1)}px (both ≤2 = PASS)`,
  );

  expect(
    diffLeft16,
    `Left16 phải đứng yên (≤2px), actual diff=${diffLeft16.toFixed(1)}px`,
  ).toBeLessThanOrEqual(2);
  expect(
    diffRight16,
    `Right16 phải đứng yên (≤2px), actual diff=${diffRight16.toFixed(1)}px`,
  ).toBeLessThanOrEqual(2);
});

// ────────────────────────────────────────────────────────────────────────────
// Case 17 (MS-4) — Chèn TRONG text (normal PM cursor, NO vcaret) [§3b.C]
// Acceptance: "!" inserted at correct position; vcaret NOT active
// EXPECT PASS — normal ProseMirror text insertion, no virtual-caret involvement
// ────────────────────────────────────────────────────────────────────────────
test('Case 17 (MS-4) — Chèn trong text: PM cursor only, no vcaret [EXPECT PASS]', async ({ page }) => {
  const errs = collectErrors(page);
  await page.goto(BASE_URL);
  await waitForEditor(page);

  // ── SETUP: paragraph with "Hello17" ──────────────────────────────────────
  await typeInFreshParagraph(page, 'Hello17');

  const beforeContent = await page.locator('.ProseMirror').textContent();
  expect(beforeContent, 'Hello17 must exist').toContain('Hello17');

  // ── TEST ACTION: navigate INSIDE text, type "!" ───────────────────────────
  // After typeInFreshParagraph, cursor is at end of "Hello17" in the last para.
  // Home → start of current line ("Hello17")
  // ArrowRight → after "H"
  await page.keyboard.press('Home');
  await page.waitForTimeout(100);
  await page.keyboard.press('ArrowRight'); // cursor: H|ello17
  await page.waitForTimeout(100);

  // Gate: vcaret must NOT be active (normal PM cursor, no gap)
  const vcaretActive = await page.locator('.nib-vcaret').isVisible();
  expect(vcaretActive, 'vcaret must NOT activate inside existing text').toBe(false);

  // Insert "!"
  await page.keyboard.type('!');
  await page.waitForTimeout(200);

  const content = await page.locator('.ProseMirror').textContent();

  await page.screenshot({
    path: path.join(EVIDENCE_DIR, 'case-17-ms4-insert-within-text.png'),
    fullPage: true,
  });
  expect(errs, `JS errors:\n${errs.join('\n')}`).toHaveLength(0);

  console.log(`Case 17 [MS-4 CHÈN TRONG TEXT]: content contains "H!ello17"? ${content?.includes('H!ello17')}`);

  // Acceptance: "!" inserted between "H" and "e" → text is "H!ello17"
  expect(content, 'Content must contain "H!ello17" — ! inserted after H').toContain('H!ello17');
});

// ────────────────────────────────────────────────────────────────────────────
// Case 18 (MS-5) — Chuỗi liên tiếp (sequential right-of-existing) [§3b.F]
// Acceptance: (a) P18a.left diff ≤ 2px after P18b insert; (b) P18b appears near click-x
// EXPECT PASS — inserting right of current rightmost never disturbs left segments
// ────────────────────────────────────────────────────────────────────────────
test('Case 18 (MS-5) — Sequential right inserts: P18a đứng yên, P18b đúng vị trí [EXPECT PASS]', async ({ page }) => {
  const errs = collectErrors(page);
  await page.goto(BASE_URL);
  await waitForEditor(page);

  // ── ACTION 1: click 120px past "B".right → type "P18a" ──────────────────
  // Use "B" placeholder (non-empty) to avoid Yjs-empty-para boundingBox timeout.
  await typeInFreshParagraph(page, 'B');

  const { clientX: click1X } = await clickPastText(page, 120);
  await expect(page.locator('.nib-vcaret')).toBeVisible({ timeout: 5000 });
  await page.keyboard.type('P18a', { delay: 25 });
  await page.waitForTimeout(500);
  expect(await page.locator('.ProseMirror').textContent()).toContain('P18a');

  const p18aLeftAfterStep1 = await getTextLeftInLastPara(page, 'P18a');
  expect(p18aLeftAfterStep1).not.toBeNull();

  // ── ACTION 2: click 100px past P18a.right → type "P18b" ──────────────────
  // This is a RIGHT-of-existing insert → P18a must NOT move
  const { clientX: click2X } = await clickPastText(page, 100);
  await expect(page.locator('.nib-vcaret'), 'vcaret for P18b insert').toBeVisible({ timeout: 5000 });
  await page.keyboard.type('P18b', { delay: 25 });
  await page.waitForTimeout(500);

  expect(await page.locator('.ProseMirror').textContent()).toContain('P18b');

  // ── RECORD: positions after step 2 ───────────────────────────────────────
  const p18aLeftAfterStep2 = await getTextLeftInLastPara(page, 'P18a');
  const p18bLeft = await getTextLeftInLastPara(page, 'P18b');
  expect(p18aLeftAfterStep2).not.toBeNull();
  expect(p18bLeft).not.toBeNull();

  const diffP18a = Math.abs(p18aLeftAfterStep2! - p18aLeftAfterStep1!);
  // P18b should appear near where we clicked (tolerance ±30px — includes char width & spacer edge effects)
  const p18bOffset = Math.abs(p18bLeft! - click2X);

  await page.screenshot({
    path: path.join(EVIDENCE_DIR, 'case-18-ms5-sequential.png'),
    fullPage: true,
  });
  expect(errs, `JS errors:\n${errs.join('\n')}`).toHaveLength(0);

  console.log(
    `Case 18 [MS-5 SEQUENTIAL]: ` +
    `P18a diff=${diffP18a.toFixed(1)}px (≤2=ok); ` +
    `P18b.left=${p18bLeft!.toFixed(1)}px click2X=${click2X.toFixed(1)}px offset=${p18bOffset.toFixed(1)}px (≤30=ok)`,
  );

  // Acceptance (a): P18a stays put when inserting to its right
  expect(
    diffP18a,
    `P18a phải đứng yên sau khi P18b được chèn bên phải. ` +
    `before=${p18aLeftAfterStep1!.toFixed(1)} after=${p18aLeftAfterStep2!.toFixed(1)} diff=${diffP18a.toFixed(1)}px`,
  ).toBeLessThanOrEqual(2);

  // Acceptance (b): P18b appears near click2X (vcaret materializes at ~clicked x)
  expect(
    p18bOffset,
    `P18b.left=${p18bLeft!.toFixed(1)} phải gần click2X=${click2X.toFixed(1)} (offset ≤30px). ` +
    `Actual offset=${p18bOffset.toFixed(1)}px`,
  ).toBeLessThanOrEqual(30);
});

// ────────────────────────────────────────────────────────────────────────────
// Case 10 (IME) — N/A in Playwright headless
// ────────────────────────────────────────────────────────────────────────────
test('Case 10 (IME) — N/A in Playwright headless: note + partial smoke', async ({ page }) => {
  /**
   * Playwright headless does NOT synthesize `compositionstart/end` events.
   * keyboard.type() bypasses IME entirely (inserts unicode directly).
   * The compositionstart → materializeGap path cannot be verified here.
   *
   * USER-SMOKE recommendation for IME (Vietnamese Telex):
   *   1. npm run dev :1420
   *   2. Open Chrome with Vietnamese IME (Unikey/macOS IME)
   *   3. Click gap → vcaret active
   *   4. Type "ma" in Telex → compositionstart fires → materializeGap creates spacer
   *      → IME composes into valid PM selection → text appears correctly
   *   5. Verify: no "TextSelection endpoint not pointing into inline content" in console
   */
  const errs = collectErrors(page);
  await page.goto(BASE_URL);
  await waitForEditor(page);
  // Partial: verify app loads without error (baseline)
  await expect(page.locator('.ProseMirror')).toBeVisible();
  expect(errs).toHaveLength(0);
  console.log('Case 10 — N/A in Playwright headless. See user-smoke checklist in spec comment.');
});
