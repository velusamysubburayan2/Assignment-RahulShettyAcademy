import { test, expect } from '@playwright/test';

test('Pached booking summary and reconciliation', async ({ page }) => {
    let unpatchedBooing;
    let patchedBooking;
    const patchedValues = {
        bookingRef: 'QA-PATCH-2026-001',
        eventTitle: 'Mocked Booking Reconciliation Event',
        quantity: 3,
        totalPrice: 4321,
    };

    console.log('1.Sign in and confirm the My Bookings navigation is available.')
    await page.goto('/login');
    await page.getByPlaceholder('you@email.com').fill('mvsrayan1@gmail.com');
    await page.locator('#password').fill('Boopalan@231996');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page.getByRole('button', { name: 'My Bookings' })).toBeVisible();

    console.log('Steps - 2,3,4.')

    await page.route('**/api/bookings**',
        async (route) => {
            const request = route.request();
            const requestUrl = new URL(request.url());

            const isBookingList = request.method() === 'GET' && requestUrl.pathname.endsWith('/api/bookings');
            if (isBookingList) {

                const response = await route.fetch();
                const liveResponse = await response.json();
                const originalBooking = liveResponse.data[0];
                unpatchedBooing = liveResponse.data.find((booking) => booking.id !== originalBooking.id);
                patchedBooking = {
                    ...originalBooking,
                    bookingRef: patchedValues.bookingRef,
                    quantity: patchedValues.quantity,
                    totalPrice: patchedValues.totalPrice,
                    event: {
                        ...originalBooking.event,
                        title: patchedValues.eventTitle,
                    }

                }

                const patchedBookings = [...liveResponse.data];
                patchedBookings[0] = patchedBooking;
                await route.fulfill({
                    response,
                    body: JSON.stringify({
                        ...liveResponse,
                        data: patchedBookings,
                    }),

                });
                return;
            }

            const detailID = requestUrl.pathname.match(/\/api\/bookings\/([^/]+)$/)?.[1];
            if (request.method() == 'GET' && patchedBooking && String(patchedBooking.id) === detailID) {
                const response = await route.fetch();
                const liveDetailResponse = await response.json();
                const liveDetailBooking = liveDetailResponse.data;
                await route.fulfill({
                    response,
                    body: JSON.stringify({
                        ...liveDetailResponse,
                        data: {
                            ...liveDetailBooking,
                            bookingRef: patchedValues.bookingRef,
                            quantity: patchedValues.quantity,
                            totalPrice: patchedValues.totalPrice,
                            event: {
                                ...liveDetailBooking.event,
                                title: patchedValues.eventTitle,
                            }
                        }
                    })
                });
                return;
            }
            await route.continue();
        });
    console.log('5.Store the patched booking object for later checks,'
        + ' then open My Bookings and confirm the My Bookings heading is visible.')
    await page.getByRole('button', { name: 'My Bookings' }).click();
    const waitforListResponse = await page.waitForResponse(
        (response) => new URL(response.url()).pathname.endsWith('/api/bookings') && response.status() === 200,
    )
    waitforListResponse;
    await expect(page.locator('h1')).toBeVisible();

    console.log('6.Locate the patched card by reference text only (never by position) and '
        + 'confirm the patched title, ticket count text, and total amount appear there.')
    let patchedCard = page.getByTestId('booking-card').filter({ hasText: patchedValues.eventTitle });
    await expect(patchedCard.locator('.gap-y-1 span').nth(1)).toContainText(String(patchedValues.quantity));
    let patchedCardprice = await patchedCard.locator('.shrink-0 p').nth(0).textContent();
    expect(patchedCardprice.replace(/[$,]/g, "")).toContain(String(patchedValues.totalPrice));

    console.log('7.Confirm at least one other card still shows a different live reference or title, '
        + 'proving only one record was altered.')
    let unpatchedCard = page.getByTestId('booking-card').filter({ hasText: unpatchedBooing.event.title });
    await expect(unpatchedCard.locator('.gap-y-1 span').nth(1)).toContainText(String(unpatchedBooing.quantity));
    let unpatchedCardprice = await unpatchedCard.locator('.shrink-0 p').nth(0).textContent();
    expect(unpatchedCardprice.replace(/[$,]/g, "")).toContain(unpatchedBooing.totalPrice);

    console.log('8.Open View Details for the patched card and confirm navigation uses the preserved booking id.')
    await patchedCard.getByRole('button', { name: 'View Details' }).click();
    const detailwaitResponse = page.waitForResponse(
        (response) => new URL(response.url()).pathname.endsWith(`/api/bookings/${patchedBooking.id}`) && response.status() === 200,
    );
    await detailwaitResponse;
    await expect(page.url()).toContain(String(patchedBooking.id));

    console.log('9,10.Intercept the detail response for that same booking id so the detail fields stay aligned with the patched list values for reference, title, tickets,'
        + 'and total, while at least one real field such as customer email remains unchanged.')
    let event = page.locator('.space-y-3').nth(0).locator('.gap-4').filter({ hasText: 'Event' });
    expect(await event.locator('span').nth(1).textContent()).toContain(patchedValues.eventTitle);

    let mail = page.locator('.space-y-3').nth(1).locator('.gap-4').filter({ hasText: 'Email' });
    expect(await mail.locator('span').nth(1).textContent()).toContain(patchedBooking.customerEmail);

    let ticketsTotalPrice = await page.locator('.pt-2 span').nth(1).textContent();
    expect(ticketsTotalPrice.replace(/[$,]/g, "")).toContain(String(patchedBooking.totalPrice));

    let bookingId = page.locator('.space-y-3').nth(3).locator('.gap-4').filter({ hasText: 'Booking ID' });
    expect(await bookingId.locator('span').nth(1).textContent()).toContain(String(patchedBooking.id));

    console.log('11.Return to My Bookings, re-find the same card by patched reference, '
        + 'and confirm the total still matches the detail page.')
    await page.getByRole('link', { name: '← Back to My Bookings' }).click();
    waitforListResponse;
    let patchedCardprice1 = await patchedCard.locator('.shrink-0 p').nth(0).textContent();
    expect(patchedCardprice1.replace(/[$,]/g, "")).toContain(String(ticketsTotalPrice.replace(/[$,]/g, "")));



})