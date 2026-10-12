import { test, expect } from '@playwright/test';

test('Practice reliable locators on the EventHub Events page', async ({ page }) => {

    console.log('1.Sign in and open the Events page from Browse Events.');
    await page.goto('/login');
    await page.getByPlaceholder('you@email.com').fill('mvsrayan1@gmail.com');
    await page.locator('#password').fill('Boopalan@231996');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForLoadState('networkidle');//waiting for All the api calls related to this page to load
    await page.getByText('Browse Events →').click();

    console.log('2.Confirm the Upcoming Events heading is visible.');
    await expect(page.locator("h1:has-text('Upcoming Events')")).toBeVisible();

    console.log('3.Use several locator strategies on the filter area: search for World,'
        + 'choose category Conference, and choose city Hyderabad.')
    await page.getByPlaceholder('Search events, venues…').fill('World');
    await page.locator('select').first().selectOption('Conference');
    await page.locator('select').last().selectOption('Hyderabad');

    console.log('4.Work with the visible event cards: confirm at least one card matches,'
        + 'narrow to the card that shows World Tech Summit, and confirm exactly one match.')
    let eventCard = page.locator('#event-card');
    let worldTechFilter = eventCard.filter('World Tech Summit')
    await page.waitForLoadState('networkidle');
    await eventCard.first().waitFor();
    let count = await eventCard.count();
    await expect(count).toBeGreaterThan(0);
    await expect(worldTechFilter).toHaveCount(1);

    console.log('5.From that matching card, capture the event title, price text, and seats text.')
    let eventTitle = await worldTechFilter.locator('h3').textContent();
    let priceText = await worldTechFilter.locator('.justify-between p').textContent();
    let seatsText = await worldTechFilter.locator('.justify-between span').textContent();

    console.log('6.Confirm the title is World Tech Summit, the price text contains $,'
        + 'and the available seat count parsed from the seats text is greater than 0.')

    expect(eventTitle).toContain('World Tech Summit');
    expect(priceText).toContain('$');
    let seatsLeft = parseInt(seatsText.split('seats')[0].trim());
    expect(seatsLeft).toBeGreaterThan(0);

    console.log('7.From inside that same card only, open Book Now.')
    await worldTechFilter.getByRole('link', { name: 'Book Now' }).click();

    console.log('8.Confirm the detail page URL contains /events/, the main heading matches the stored title,'
        + 'and the price section matches the stored price text.')
    await expect(page).toHaveURL(/\/events\//);
    await expect(page.locator("nav[class*='mb-6'] span:nth-child(3)")).toContainText(eventTitle);
    await expect(page.locator(".mb-6 div:nth-child(6) p:nth-child(2)")).toContainText(priceText);


    console.log('9.Return to the Events list, clear filters back to all categories and cities,'
        + 'and confirm at least three cards are visible.')
    await page.goBack();
    await page.getByRole('button', { name: 'Clear filters' }).click();
    await page.waitForLoadState('networkidle');
    await eventCard.first().waitFor();
    let count1 = await eventCard.count();
    console.log(count1);
    expect(count1).toBeGreaterThan(3);

    console.log('10.Compare the first, second, and last card titles: all must be non-empty, '
        + 'and the first and last titles must differ.')
    for (let i = 0; i < 3; i++) {
        expect(await eventCard.nth(i).locator('h3').textContent()).not.toEqual('');
    }

    const firstTitle = await eventCard.nth(0).locator('h3').textContent();
    const lastTitle = await eventCard.nth(count1 - 1).locator('h3').textContent();
    expect(firstTitle).not.toEqual(lastTitle);

    console.log('11.Do not use hard waits or sleep-based delays; '
        + 'rely on Playwright’s built-in waiting.')
}

)