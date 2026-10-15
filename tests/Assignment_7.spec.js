import { expect, request, test } from "@playwright/test";
const loginPayload = { email: "mvsrayan1@gmail.com", password: "Boopalan@231996" };

test('Booking Reference API UI cancel Cleanup', async ({ page }) => {
    let token;
    let liveEvent;
    let eventBookingResponseJSON;
    //login to the application
    const apiContext = await request.newContext();
    const loginResponse = await apiContext.post("https://api.eventhub.rahulshettyacademy.com/api/auth/login",
        {
            data: loginPayload,
        })
    const loginResponseJson = await loginResponse.json();//to get json body-token,message
    token = await loginResponseJson.token;


    //Getting Live event
    const eventListResponse = await apiContext.get('https://api.eventhub.rahulshettyacademy.com/api/events?page=1&limit=12', {
        headers: {
            authorization: `Bearer ${token}`,
            'content-type': 'application/json',
        },
    });
    const eventListResponseJSON = await eventListResponse.json();
    liveEvent = await eventListResponseJSON.data.find((event) => event.totalSeats > 2);
    console.log(liveEvent.title);

    //booking 
    const bookingEventPayload = {
        customerName: "Subburayan Velusamy", customerEmail: "mvsrayan@gmail.com",
        customerPhone: "99999999999999", quantity: 2, eventId: liveEvent.id
    };
    const eventBookingResponse = await apiContext.post('https://api.eventhub.rahulshettyacademy.com/api/bookings', {
        data: bookingEventPayload,
        headers: {
            authorization: `Bearer ${token}`,
            'content-type': 'application/json',
        },
    });
    eventBookingResponseJSON = await eventBookingResponse.json();
    console.log(eventBookingResponseJSON);

    console.log('6.Seed the authenticated browser session with the saved token before the first app navigation, '
        + 'open My Bookings, and locate the card by reference text.')
    await page.addInitScript(value => {
        window.localStorage.setItem('eventhub_token', value);
    }, token);

    await page.goto('https://eventhub.rahulshettyacademy.com/');
    await expect(page.getByRole('button', { name: 'My Bookings' })).toBeVisible();
    await page.getByRole('button', { name: 'My Bookings' }).click();
    const waitforMyBookings = page.waitForResponse(
        (response) => new URL(response.url()).pathname.endsWith('/bookings') && response.status() === 200,
    );
    await waitforMyBookings;
    let apiBookCard = page.getByTestId('booking-card').filter({ hasText: eventBookingResponseJSON.data.bookingRef });

    console.log('7.Confirm the card title matches the runtime-selected event title and shows two tickets with the expected total.')

    expect(await apiBookCard.locator('h3').textContent()).toContain(eventBookingResponseJSON.data.event.title);
    await expect(apiBookCard.locator('.gap-y-1 span').nth(1)).toContainText(String(eventBookingResponseJSON.data.quantity));
    let apiBookCardprice = await apiBookCard.locator('.shrink-0 p').nth(0).textContent();
    expect(apiBookCardprice.replace(/[$,]/g, "")).toContain(String(eventBookingResponseJSON.data.totalPrice));

    console.log('8.Open View Details from that card and confirm the detail path, breadcrumb/reference, event details, payment summary, '
        + 'and customer email all match the stored API booking data.')
    await apiBookCard.getByRole('button', { name: 'View Details' }).click();
    const viewDetailsResponse = page.waitForResponse(
        (response) => new URL(response.url()).pathname.endsWith(`/api/bookings/${eventBookingResponseJSON.data.id}`)
            && response.status() === 200,
    )
    await viewDetailsResponse;
    expect(page.url()).toContain(String(eventBookingResponseJSON.data.id));
    let event = page.locator('.space-y-3').nth(0).locator('.gap-4').filter({ hasText: 'Event' });
    expect(await event.locator('span').nth(1).textContent()).toContain(eventBookingResponseJSON.data.event.title);

    let mail = page.locator('.space-y-3').nth(1).locator('.gap-4').filter({ hasText: 'Email' });
    expect(await mail.locator('span').nth(1).textContent()).toContain(eventBookingResponseJSON.data.customerEmail);

    let ticketsTotalPrice = await page.locator('.pt-2 span').nth(1).textContent();
    expect(ticketsTotalPrice.replace(/[$,]/g, "")).toContain(String(eventBookingResponseJSON.data.totalPrice));

    let bookingId = page.locator('.space-y-3').nth(3).locator('.gap-4').filter({ hasText: 'Booking ID' });
    expect(await bookingId.locator('span').nth(1).textContent()).toContain(String(eventBookingResponseJSON.data.id));

    console.log('9.Cancel/delete the booking through the authenticated API using the stored booking id and confirm the delete succeeds.')
    // await page.getByRole('button', { name: 'Cancel Booking' }).click();
    // await page.getByTestId('confirm-dialog-yes').click();

    const deleteResponse = await apiContext.delete(`https://api.eventhub.rahulshettyacademy.com/api/bookings/${eventBookingResponseJSON.data.id}`,
        {
            headers: {
                authorization: `Bearer ${token}`,
                'content-type': 'application/json',
            }
        })
    const deleteResponseJSON = await deleteResponse.json();
    console.log(deleteResponseJSON);
    //await page.getByRole('button',{name:'← Back to My Bookings'}).click();
    await page.reload();
    await page.getByRole('button',{name:'View My Bookings'}).click();
    await waitforMyBookings;

    console.log('10,11,12.Look the booking up again by reference and confirm it is no longer retrievable')
    let apiBookCarddeleted = page.getByTestId('booking-card').filter({ hasText: eventBookingResponseJSON.data.bookingRef });
    await expect(apiBookCarddeleted).not.toBeVisible();

    await apiContext.dispose();

})
