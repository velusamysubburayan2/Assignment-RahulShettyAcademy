//playwright.config1.js--config file
import { expect, test } from '@playwright/test'

//Each test gets a clean slate (no cookies, no cache carried over).
test('Smoketest-1 login Assignment-2', async ({ page }) => {

    await page.goto('/login');
    await expect(page).toHaveTitle('EventHub — Discover & Book Events');
    await expect(page.getByPlaceholder('you@email.com')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();

})

test('Smoketest-2 login Assignment-2', async ({ page, browser }) => {

    /*1.if you use page fixture , it launches browser and opens page with isolated session but 
    you can't set any cookies and cache.
    2.if you want , you can open multiple pages inside this page fixture.*/
    await page.goto('/login');
    await page.getByPlaceholder('you@email.com').fill('beginner@sample.com');
    await expect(page.getByPlaceholder('you@email.com')).toHaveValue('beginner@sample.com');

    /*When you use with browser conext it creates isolated session and you can also set cookies,caches.
    these getting shared to all the pages which belongs to this context.*/
    const context = await browser.newContext();
    const page1 = await context.newPage();
    await page1.goto("https://eventhub.rahulshettyacademy.com/login");
    await expect(page1.getByText("Sign in to EventHub")).toBeVisible();
    await expect(page1.getByPlaceholder('you@email.com')).toHaveValue('');
    await page1.close();

})