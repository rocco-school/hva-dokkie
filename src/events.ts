import "./hboictcloud-config";
import {verifyUser} from "./authentication/verifyUser";
import {api, session, utils} from "@hboictcloud/api";
import {EVENT_QUERY} from "./query/event.query";
import {v4 as uuidv4} from "uuid";
import {JWTPayload} from "jose";
import {verify} from "./authentication/jsonwebtoken";
import {PARTICIPANT_QUERY} from "./query/participant.query";
import {Status} from "./enum/status.enum";

async function addEventsToTable(): Promise<void> {
    // Get token from session storage for userID
    const token: string = session.get("JWTToken");
    const logged: JWTPayload = await verify(token, __SECRET_KEY__);
    const userID: any = logged.id;
    const tableBody: Element | null = document.querySelector(".table-body");

    if (userID) {
        // Get all events from userID
        const getEvents: Promise<string | any[]> = api.queryDatabase(EVENT_QUERY.SELECT_EVENTS_BY_USER, userID);

        console.log(getEvents);

        getEvents.then(
            (events: string | any[]): void => {
                if (typeof events !== "string") {
                    events.forEach((event: any): void => {
                        //Create <tr> for the table row
                        const tr: HTMLTableRowElement | undefined = tableBody?.appendChild(document.createElement("tr"));
                        if (tr) {
                            // Create the other table data for the current row
                            tr.setAttribute("id", event.eventId);
                            tr.setAttribute("class", "event");
                            tr.appendChild(document.createElement("th")).appendChild(document.createTextNode(event.eventId));
                            tr.appendChild(document.createElement("td")).appendChild(document.createTextNode(event.description));
                            tr.appendChild(document.createElement("td")).appendChild(document.createTextNode(event.dateCreated));
                            tr.appendChild(document.createElement("td")).appendChild(document.createTextNode("Active"));
                            const button: HTMLTableCellElement = tr.appendChild(document.createElement("td"));
                            const aButton: HTMLElement = button.appendChild(document.createElement("a"));
                            aButton.classList.add("delete-button");
                            aButton.innerHTML = "<img src='assets/images/icons/delete-color.svg' alt='delete expense' class='icon-delete'>";
                            const span: HTMLSpanElement = aButton.appendChild(document.createElement("span"));
                            span.appendChild(document.createTextNode("Delete"));

                            // Add event listeners
                            tr.addEventListener("click", function (event: MouseEvent | null): void {
                                if (event) {
                                    let target: HTMLElement = event.target as HTMLElement;
                                    if ((target.parentElement && target.parentElement.classList.contains("delete-button")) || (target.firstElementChild && target.firstElementChild.classList.contains("delete-button"))) {
                                        showDeleteConfirmation(tr);
                                    } else {
                                        handleEventClick(tr);
                                    }
                                }

                            });

                        }
                    });
                }
            }
        );
    }
}


async function createEvent(description: string | undefined): Promise<void> {
    // Generate an random uuidv4 ID
    const id: string = uuidv4();

    const errorMessage: Element | null = document.querySelector(".error-message");
    const createEventForm: Element | null = document.querySelector(".create");
    const confirmation: Element | null = document.querySelector(".filter");
    const successMessage: Element | null = document.querySelector(".success-background");
    const messageButton: Element | null = document.querySelector(".continue-button");
    const message: Element | null = document.querySelector(".message");
    const params: any[] = [id, description];
    try {
        // Create event inside database
        const event: Promise<string | any[]> = api.queryDatabase(EVENT_QUERY.CREATE_EVENT, ...params);
        event.then(
            async (): Promise<void> => {
                // Get token from Session and check if verified.
                const token: string = session.get("JWTToken");
                const logged: JWTPayload = await verify(token, __SECRET_KEY__);
                // Create participant information with ID from session data
                const participantInfo: any[] = [id, logged.id];
                // Create participant inside the database
                const participant: Promise<string | any[]> = api.queryDatabase(PARTICIPANT_QUERY.CREATE_PARTICIPANT, ...participantInfo);
                participant.then(
                    async (): Promise<void> => {
                        createEventForm?.classList.add("hidden");
                        successMessage?.classList.remove("hidden");
                        confirmation?.classList.remove("hidden");
                        messageButton?.classList.add("hidden");
                        if (message) {
                            message.innerHTML = "Successfully created event!";
                        }
                        await delay(1000);
                        location.reload();
                    },
                    (): void => {
                        errorMessage?.classList.remove("hidden");
                        if (errorMessage) {
                            errorMessage.innerHTML = "Failed to create all participants, please try again later!";
                        }
                        console.log(Status.INTERNAL_SERVER_ERROR);
                    }
                );
            },
            (): void => {
                console.log("Failed to create event!");
            }
        );
    } catch (Error) {
        console.log(Error);
    }
}

async function showDeleteConfirmation(row: HTMLTableRowElement): Promise<void> {
    const confirmation: Element | null = document.querySelector(".filter");
    const deleteIcon: Element | null = document.querySelector(".delete-background");
    const message: Element | null = document.querySelector(".message");
    const confirmationButton: Element | null = document.querySelector(".continue-button");
    const cancelButton: Element | null = document.querySelector(".close-modal-button");

    if (row) {
        const eventId: any = row.getAttribute("id");
        confirmationButton?.setAttribute("id", eventId);

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


async function deleteEventFunction(id: string | any): Promise<void> {
    // Get closest <tr> to get user ID
    if (id) {
        // Delete event in database
        const event: Promise<string | any[]> = api.queryDatabase(EVENT_QUERY.DELETE_EVENT, id);
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

async function handleEventClick(row: HTMLTableRowElement): Promise<void> {
    const id: string | null = row.getAttribute("id");

    if (id) {
        const url: string = utils.createUrl("single-event.html", {
            eventId: id,
        });
        if (url) {
            window.location.href = url;
        }
    }
}

async function handleMessage(this: HTMLElement): Promise<void> {
    if (this.id) {
        await deleteEventFunction(this.id);
    }
}

function delay(ms: number): Promise<void> {
    // Sets time out with give ms
    return new Promise(resolve => setTimeout(resolve, ms));
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
    // Adds Events to table
    await addEventsToTable();

    const logout: Element | any = document.querySelector(".logout");
    const createButton: Element | any = document.querySelector(".create-button");
    const cancelButton: Element | any = document.querySelector(".cancel");
    const form: HTMLFormElement | any = document.querySelector("#form");
    const description: HTMLInputElement | any = document.querySelector("#description");
    const messageButton: HTMLButtonElement | any = document.querySelector(".continue-button");
    const closeMessageButton: HTMLButtonElement | any = document.querySelector(".close-modal-button");

    messageButton?.addEventListener("click", handleMessage);
    closeMessageButton?.addEventListener("click", closeMessage);

    // Handle logout event
    logout?.addEventListener("click", loggedOut);
    // Handle showing the create event form
    createButton?.addEventListener("click", showCreateEvent);
    // Handle canceling creating event.
    cancelButton?.addEventListener("click", hideCreateEvent);

    function hideCreateEvent(): void {
        const createEventForm: Element | null = document.querySelector(".create");
        createEventForm?.classList.add("hidden");
    }

    function showCreateEvent(): void {
        const createEventForm: Element | null = document.querySelector(".create");
        createEventForm?.classList.remove("hidden");
    }

    function loggedOut(): void {
        // Remove JWTToken From session
        session.remove("JWTToken");
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

            const inputs: (HTMLInputElement | null)[] = [description];

            inputs.forEach((input: HTMLInputElement | null): void => {
                validateInput(input, input?.name + " is required");
            });

            // Check if all inputs are validated
            const formIsValid: boolean = inputs.every((input: HTMLInputElement | null) => input?.checkValidity());

            if (formIsValid) {
                if (form.checkValidity()) {
                    await createEvent(description?.value);
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