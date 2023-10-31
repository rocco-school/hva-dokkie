import "./hboictcloud-config";
import {verifyUser} from "./authentication/verifyUser";
import {api, session} from "@hboictcloud/api";
import {USER_QUERY} from "./query/user.query";
import {closeDeleteMessage} from "./components/deleteMessage";
import {loggedOut} from "./components/handleLogout";
import {addUsersToTable} from "./components/createTable";
import {calculatePayments} from "./single-event";

async function app(): Promise<void> {
    // Verify user before rest of page loads.
    await verifyUser();
    // Adds users to table
    const tableBody: Element | null = document.querySelector(".table-body");

    await addUsersToTable(tableBody);

    // Handle logout event
    const logout: Element | any = document.querySelector(".logout");
    const confirmationButton: Element | any = document.querySelector(".continue-button");
    const closeMessageButton: HTMLButtonElement | any = document.querySelector(".close-modal-button");

    closeMessageButton.addEventListener("click", closeDeleteMessage);
    confirmationButton?.addEventListener("click", deleteUserFunction);
    logout?.addEventListener("click", loggedOut);
}

app();

// Function to handle deleting a user
async function deleteUserFunction(this: HTMLElement | any): Promise<void> {
    const userid: userInterface["userId"] = this.id;
    if (userid) {
        // Delete user from database with userID
        const user: Promise<string | any[]> = api.queryDatabase(USER_QUERY.DELETE_USER, userid);
        user.then(
            (): void => {
                location.reload();
            },
            (): void => {
                console.log("Failed to delete user!");
            }
        );
    }
}