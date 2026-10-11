// @ts-check
import { defineConfig, devices } from '@playwright/test';
/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  retries: 1,
  use: {
    baseURL: 'https://eventhub.rahulshettyacademy.com/login',

  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chrome',
      use: {
        browserName: 'chromium',
        headless: true,
        viewport: null,
        launchOptions: {
          args: ['--start-maximized'],
        }
      }
    },
    {
      name: 'firefox',
      use: {
        browserName: 'firefox',
        headless: false,
        viewport: null,
        launchOptions: {
          args: ['--start-maximized'],
        }
      }
    }
  ]
});

