/*
 The core playwright package provides libraries for browsers and APIs like launching browsers , connecting API.
 Playwright test runner package provides total testing framework like retries,browsercontext fixtures, assertions.
*/
import {expect, test} from '@playwright/test'

test('Login page check test 1',async ({page})=>{

    await page.goto("https://eventhub.rahulshettyacademy.com/login");
    await expect(page.getByText("Sign in to EventHub")).toBeVisible();
    await expect(page.getByPlaceholder("you@email.com")).toBeVisible();
    //await expect(page.getByRole('button',{name:'Sign In'})).toBeVisible();
    await expect(page.locator("button[id='login-btn']")).toContainText('Sign In');

})

test('Login page check test 2',async ({page})=>{

    await page.goto("https://eventhub.rahulshettyacademy.com/login");
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.url()).toContain('/login');

})