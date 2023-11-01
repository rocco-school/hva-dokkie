/**
 * Closes the delete confirmation windows
 *
 * @returns {Promise<void>} A Promise that resolves after the specified delay.
 */
export async function closeDeleteMessage(): Promise<void> {
    const confirmation: Element | null = document.querySelector(".filter");
    const deleteIcon: Element | null = document.querySelector(".delete-background");
    const cancelButton: Element | null = document.querySelector(".close-modal-button");

    cancelButton?.classList.add("hidden");
    confirmation?.classList.add("hidden");
    deleteIcon?.classList.add("hidden");
}