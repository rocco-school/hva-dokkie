import {utils} from "@hboictcloud/api";

/**
 * Redirects to the event-detail page when an event row is clicked.
 *
 * @param {HTMLTableRowElement} row - The HTML row element representing the event to be shown
 * @returns {Promise<void>} A Promise that resolves after the specified delay.
 */
export async function handleRedirectToEventDetail(row: HTMLTableRowElement): Promise<void> {
    const id: eventInterface["eventId"] = row.getAttribute("id");

    if (id) {
        const url: string = utils.createUrl("single-event.html", {
            eventId: id,
        });
        if (url) {
            window.location.href = url;
        }
    }
}