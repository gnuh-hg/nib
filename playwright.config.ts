import { defineConfig } from '@playwright/test';

/**
 * Playwright config cho Nib E2E/smoke tests.
 * Spec files: tests/e2e/<slug>.spec.ts
 * Evidence:   tests/evidence/<slug>/  (commit làm baseline regression)
 * Dev server: npm run dev → http://localhost:1420
 *
 * Chạy: npx playwright test
 *       npx playwright test tests/e2e/<slug>.spec.ts
 * Report:     playwright-report/ (gitignore — chỉ xem local)
 * Raw output: test-results/ (gitignore)
 */
export default defineConfig({
  testDir: './tests/e2e',
  // Mỗi test chạy độc lập, không retry mặc định (tránh flake-hide)
  retries: 0,
  // Timeout 30s/test — đủ cho Vite dev server cold start
  timeout: 30_000,
  // 1 worker (tránh race với HMR + đảm bảo screenshot đúng thứ tự)
  workers: 1,
  reporter: [
    ['list'],                      // Output ngắn gọn trong Bash
    ['html', { open: 'never' }],  // playwright-report/ — mở thủ công khi cần
  ],
  use: {
    baseURL: 'http://localhost:1420',
    // Screenshot khi FAIL (auto-saved vào test-results/)
    screenshot: 'only-on-failure',
    // Trace khi FAIL — giúp debug
    trace: 'on-first-retry',
    // Headless (background-safe — ISSUE-8 đã giải block)
    headless: true,
    // Viewport desktop-class theo yêu cầu nền [LOCKED] docs/requirements.md
    viewport: { width: 1440, height: 900 },
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
  // Dev server không được tự khởi (tester chạy npm run dev riêng)
  // webServer: undefined — báo lỗi rõ nếu :1420 chưa chạy
});
