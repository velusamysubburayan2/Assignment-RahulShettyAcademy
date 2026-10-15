import { test, expect } from '@playwright/test'

test('mocked events catalog filter reconciliation', async ({ page }) => {

    console.log('1.Sign in with valid credentials.')
    await page.goto('/login');
    await page.getByPlaceholder('you@email.com').fill('mvsrayan1@gmail.com');
    await page.locator('#password').fill('Boopalan@231996');
    await page.getByRole('button', { name: 'Sign In' }).click();

    console.log('2.Prepare a mock events dataset with at least four realistic events that differ '
        + 'by id, title, category, city, price, and available seats.')
    const mockEvents = [
        { id: "1", title: 'Tech Summit 2025', category: 'Conference', eventDate: '2025-06-01T10:00:00.000Z', venue: 'HICC', city: 'Hyderabad', price: '999', totalSeats: "200", availableSeats: "150", imageUrl: null, isStatic: false },
        { id: "2", title: 'Rock Night Live', category: 'Festival', eventDate: '2025-06-05T18:00:00.000Z', venue: 'Palace Grounds', city: 'Delhi', price: '1500', totalSeats: "500", availableSeats: "300", imageUrl: null, isStatic: false },
        { id: "3", title: 'IPL Finals', category: 'Concert', eventDate: '2025-06-10T19:30:00.000Z', venue: 'Chinnaswamy', city: 'Mumbai', price: '2000', totalSeats: "800", availableSeats: "50", imageUrl: null, isStatic: false },
        { id: "4", title: 'UX Design Workshop', category: 'Workshop', eventDate: '2025-06-15T09:00:00.000Z', venue: 'WeWork', city: 'Bangalore', price: '500', totalSeats: "50", availableSeats: "20", imageUrl: null, isStatic: false },
    ]
    const catalogResponse = {
        data: mockEvents,
        pagination: { page: 1, totalPages: 1, total: mockEvents.length, limit: 12 },
    };
    let catalogRequestCount = 0;
    let detailRequestCount = 0;

    console.log('3.Before opening Events, install route interception so the catalog request and '
        + 'matching event-detail request return data from that same mock dataset.')
    await page.route('**/api/events**', async (route) => {
        const requestUrl = new URL(route.request().url());
        const eventId = requestUrl.pathname.match(/\/api\/events\/([^/]+)$/)?.[1];
        const detailEvent = mockEvents.find((event) => event.id === eventId);

        if (detailEvent) {
            detailRequestCount += 1;
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ data: detailEvent }),
            });
            return;
        }

        if (requestUrl.pathname.endsWith('/api/events')) {
            catalogRequestCount += 1;
            const search = requestUrl.searchParams.get('search')?.toLowerCase();
            const category = requestUrl.searchParams.get('category')?.toLowerCase();
            const city = requestUrl.searchParams.get('city')?.toLowerCase();
            const filteredEvents = mockEvents.filter((event) => {
                const matchesSearch =
                    !search ||
                    [event.title, event.venue, event.city].some((value) =>
                        value.toLowerCase().includes(search),
                    );
                const matchesCategory = !category || event.category.toLowerCase() === category;
                const matchesCity = !city || event.city.toLowerCase() === city;
                return matchesSearch && matchesCategory && matchesCity;
            });

            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    ...catalogResponse,
                    data: filteredEvents,
                    pagination: {
                        ...catalogResponse.pagination,
                        total: filteredEvents.length,
                    },
                }),
            });
            return;
        }

        await route.continue();
    });
    console.log('4.Open Events and confirm the Upcoming Events heading is visible.')
    await page.getByText('Browse Events →').click();
    await expect(page.locator('h1')).toContainText('Upcoming Events');

    console.log('5.Confirm exactly four event cards appear, all four mocked titles are visible, '
        + 'and the live title World Tech Summit does not appear.')
    const eventIdsLoc = page.getByTestId('event-card');
    await eventIdsLoc.first().waitFor();
    expect(await eventIdsLoc.count()).toEqual(4);
    for (let i = 0; i < 4; i++) {
        await expect(eventIdsLoc.getByRole('link', { name: mockEvents[i].title })).toBeVisible();
    }
    await expect(eventIdsLoc.getByRole('link', { name: 'World Tech Summit' })).not.toBeVisible();

    console.log('6.Confirm each card shows price and seat availability from the mock dataset, '
        + 'and that title / Book Now links point at the matching mocked event id.')
    for (let i = 0; i < 4; i++) {
        let eventIDTitleLoc = eventIdsLoc.filter({ hasText: mockEvents[i].title });
        let price = await eventIDTitleLoc.locator('.pt-3 p').textContent();
        let seatsAvail = await eventIDTitleLoc.locator('.pt-3 span').textContent();
        let booknowLink = await eventIDTitleLoc.getByTestId('book-now-btn').getAttribute('href');

        expect(price.replace(/[$,]/g, "")).toContain(mockEvents[i].price);
        expect(seatsAvail).toContain(mockEvents[i].availableSeats);
        expect(booknowLink).toContain(mockEvents[i].id);
    }

    console.log('7.Filter with the Hyderabad conference keyword, category Conference, '
        + 'and city Hyderabad until exactly one card remains, then store that mock record.')
    await page.getByPlaceholder('Search events, venues…').fill('Hyderabad');
    await page.locator('select').first().selectOption('Conference');
    await page.locator('select').last().selectOption('Hyderabad');
    await eventIdsLoc.first().waitFor();
    await page.waitForLoadState('networkidle');
    expect(await eventIdsLoc.count()).toEqual(1);
    const visibleTitle = await eventIdsLoc.locator('h3').textContent();
    const selectedEvent = mockEvents.find((event) => event.title === visibleTitle?.trim());

    console.log('8.Open Book Now from the remaining card and confirm the detail page path, title,'
        + 'price, venue/city, and available seats match the stored mock record.')
    await eventIdsLoc.getByRole('link', { name: 'Book Now' }).click();
    const detailResponse = page.waitForResponse(
        (response) =>
            response.url().endsWith(`api/events/${selectedEvent.id}`) && response.status() === 200);
    await detailResponse;
    expect(page.url()).toContain(`/events/${selectedEvent.id}`);
    await expect(page.locator('h1')).toContainText(selectedEvent.title);
    await expect(page.locator('.items-start').filter({ hasText: '$' }).locator('.text-sm'))
        .toContainText(selectedEvent.price);
    await expect(page.locator('.items-start').filter({ hasText: 'Venue' }).locator('.text-sm'))
        .toContainText(selectedEvent.venue);
    await expect(page.locator('.items-start').filter({ hasText: 'Available' }).locator('span').last())
        .toContainText(selectedEvent.totalSeats);

    console.log('9.Confirm ticket quantity starts at 1, total equals the mock price for one ticket, '
        + 'then increase quantity to 2 and confirm the total becomes price × 2.')
    await expect(page.locator('#ticket-count')).toHaveText("1");
    await expect(page.locator('.pt-1').last()).toContainText(selectedEvent.price);
    await page.getByRole('button', { name: '+' }).click();
    console.log(selectedEvent.price * 2);
    let eveprice = await page.locator('.pt-1').last().textContent();
    expect(eveprice.replace(/[$,]/g, "")).toContain(String(selectedEvent.price * 2));

})