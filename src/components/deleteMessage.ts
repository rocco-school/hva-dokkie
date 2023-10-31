// Function to handle closing the delete confirmation window.
export async function closeDeleteMessage(): Promise<void> {
    const confirmation: Element | null = document.querySelector(".filter");
    const deleteIcon: Element | null = document.querySelector(".delete-background");
    const cancelButton: Element | null = document.querySelector(".close-modal-button");

    cancelButton?.classList.add("hidden");
    confirmation?.classList.add("hidden");
    deleteIcon?.classList.add("hidden");
}