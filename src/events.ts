import "./hboictcloud-config";
import {verifyUser} from "./authentication/verifyUser";
import {api, session} from "@hboictcloud/api";
import {EVENT_QUERY} from "./query/event.query";
import {v4 as uuidv4} from "uuid";
import {JWTPayload} from "jose";
import {verify} from "./authentication/jsonwebtoken";
import {PARTICIPANT_QUERY} from "./query/participant.query";

async function addUsersToTable(): Promise<void> {
    const token: string = session.get("JWPToken");
    const logged: JWTPayload = await verify(token, __SECRET_KEY__);
    const userID: unknown = logged.id;
    const tableBody: Element | null = document.querySelector(".table-body");
    if (userID) {
        const getEvents: Promise<string | any[]> = api.queryDatabase(EVENT_QUERY.SELECT_EVENTS_BY_USER, userID);
        console.log(getEvents);
        getEvents.then(
            (events: string | any[]): void => {
                if (typeof events !== "string") {
                    events.forEach((event: any): void => {
                        const tr: HTMLTableRowElement | undefined = tableBody?.appendChild(document.createElement("tr"));
                        if (tr) {
                            tr.setAttribute("id", event.eventId);
                            tr.appendChild(document.createElement("th")).appendChild(document.createTextNode(event.eventId));
                            tr.appendChild(document.createElement("td")).appendChild(document.createTextNode(event.description));
                            tr.appendChild(document.createElement("td")).appendChild(document.createTextNode(event.dateCreated));
                            tr.appendChild(document.createElement("td")).appendChild(document.createTextNode("Active"));
                            const button: HTMLTableCellElement = tr.appendChild(document.createElement("td"));
                            const aButton: HTMLElement = button.appendChild(document.createElement("a"));
                            aButton.classList.add("delete-button");
                            const span: HTMLSpanElement = aButton.appendChild(document.createElement("span"));
                            span.appendChild(document.createTextNode("Delete"));

                            // Add event listener to the delete button
                            aButton.addEventListener("click", deleteEventFunction);
                        }
                    });
                }
            }
        );
    }
}


async function createEvent(name: string | undefined, description: string | undefined): Promise<void> {
    const id: string = uuidv4();
    const errorMessage: Element | null = document.querySelector(".error-message");
    const createEventForm: Element | null = document.querySelector(".create-event-form");
    const params: any[] = [id, description];
    try {
        const event: Promise<string | any[]> = api.queryDatabase(EVENT_QUERY.CREATE_EVENT, ...params);
        event.then(
            async (): Promise<void> => {
                const token: string = session.get("JWPToken");
                const logged: JWTPayload = await verify(token, __SECRET_KEY__);
                const participantInfo: any[] = [id, name, logged.id];
                console.log(participantInfo);
                const participant: Promise<string | any[]> = api.queryDatabase(PARTICIPANT_QUERY.CREATE_PARTICIPANT, ...participantInfo);

                participant.then(
                    (): void => {
                        createEventForm?.classList.add("hidden");
                        location.reload();
                    },
                    (): void => {
                        errorMessage?.classList.remove("hidden");
                    }
                );
            }
        );
    } catch (Error) {
        console.log(Error);
    }
}

async function deleteEventFunction(this: HTMLElement): Promise<void> {
    const row: HTMLTableRowElement | null = this.closest("tr");
    if (row) {
        const eventId: string | null = row.getAttribute("id");
        const event: Promise<string | any[]> = api.queryDatabase(EVENT_QUERY.DELETE_EVENT, eventId);
        console.log(event);
        event.then(
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
    await verifyUser();
    await addUsersToTable();

    const logout: Element | null = document.querySelector(".logout");
    const createButton: Element | null = document.querySelector(".create-event-button");
    const form: HTMLFormElement | null = document.querySelector("#form");
    const name: HTMLInputElement | null = document.querySelector("#name");
    const description: HTMLInputElement | null = document.querySelector("#description");

    logout?.addEventListener("click", loggedOut);
    createButton?.addEventListener("click", showCreatEvent);

    async function showCreatEvent(this: HTMLElement): Promise<void> {
        const createEventForm: Element | null = document.querySelector(".create-event-form");
        createEventForm?.classList.remove("hidden");
    }

    async function loggedOut(this: HTMLElement): Promise<void> {
        session.remove("JWPToken");
        location.reload();
    }

    if (form) {
        form.addEventListener("submit", async (e: SubmitEvent): Promise<void> => {
            e.preventDefault();

            const validateInput: (input: (HTMLInputElement | null), errorMessage: string) => void = (input: HTMLInputElement | null, errorMessage: string): void => {
                if (input && input.value === "") {
                    input.setCustomValidity(errorMessage);
                } else {
                    if (input) {
                        input.setCustomValidity("");
                    }
                }
            };

            const inputs: (HTMLInputElement | null)[] = [name, description];

            inputs.forEach((input: HTMLInputElement | null): void => {
                validateInput(input, input?.name + " is required");
            });

            const formIsValid: boolean = inputs.every((input: HTMLInputElement | null) => input?.checkValidity());

            if (formIsValid) {
                if (form.checkValidity()) {
                    await createEvent(name?.value, description?.value);
                }
            } else {
                inputs.forEach((input: HTMLInputElement | null): void => {
                    if (input) {
                        input.addEventListener("input", (): void => {
                            input.setCustomValidity("");
                        });
                    }
                });
            }

        });
    }


}

app();