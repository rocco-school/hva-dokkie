import "./hboictcloud-config";
import {verifyUser} from "./authentication/verifyUser";
import {api} from "@hboictcloud/api";
import {QUERY} from "./query/user.query";

/**
 * Entry point
 */
async function app(): Promise<void> {

    await verifyUser();

    function addUsersToTable(): void {
        const tableBody: Element | null = document.querySelector(".table-body");
        const getUsers: Promise<any[] | string> = api.queryDatabase(QUERY.SELECT_USERS);
        getUsers.then(
            (users: string | any[]): void => {
                users.forEach((user: any): void => {
                    const tr: HTMLTableRowElement | undefined = tableBody?.appendChild(document.createElement("tr"));
                    if (tr) {
                        tr.setAttribute("id", user.userId);
                        tr.appendChild(document.createElement("th")).appendChild(document.createTextNode(user.userId));
                        tr.appendChild(document.createElement("td")).appendChild(document.createTextNode(user.username));
                        tr.appendChild(document.createElement("td")).appendChild(document.createTextNode(user.email));
                        tr.appendChild(document.createElement("td")).appendChild(document.createTextNode("Delete"));
                    }
                    console.log(user);
                });
            }
        );
    }

    addUsersToTable();

}

app();
