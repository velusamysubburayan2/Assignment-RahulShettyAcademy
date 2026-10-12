import { expect, test } from '@playwright/test';

test('Multi booking history and detail reconcilation', async ({ page }) => {

    console.log('1.Sign in and create a first booking by filtering for Conference events in '
        + 'Hyderabad with search text World, selecting quantity 1, '
        + ' and completing checkout with deterministic customer details.')
    await page.goto('/login');
    await page.getByPlaceholder('you@email.com').fill('mvsrayan1@gmail.com');
    await page.locator('#password').fill('Boopalan@231996');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForLoadState('networkidle');
    await page.getByText('Browse Events →').click();
    await page.getByPlaceholder('Search events, venues…').fill('World');
    await page.locator('select').first().selectOption('Conference');
    await page.locator('select').last().selectOption('Hyderabad');

    //Booking-1
    let booking1EventTitle = 'World Tech Summit';
    let eventCard = page.locator('#event-card');
    await page.waitForLoadState('networkidle');
    await eventCard.first().waitFor();
    let worldTechFilter = eventCard.filter(booking1EventTitle);
    await worldTechFilter.getByRole('link', { name: 'Book Now' }).click();
    const booking1Email = 'mvsrayan1@gmail.com';
    await page.getByPlaceholder('Your full name').fill('Subburayan Velusamy');
    await page.getByPlaceholder('you@email.com').fill(booking1Email);
    await page.locator('#phone').fill('8072129977');
    await page.getByRole('button', { name: 'Confirm Booking' }).click();

    console.log('2.Capture the returned event title, booking reference,'
        + 'ticket count, total text, and customer email from that first booking.')
    const booking1Ref = await page.locator('.booking-ref').textContent();
    const booking1Tickets = await page.locator(".p-4 div:nth-child(3) .font-medium").textContent();
    const booking1Price = await page.locator('.p-4 div').filter({ hasText: '$' }).locator('span').last().textContent();
    console.log('booking1Ref=' + booking1Ref + ',booking1Tickets=' + booking1Tickets + ',booking1Price=' + booking1Price)

    console.log('3.Confirm the first event title is World Tech Summit, '
        + 'the booking reference is non-empty, and the ticket count is 1.')
    await expect(page.locator("nav[class*='mb-6'] span:nth-child(3)")).toContainText(booking1EventTitle);
    await expect(booking1Ref).not.toEqual('');
    await expect(parseInt(booking1Tickets)).toEqual(1);

    console.log('4.Return to the Events catalog and create a second booking by filtering for Festival events '
        + 'in Delhi with search text Dilli and quantity 2.')
    await page.getByRole('button', { name: 'Browse More Events' }).click();
    await page.getByPlaceholder('Search events, venues…').fill('Dilli');
    await page.locator('select').first().selectOption('Festival');
    await page.locator('select').last().selectOption('Delhi');
    //Booking-2
    let booking2EventTitle = 'Dilli Diwali Mela';
    await page.waitForLoadState('networkidle');
    await eventCard.first().waitFor();
    let dilliFilter = eventCard.filter({ hasText: booking2EventTitle });
    await dilliFilter.getByRole('link', { name: 'Book Now' }).click();

    const booking2Email = 'boopalan@gmail.com';
    await page.getByPlaceholder('Your full name').fill('Boopalan Vasu');
    await page.getByPlaceholder('you@email.com').fill(booking2Email);
    await page.locator('#phone').fill('9080751313');
    await page.locator('.space-y-4').filter({ hasText: 'Tickets' }).first().getByRole('button', { name: '+' }).click();
    await page.getByRole('button', { name: 'Confirm Booking' }).click();

    console.log('5.Capture the second booking payload and confirm its reference and '
        + 'event title differ from the first booking, with ticket count 2.')
    const booking2Ref = await page.locator('.booking-ref').textContent();
    const booking2Tickets = await page.locator(".p-4 div:nth-child(3) .font-medium").textContent();
    const booking2Price = await page.locator('.p-4 div').filter({ hasText: '$' }).locator('span').last().textContent();
    console.log('booking2Ref=' + booking2Ref + ',booking2Tickets=' + booking2Tickets + ',booking2Price=' + booking2Price)
    expect(booking2Ref).not.toEqual(booking1Ref);
    expect(booking2EventTitle).not.toEqual(booking1EventTitle);
    expect(parseInt(booking2Tickets)).not.toEqual(parseInt(booking1Tickets));

    console.log('6.Open My Bookings and locate both cards by booking reference text only. Do not assume card order.')
    await page.getByTestId('nav-bookings').click();
    let bookingCards = page.getByTestId('booking-card');
    await bookingCards.first().waitFor();
    let worldSumitLocation = bookingCards.filter({ hasText: booking1Ref });
    let dilliLocation = bookingCards.filter({ hasText: booking2Ref });

    console.log('7.Confirm each matched card is visible and shows confirmed status.')
    await expect(worldSumitLocation).toBeVisible();
    expect(await worldSumitLocation.locator('.mb-2 span').nth(1).textContent()).toEqual('confirmed');
    await expect(dilliLocation).toBeVisible();
    expect(await dilliLocation.locator('.mb-2 span').nth(1).textContent()).toEqual('confirmed');

    console.log('8.On each card, confirm event title, ticket count text, '
        + 'and total text match the stored booking payload for that reference.')
    expect(await worldSumitLocation.locator('h3').textContent()).toEqual(booking1EventTitle);
    expect(await worldSumitLocation.locator('.gap-y-1 span').nth(1).textContent()).toContain(booking1Tickets);
    await expect(worldSumitLocation.locator('.shrink-0')).toContainText(booking1Price);
    let bookingId1 = await worldSumitLocation.getByTestId('booking-id').textContent();

    expect(await dilliLocation.locator('h3').textContent()).toEqual(booking2EventTitle);
    expect(await dilliLocation.locator('.gap-y-1 span').nth(1).textContent()).toContain(booking2Tickets);
    await expect(dilliLocation.locator('.shrink-0')).toContainText(booking2Price);
    let bookingId2 = await dilliLocation.getByTestId('booking-id').textContent();

    console.log('9.Open the first booking’s detail page from its matched card and confirm breadcrumb or'
        + ' header reference, main event title, customer email, payment summary tickets/total, and a numeric booking id.')
    await worldSumitLocation.getByRole('button', { name: 'View Details' }).click();
    let event = page.locator('.space-y-3').nth(0).locator('.gap-4').filter({ hasText: 'Event' });
    expect(await event.locator('span').nth(1).textContent()).toContain(booking1EventTitle);

    let mail = page.locator('.space-y-3').nth(1).locator('.gap-4').filter({ hasText: 'Email' });
    expect(await mail.locator('span').nth(1).textContent()).toContain(booking1Email);

    let tickets = page.locator('.space-y-3').nth(2).locator('.gap-4').filter({ hasText: 'Tickets' });
    expect(await tickets.locator('span').nth(1).textContent()).toContain(booking1Tickets);

    let bookingId = page.locator('.space-y-3').nth(3).locator('.gap-4').filter({ hasText: 'Booking ID' });
    expect(await bookingId.locator('span').nth(1).textContent()).toContain(bookingId1);

    console.log('10.Return to My Bookings, re-find the second booking by reference, open its detail page, and '
        + 'confirm title, tickets (2), total, and that the first bookings reference does not appear by mistake.')
    await page.getByRole('button', { name: '← Back to My Bookings' }).click();
    await dilliLocation.getByRole('button', { name: 'View Details' }).click();
    expect(await event.locator('span').nth(1).textContent()).toContain(booking2EventTitle);
    expect(await mail.locator('span').nth(1).textContent()).toContain(booking2Email);
    expect(await tickets.locator('span').nth(1).textContent()).toContain(booking2Tickets);
    expect(await bookingId.locator('span').nth(1).textContent()).toContain(bookingId2);

})