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
                        const span: HTMLSpanElement = aButton.appendChild(document.createElement("span"));
                        span.appendChild(document.createTextNode("Delete"));

                        // Add event listener to the delete button
                        aButton.addEventListener("click", deleteUserFunction);
                    }
                });
            }
        }
    );
}

async function deleteUserFunction(this: HTMLElement): Promise<void> {
    const row: HTMLTableRowElement | null = this.closest("tr");
    if (row) {
        // Get userID from the id from row in which clicked.
        const userId: string | null = row.getAttribute("id");
        // Delete user from database with userID
        const user: Promise<string | any[]> = api.queryDatabase(USER_QUERY.DELETE_USER, userId);
        console.log(user);
        user.then(
            (): void => {
                console.log("Successfully deleted user!");
                location.reload();
            },
            (): void => {
                console.log("Failed to delete user!");
            }
        );
    }
}

async function app(): Promise<void> {
    // Verify user before rest of page loads.
    await verifyUser();
    // Adds users to table
    await addUsersToTable();

    // Handle logout event
    const logout: Element | null = document.querySelector(".logout");
    logout?.addEventListener("click", loggedOut);

    async function loggedOut(this: HTMLElement): Promise<void> {
        // Remove JWTToken From session
        session.remove("JWTToken");
        location.reload();
    }

}

app();