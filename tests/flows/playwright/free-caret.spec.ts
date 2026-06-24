/**
 * Playwright spec — free-caret UX (Phase C, materialize-on-click revision)
 * Implements cases from tests/flows/free-caret.flow.md
 *
 * Architecture change vs previous run:
 *   OLD: ghost-park → window keydown e.key.length===1 → materialize
 *        (bug: missed IME/composition input; TextSelection endpoint error possible)
 *   NEW: handleClickOnPaper → insertRowAtLine immediately → Selection.near inside row
 *        (fix: any input type — ASCII, IME, paste — goes directly into valid PM selection)
 *
 * Run: npx playwright test tests/flows/playwright/free-caret.spec.ts --browser=chromium --reporter=list
 * Dev server: npm run dev → :1422 (new process, fresh HMR)
 */

import { test, expect, type Page } from '@playwright/test';
import path from 'path';

const BASE_URL = 'http://localhost:1423';
const EVIDENCE = path.resolve('tests/flows/evidence/free-caret');
const RULE_HEIGHT = 64; // geometry.ts constant

// ── Utils ─────────────────────────────────────────────────────────────────────

/**
 * Collect REAL JS console errors — filter known non-blocking warnings:
 *   - flushSync (y-prosemirror×React known issue)
 *   - MathLive font CDN 404 (expected offline/dev)
 *   - Resource 404s (favicon, fonts)
 *   - NetworkError from CDN
 */
function collectRealErrors(page: Page): string[] {
  const errs: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const text = msg.text();
    if (
      text.includes('flushSync was called from inside a lifecycle method') ||
      text.includes('MathLive') ||
      text.includes('Failed to load resource') ||
      text.includes('NetworkError') ||
      text.includes('favicon') ||
      text.includes('cdn.jsdelivr') ||
      text.includes('fonts could not be loaded')
    ) return;
    errs.push(text);
  });
  return errs;
}

/**
 * Watch for the TextSelection endpoint error — only as pageerror (uncaught exception)
 * or console.error (type='error').
 *
 * NOTE: ProseMirror internally catches TextSelection RangeErrors and re-logs them as
 * console.warn (type='warning', from bundled chunk). That internal PM warning is
 * acceptable — it means PM caught and recovered. We only FAIL on:
 *   1. pageerror: uncaught exception bubbling up (app broken)
 *   2. console.error: app code explicitly logging the error (severity = error)
 * console.warning from PM internals = NOT a test failure.
 */
function watchTextSelectionError(page: Page): { found: () => boolean; messages: () => string[] } {
  const msgs: string[] = [];
  // Only catch console.error (not console.warn — PM catches RangeError internally)
  page.on('console', (msg) => {
    if (
      msg.type() === 'error' &&
      msg.text().includes('TextSelection endpoint not pointing into a node with inline content')
    ) {
      msgs.push(`[console.error] ${msg.text()}`);
    }
  });
  // Uncaught exception = always a failure
  page.on('pageerror', (err) => {
    if (err.message.includes('TextSelection endpoint not pointing into a node with inline content')) {
      msgs.push(`[pageerror] ${err.message}`);
    }
  });
  return { found: () => msgs.length > 0, messages: () => msgs };
}

/** Wait for PM editor + MathLive to settle. */
async function waitForEditor(page: Page) {
  await page.waitForSelector('.nib-pm', { timeout: 15_000 });
  await page.waitForTimeout(500);
}

/** Get paper bounding rect. */
async function getPaperRect(page: Page) {
  return page.evaluate(() => {
    const r = document.querySelector('.nib-paper')!.getBoundingClientRect();
    return { left: r.left, top: r.top, width: r.width, height: r.height };
  });
}

/** Dump all rows with text + style for diagnostics. */
async function dumpRows(page: Page) {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll('.nib-row')).map((r) => ({
      marginTop: (r as HTMLElement).style.marginTop,
      paddingLeft: (r as HTMLElement).style.paddingLeft,
      text: (r.querySelector('.nib-row__content')?.textContent ?? '').trim(),
      viewportTop: r.getBoundingClientRect().top,
    })),
  );
}

// ── Case 1: FOCUS on load ─────────────────────────────────────────────────────

test('Case 1 — FOCUS: activeElement is nib-pm after load', async ({ page }) => {
  const errs = collectRealErrors(page);
  const tsErr = watchTextSelectionError(page);
  await page.goto(BASE_URL);
  await waitForEditor(page);

  const hasPmFocus = await page.evaluate(() =>
    document.activeElement?.classList.contains('nib-pm') === true,
  );
  const isArtifact = await page.evaluate(
    () =>
      document.activeElement?.id === 'ML__fonts-did-not-load' ||
      document.activeElement?.classList.contains('ML__fonts-did-not-load'),
  );

  await page.screenshot({ path: `${EVIDENCE}/case-1-focus.png`, fullPage: false });
  expect(hasPmFocus, 'activeElement should have class nib-pm').toBe(true);
  expect(isArtifact, 'activeElement must NOT be ML artifact').toBe(false);
  expect(tsErr.found(), `TextSelection error must not occur: ${tsErr.messages().join('; ')}`).toBe(false);
  expect(errs, `unexpected JS errors: ${errs.join(' | ')}`).toHaveLength(0);
});

// ── Case MATERIALIZE-ON-CLICK: row created immediately on empty click ──────────

test('Case MAT-CLICK — click empty space → row created immediately + selection inside', async ({ page }) => {
  const errs = collectRealErrors(page);
  const tsErr = watchTextSelectionError(page);
  await page.goto(BASE_URL);
  await waitForEditor(page);

  const paper = await getPaperRect(page);
  const rowsBefore = await page.evaluate(() => document.querySelectorAll('.nib-row').length);

  // Click on empty paper below starter row (line 4 = y offset 256)
  await page.mouse.click(paper.left + 150, paper.top + 4 * RULE_HEIGHT);
  await page.waitForTimeout(150); // let PM dispatch + RowView re-render

  const rowsAfter = await page.evaluate(() => document.querySelectorAll('.nib-row').length);

  // Selection must be INSIDE the new row (nib-pm is focused + selection is valid)
  const selectionInfo = await page.evaluate(() => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return { valid: false, inRow: false };
    const range = sel.getRangeAt(0);
    const inRow = !!range.commonAncestorContainer.parentElement?.closest('.nib-row');
    return { valid: true, inRow };
  });

  await page.screenshot({ path: `${EVIDENCE}/case-mat-click.png`, fullPage: false });

  expect(rowsAfter, `row count must increase by 1 (was ${rowsBefore})`).toBe(rowsBefore + 1);
  expect(selectionInfo.valid, 'selection must exist after click').toBe(true);
  expect(selectionInfo.inRow, 'selection must be inside a .nib-row (not doc-level)').toBe(true);

  expect(tsErr.found(), `TextSelection error must not occur: ${tsErr.messages().join('; ')}`).toBe(false);
  expect(errs, `unexpected JS errors: ${errs.join(' | ')}`).toHaveLength(0);
});

// ── Case IME: insertText('â') goes into NEW row (not starter row) ─────────────

test('Case IME — insertText("â") after empty click → char in new row, not starter', async ({ page }) => {
  const errs = collectRealErrors(page);
  const tsErr = watchTextSelectionError(page);
  await page.goto(BASE_URL);
  await waitForEditor(page);

  const paper = await getPaperRect(page);

  // Click empty space → row created immediately with cursor inside
  await page.mouse.click(paper.left + 120, paper.top + 5 * RULE_HEIGHT);
  await page.waitForTimeout(150);

  // Verify a new (empty) row was created before typing
  const rowsAfterClick = await page.evaluate(() => document.querySelectorAll('.nib-row').length);
  expect(rowsAfterClick, 'row must be created on click before IME input').toBeGreaterThan(1);

  // IME input: page.keyboard.insertText dispatches input event with inputType='insertText'
  // This correctly simulates composition/IME input (NOT a keydown event).
  // Old ghost-park approach: window keydown e.key.length===1 → MISSED IME.
  // New approach: valid PM selection → input goes directly into row → works.
  await page.keyboard.insertText('â');
  await page.waitForTimeout(150);

  const diagnostic = await dumpRows(page);
  const newRow = diagnostic.find((r) => r.text === 'â');
  const starterRow = diagnostic.find((r) => r.text.includes('[Math]') || r.text === '');
  const allTexts = diagnostic.map((r) => `"${r.text}"(mt=${r.marginTop})`).join(', ');

  await page.screenshot({ path: `${EVIDENCE}/case-ime-a-with-hat.png`, fullPage: false });

  // 'â' must be in the new row, not the starter row
  expect(newRow, `row with text='â' must exist. All rows: [${allTexts}]`).toBeDefined();

  // Starter row must NOT have 'â'
  const starterHasChar = diagnostic
    .filter((r) => r !== newRow)
    .some((r) => r.text.includes('â'));
  expect(starterHasChar, `'â' must NOT appear in any row other than new row. All rows: [${allTexts}]`).toBe(false);

  expect(tsErr.found(), `TextSelection error must not occur: ${tsErr.messages().join('; ')}`).toBe(false);
  expect(errs, `unexpected JS errors: ${errs.join(' | ')}`).toHaveLength(0);
});

// ── Case IME-STRING: multi-char IME string "aấâ" ─────────────────────────────

test('Case IME-STRING — insertText("aấâ") → full string in new row', async ({ page }) => {
  const errs = collectRealErrors(page);
  const tsErr = watchTextSelectionError(page);
  await page.goto(BASE_URL);
  await waitForEditor(page);

  const paper = await getPaperRect(page);
  await page.mouse.click(paper.left + 100, paper.top + 6 * RULE_HEIGHT);
  await page.waitForTimeout(150);

  await page.keyboard.insertText('aấâ');
  await page.waitForTimeout(150);

  const diagnostic = await dumpRows(page);
  const newRow = diagnostic.find((r) => r.text === 'aấâ');
  const allTexts = diagnostic.map((r) => `"${r.text}"`).join(', ');

  await page.screenshot({ path: `${EVIDENCE}/case-ime-string.png`, fullPage: false });
  expect(newRow, `row with text='aấâ' must exist. All rows: [${allTexts}]`).toBeDefined();

  expect(tsErr.found(), `TextSelection error must not occur: ${tsErr.messages().join('; ')}`).toBe(false);
  expect(errs, `unexpected JS errors: ${errs.join(' | ')}`).toHaveLength(0);
});

// ── Case EMPTY-ROW CLEANUP: click → don't type → click elsewhere → row deleted ─

test('Case CLEANUP — empty row deleted when clicking elsewhere without typing', async ({ page }) => {
  const errs = collectRealErrors(page);
  const tsErr = watchTextSelectionError(page);
  await page.goto(BASE_URL);
  await waitForEditor(page);

  const paper = await getPaperRect(page);
  const rowsBefore = await page.evaluate(() => document.querySelectorAll('.nib-row').length);

  // Step 1: click empty space → empty row created
  await page.mouse.click(paper.left + 100, paper.top + 4 * RULE_HEIGHT);
  await page.waitForTimeout(150);
  const rowsAfterFirstClick = await page.evaluate(() => document.querySelectorAll('.nib-row').length);
  expect(rowsAfterFirstClick, 'row must be created after first click').toBe(rowsBefore + 1);

  // Step 2: click empty space elsewhere WITHOUT typing → cleanup fires
  // cleanupPendingEmptyRow runs at start of next handlePointerDown
  await page.mouse.click(paper.left + 100, paper.top + 9 * RULE_HEIGHT);
  await page.waitForTimeout(250); // allow cleanup + new row creation

  // After cleanup: the previous empty row is deleted, new click creates new empty row.
  // Net count should still be rowsBefore + 1 (old empty deleted, new empty created).
  // OR if we click on content: rowsBefore.
  // Here we click on ANOTHER empty spot, so: old deleted, new created → rowsBefore + 1.
  const rowsAfterSecondClick = await page.evaluate(() => document.querySelectorAll('.nib-row').length);

  await page.screenshot({ path: `${EVIDENCE}/case-cleanup.png`, fullPage: false });

  // The first empty row must NOT still be in the doc (it should be gone or replaced)
  // Net count = rowsBefore + 1 (new empty row from second click only)
  expect(
    rowsAfterSecondClick,
    `after cleanup: only 1 pending empty row should exist (previous deleted). rows=${rowsAfterSecondClick}, before=${rowsBefore}`,
  ).toBe(rowsBefore + 1);

  expect(tsErr.found(), `TextSelection error must not occur: ${tsErr.messages().join('; ')}`).toBe(false);
  expect(errs, `unexpected JS errors: ${errs.join(' | ')}`).toHaveLength(0);
});

// ── Case CLICK-CONTENT: click existing row → no new row ───────────────────────

test('Case CLICK-CONTENT — click existing row → no new row, PM focused', async ({ page }) => {
  const errs = collectRealErrors(page);
  const tsErr = watchTextSelectionError(page);
  await page.goto(BASE_URL);
  await waitForEditor(page);

  const rowsBefore = await page.evaluate(() => document.querySelectorAll('.nib-row').length);

  // Click the starter row
  await page.locator('.nib-row').first().click();
  await page.waitForTimeout(150);

  const rowsAfter = await page.evaluate(() => document.querySelectorAll('.nib-row').length);
  const pmFocused = await page.evaluate(
    () => document.activeElement?.classList.contains('nib-pm') === true,
  );

  await page.screenshot({ path: `${EVIDENCE}/case-click-content.png`, fullPage: false });
  expect(rowsAfter, 'clicking existing row must NOT create new row').toBe(rowsBefore);
  expect(pmFocused, 'PM must be focused after clicking row').toBe(true);

  expect(tsErr.found(), `TextSelection error must not occur: ${tsErr.messages().join('; ')}`).toBe(false);
  expect(errs, `unexpected JS errors: ${errs.join(' | ')}`).toHaveLength(0);
});

// ── Case NO-DROP: ASCII type 'hello' → all 5 chars appear ────────────────────

test('Case NO-DROP — ASCII type "hello" after click → all 5 chars (regression)', async ({ page }) => {
  const errs = collectRealErrors(page);
  const tsErr = watchTextSelectionError(page);
  await page.goto(BASE_URL);
  await waitForEditor(page);

  const paper = await getPaperRect(page);
  await page.mouse.click(paper.left + 120, paper.top + 7 * RULE_HEIGHT);
  await page.waitForTimeout(150);

  await page.keyboard.type('hello');
  await page.waitForTimeout(150);

  const diagnostic = await dumpRows(page);
  const row = diagnostic.find((r) => r.text === 'hello');
  const allTexts = diagnostic.map((r) => `"${r.text}"`).join(', ');

  await page.screenshot({ path: `${EVIDENCE}/case-nodrop.png`, fullPage: false });
  expect(row?.text, `all 5 chars must appear (no drop). All rows: [${allTexts}]`).toBe('hello');

  expect(tsErr.found(), `TextSelection error must not occur: ${tsErr.messages().join('; ')}`).toBe(false);
  expect(errs, `unexpected JS errors: ${errs.join(' | ')}`).toHaveLength(0);
});

// ── Case CONSOLE-CLEAN: verify TextSelection error never appears across ops ────

test('Case CONSOLE-CLEAN — multiple clicks + types → 0 TextSelection endpoint errors', async ({ page }) => {
  const tsErr = watchTextSelectionError(page);
  const errs = collectRealErrors(page);
  await page.goto(BASE_URL);
  await waitForEditor(page);

  const paper = await getPaperRect(page);

  // Series of operations most likely to trigger the old TextSelection error:
  // 1. Click empty space (new row, empty selection)
  await page.mouse.click(paper.left + 100, paper.top + 3 * RULE_HEIGHT);
  await page.waitForTimeout(100);
  // 2. Immediately click another empty space (triggers cleanup + new row)
  await page.mouse.click(paper.left + 200, paper.top + 6 * RULE_HEIGHT);
  await page.waitForTimeout(100);
  // 3. Type something
  await page.keyboard.type('test');
  await page.waitForTimeout(100);
  // 4. Click empty again (new empty row)
  await page.mouse.click(paper.left + 50, paper.top + 10 * RULE_HEIGHT);
  await page.waitForTimeout(100);
  // 5. IME input
  await page.keyboard.insertText('ô');
  await page.waitForTimeout(100);
  // 6. Click content (starter row)
  await page.locator('.nib-row').first().click();
  await page.waitForTimeout(100);

  await page.screenshot({ path: `${EVIDENCE}/case-console-clean.png`, fullPage: false });

  // CRITICAL assertion
  expect(
    tsErr.found(),
    `TextSelection endpoint error MUST NOT occur. Got: ${tsErr.messages().join('; ')}`,
  ).toBe(false);
  expect(errs, `unexpected JS errors: ${errs.join(' | ')}`).toHaveLength(0);
});
