// Function to show a success message.
import {delay} from "./delay";

export async function showSuccessMessage(message: string, duration: number | null): Promise<void> {
    const filter: Element | null = document.querySelector(".filter");
    const messageButton: Element | null = document.querySelector(".continue-button");
    const CustomMessage: Element | null = document.querySelector(".message");
    const successIcon: Element | null = document.querySelector(".success-background");

    filter?.classList.remove("hidden");
    messageButton?.classList.add("hidden");
    successIcon?.classList.remove("hidden");

    if (CustomMessage) {
        CustomMessage.innerHTML = message ?? "Successful!";
    }

    if (!duration) {
        duration = 1000;
    }

    await delay(duration);

    successIcon?.classList.add("hidden");
    filter?.classList.add("hidden");
    messageButton?.classList.remove("hidden");
}