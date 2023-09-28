import "./hboictcloud-config";
import {verifyUser} from "./authentication/verifyUser";
import {api, session} from "@hboictcloud/api";
import {QUERY} from "./query/user.query";

async function addUsersToTable(): Promise<void> {
    const tableBody: Element | null = document.querySelector(".table-body");
    const getUsers: Promise<any[] | string> = api.queryDatabase(QUERY.SELECT_USERS);
    getUsers.then(
        (users: string | any[]): void => {
            if (typeof users !== "string") {
                users.forEach((user: any): void => {
                    const tr: HTMLTableRowElement | undefined = tableBody?.appendChild(document.createElement("tr"));
                    if (tr) {
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
        const userId: string | null  = row.getAttribute("id");
        const user: Promise<string | any[]> = api.queryDatabase(QUERY.DELETE_USER, userId);
        console.log(user);
        user.then(
            ():void => {
                console.log("Successfully deleted user!");
                location.reload();
            },
            ():void => {
                console.log("Failed to delete user!");
            }
        );
    }
}

async function app(): Promise<void> {
    await verifyUser();
    await addUsersToTable();

    const logout: Element | null = document.querySelector(".logout");
    logout?.addEventListener("click", loggedOut);

    async function loggedOut(this: HTMLElement): Promise<void> {
        session.remove("JWPToken");
        location.reload();
    }

}

app();