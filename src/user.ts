import "./hboictcloud-config";
import {verifyUser} from "./authentication/verifyUser";
import {api, session} from "@hboictcloud/api";
import {USER_QUERY} from "./query/user.query";
import {closeDeleteMessage} from "./components/deleteMessage";
import {loggedOut} from "./components/handleLogout";
import {addUsersToTable} from "./components/createTable";
import {calculatePayments} from "./single-event";
import {closeMenu, openMenu} from "./components/handleMobileNavigation";

/**
 * The main application entry point for the user page.
 *
 * This function initializes the user page, including event handling,
 * user verification, and other related functionality.
 *
 * @returns {Promise<void>} A Promise that resolves when the application setup is complete.
 */
async function userApp(): Promise<void> {
    // Verify user before rest of page loads.
    await verifyUser();
    // Adds users to table
    const tableBody: Element | null = document.querySelector(".table-body");
    await addUsersToTable(tableBody);

    // Page Element Initialization
    const logout: Element | any = document.querySelector(".logout");
    const confirmationButton: Element | any = document.querySelector(".continue-button");
    const closeMessageButton: HTMLButtonElement | any = document.querySelector(".close-modal-button");
    const openMobileMenu: Element | any = document.querySelector(".mobile-menu");
    const closeMobileMenu: Element | any = document.querySelector(".close-menu");
    const mobileNav: Element | any = document.querySelector(".overlay");

    // Handle open mobile nav menu
    openMobileMenu?.addEventListener("click", (): void => {
        openMenu(mobileNav);
    });

    // Handle closing mobile nav menu
    closeMobileMenu?.addEventListener("click", (): void => {
        closeMenu(mobileNav);
    });

    document.querySelectorAll(".logout").forEach(item => {
        item.addEventListener("click", loggedOut);
    });

    // Handle deleting event.
    closeMessageButton.addEventListener("click", closeDeleteMessage);
    confirmationButton?.addEventListener("click", deleteUserFunction);

    logout?.addEventListener("click", loggedOut);
}

// Invoke the user application entry point.
userApp();

/**
 * Function to handle the deletion of a user.
 *
 * This function is triggered when a user is deleted and communicates with the database
 * to remove the user's data based on their user ID.
 * @returns {Promise<void>} A Promise that resolves when the user is successfully deleted.
 */
async function deleteUserFunction(this: HTMLElement | any): Promise<void> {
    // Get the user ID from the HTML element's ID attribute.
    const userId: userInterface["userId"] = this.id;

    // Check if a valid user ID is available.
    if (userId) {
        // Delete the user from the database using their user ID.
        const user: Promise<string | any[]> = api.queryDatabase(USER_QUERY.DELETE_USER, userId);

        user.then(
            // If the user is successfully deleted, reload the page to reflect the changes.
            (): void => {
                location.reload();
            },
            // If there's an error while deleting the user, log an error message.
            (): void => {
                console.log("Failed to delete user!");
            }
        );
    }
}