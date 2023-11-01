import {delay} from "./delay";

/**
 * Display a success message with an optional duration.
 *
 * @param {string} message - The success message to display.
 * @param {number|null} duration - Optional duration for displaying the success message. If not provided, it defaults to 1000ms (1 second).
 */
export async function showSuccessMessage(message, duration): Promise<void> {
    // Get references to HTML elements
    const filter: Element = document.querySelector(".filter");
    const messageButton: Element = document.querySelector(".continue-button");
    const CustomMessage: Element = document.querySelector(".message");
    const successIcon: Element = document.querySelector(".success-background");

    // Show the filter and hide the message button and success icon
    filter?.classList.remove("hidden");
    messageButton?.classList.add("hidden");
    successIcon?.classList.remove("hidden");

    // Set the custom message content
    if (CustomMessage) {
        CustomMessage.innerHTML = message ?? "Successful!";
    }

    // Set a default duration if not provided
    if (!duration) {
        duration = 1000; // Default to 1000ms (1 second)
    }

    await delay(duration);

    // Hide the success icon and filter, and show the message button
    successIcon?.classList.add("hidden");
    filter?.classList.add("hidden");
    messageButton?.classList.remove("hidden");
}