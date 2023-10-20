import "./hboictcloud-config";
import {verifyUser} from "./authentication/verifyUser";
import {api, session} from "@hboictcloud/api";
import {USER_QUERY} from "./query/user.query";

async function addUsersToTable(): Promise<void> {
    const tableBody: Element | null = document.querySelector(".table-body");
    // Get all users form the database.
    const getUsers: Promise<any[] | string> = api.queryDatabase(USER_QUERY.SELECT_USERS);
    getUsers.then(
        (users: string | any[]): void => {
            if (typeof users !== "string") {
                users.forEach((user: any): void => {
                    //Create <tr> for the table row
                    const tr: HTMLTableRowElement | undefined = tableBody?.appendChild(document.createElement("tr"));
                    if (tr) {
                        // Create the other table data for the current row
                        tr.setAttribute("id", user.userId);
                        tr.appendChild(document.createElement("th")).appendChild(document.createTextNode(user.userId));
                        tr.appendChild(document.createElement("td")).appendChild(document.createTextNode(user.username));
                        tr.appendChild(document.createElement("td")).appendChild(document.createTextNode(user.email));
                        const button: HTMLTableCellElement = tr.appendChild(document.createElement("td"));
                        const aButton: HTMLElement = button.appendChild(document.createElement("a"));
                        aButton.classList.add("delete-button");
                        aButton.innerHTML = "<img src='assets/images/icons/delete-color.svg' alt='delete expense' class='icon-delete'>";
                        const span: HTMLSpanElement = aButton.appendChild(document.createElement("span"));
                        span.appendChild(document.createTextNode("Delete"));

                        // Add event listener to the delete button
                        button.addEventListener("click", (): void => {
                            showDelete(tr);
                        });
                    }
                });
            }
        }
    );
}

async function deleteUserFunction(this: HTMLElement | any): Promise<void> {
    if (this.id) {
        // Delete user from database with userID
        const user: Promise<string | any[]> = api.queryDatabase(USER_QUERY.DELETE_USER, this.id);
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


async function showDelete(row: HTMLTableRowElement): Promise<void> {
    const confirmation: Element | null = document.querySelector(".filter");
    const deleteIcon: Element | null = document.querySelector(".delete-background");
    const message: Element | null = document.querySelector(".message");
    const confirmationButton: Element | null = document.querySelector(".continue-button");
    const cancelButton: Element | null = document.querySelector(".close-modal-button");

    if (row) {
        const userId: any = row.getAttribute("id");
        confirmationButton?.setAttribute("id", userId);

        cancelButton?.classList.remove("hidden");
        confirmation?.classList.remove("hidden");
        deleteIcon?.classList.remove("hidden");
        if (confirmationButton) {
            confirmationButton.innerHTML = "Delete";
            confirmationButton.classList.add("delete");
        }
        if (message) {
            message.innerHTML = "Are you sure you want to delete this event?";
        }
    }
}

async function closeMessage(): Promise<void> {
    const confirmation: Element | null = document.querySelector(".filter");
    const deleteIcon: Element | null = document.querySelector(".delete-background");
    const cancelButton: Element | null = document.querySelector(".close-modal-button");

    cancelButton?.classList.add("hidden");
    confirmation?.classList.add("hidden");
    deleteIcon?.classList.add("hidden");
}


async function app(): Promise<void> {
    // Verify user before rest of page loads.
    await verifyUser();
    // Adds users to table
    await addUsersToTable();

    // Handle logout event
    const logout: Element | any = document.querySelector(".logout");
    const confirmationButton: Element | any = document.querySelector(".continue-button");
    const closeMessageButton: HTMLButtonElement | any = document.querySelector(".close-modal-button");

    closeMessageButton.addEventListener("click", closeMessage);
    confirmationButton?.addEventListener("click", deleteUserFunction);
    logout?.addEventListener("click", loggedOut);

    async function loggedOut(this: HTMLElement): Promise<void> {
        // Remove JWTToken From session
        session.remove("JWTToken");
        location.reload();
    }

}

app();