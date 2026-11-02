import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  use: { baseURL: 'http://127.0.0.1:4300', channel: process.env['PLAYWRIGHT_CHANNEL'] || undefined, headless: true },
  webServer: {
    command: 'python -m http.server 4300 --bind 127.0.0.1 --directory dist/personal-site/browser',
    url: 'http://127.0.0.1:4300',
    reuseExistingServer: false,
  },
});
