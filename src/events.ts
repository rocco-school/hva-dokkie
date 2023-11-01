import "./hboictcloud-config";
import {verifyUser} from "./authentication/verifyUser";
import {api, session, utils} from "@hboictcloud/api";
import {EVENT_QUERY} from "./query/event.query";
import {v4 as uuidv4} from "uuid";
import {JWTPayload} from "jose";
import {verify} from "./authentication/jsonwebtoken";
import {PARTICIPANT_QUERY} from "./query/participant.query";
import {Status} from "./enum/status.enum";
import {delay} from "./components/delay";
import {showSuccessMessage} from "./components/successMessage";
import {closeDeleteMessage} from "./components/deleteMessage";
import {loggedOut} from "./components/handleLogout";
import {closeMenu, openMenu} from "./components/handleMobileNavigation";
import {addEventsToTable} from "./components/createTable";

/**
 * The main application entry point for the events page.
 *
 * This function initializes the events page, including event handling,
 * user verification, and other related functionality.
 *
 * @returns {Promise<void>} A Promise that resolves when the application setup is complete.
 */
async function eventsApp(): Promise<void> {
    // Verify the user's login status before the rest of the page loads.
    await verifyUser();

    // Add events to the table.
    const tableBody: Element | null = document.querySelector(".table-body");
    await addEventsToTable(tableBody);

    // Page Element Initialization
    const createButton: Element | any = document.querySelector(".create-button");
    const cancelButton: Element | any = document.querySelector(".cancel");

    const createEvent: HTMLFormElement | any = document.querySelector("#create-event");
    const editEvent: HTMLFormElement | any = document.querySelector("#edit-event");

    const description: HTMLInputElement | any = document.querySelector("#description");
    const messageButton: HTMLButtonElement | any = document.querySelector(".continue-button");
    const closeMessageButton: HTMLButtonElement | any = document.querySelector(".close-modal-button");
    const hideEditEvent: HTMLAnchorElement | any = document.querySelector(".cancel-edit-event");

    const openMobileMenu: Element | any = document.querySelector(".mobile-menu");
    const closeMobileMenu: Element | any = document.querySelector(".close-menu");
    const mobileNav: Element | any = document.querySelector(".overlay");

    // Handle opening the mobile navigation menu.
    openMobileMenu?.addEventListener("click", (): void => {
        openMenu(mobileNav);
    });

    // Handle closing the mobile navigation menu.
    closeMobileMenu?.addEventListener("click", (): void => {
        closeMenu(mobileNav);
    });

    // Handle logout event
    document.querySelectorAll(".logout").forEach(item => {
        item.addEventListener("click", loggedOut);
    });

    // Handle deleting event.
    messageButton?.addEventListener("click", deleteEventFunction);
    closeMessageButton?.addEventListener("click", closeDeleteMessage);

    // Handle showing the create event form
    createButton?.addEventListener("click", showCreateEvent);

    // Handle canceling creating event.
    cancelButton?.addEventListener("click", hideCreateEvent);

    // Handle hiding the create event form
    hideEditEvent?.addEventListener("click", hideEditEventForm);

    // Event listener for the create event form submission.
    if (createEvent) {
        createEvent.addEventListener("submit", async (e: SubmitEvent): Promise<void> => {
            e.preventDefault();

            /**
             * Validates the input field and sets a custom validation message if needed.
             * @param {HTMLInputElement | null} input - The input element to validate.
             * @param {string} errorMessage - The error message to display if validation fails.
             */
            const validateInput: (input: (HTMLInputElement | null), errorMessage: string) => void = (input: HTMLInputElement | null, errorMessage: string): void => {
                if (input && input.value === "") {
                    input.setCustomValidity(errorMessage);
                } else {
                    if (input) {
                        input.setCustomValidity("");
                    }
                }
            };

            // Validation logic for create event form fields.
            const inputs: (HTMLInputElement | null)[] = [description];
            inputs.forEach((input: HTMLInputElement | null): void => {
                validateInput(input, input?.name + " is required");
            });

            // Check if all inputs are validated
            const formIsValid: boolean = inputs.every((input: HTMLInputElement | null) => input?.checkValidity());

            if (formIsValid) {
                if (createEvent.checkValidity()) {
                    await createNewEvent(description?.value);
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

    // Event listener for the edit event form submission.
    if (editEvent) {
        editEvent.addEventListener("submit", async (e: SubmitEvent): Promise<void> => {
            let error: boolean;
            const editEventStatus: HTMLInputElement | any = editEvent.querySelectorAll("input[name='edit-status']:checked");
            const customErrorMessage: HTMLButtonElement | any = document.querySelector(".edit-event-message");
            const editEventDescription: HTMLButtonElement | any = document.querySelector("#edit-event-description");
            const editEventId: HTMLButtonElement | any = document.querySelector(".edit-event");
            e.preventDefault();


            /**
             * Validates the input field and sets a custom validation message if needed.
             * @param {HTMLInputElement | null} input - The input element to validate.
             * @param {string} errorMessage - The error message to display if validation fails.
             */
            async function validateInput(input: (HTMLInputElement | null), errorMessage: string): Promise<void> {
                if (input && input.value === "") {
                    if (customErrorMessage) {
                        customErrorMessage.classList.remove("hidden");
                        customErrorMessage.innerHTML = errorMessage;
                    }
                    error = true;
                }
            }


            const inputs: (HTMLInputElement | null)[] = [editEventStatus[0]];

            error = false;

            // Validation logic for create event form fields.
            for (const input of inputs) {
                await validateInput(input, input?.name + " is required");
            }

            if (!error) {
                customErrorMessage.classList.add("hidden");

                if (!editEventDescription.value) {
                    try {
                        const event: any[] | string = await api.queryDatabase(EVENT_QUERY.SELECT_EVENT, editEventId.id);
                        if (event) {
                            editEventDescription.value = event[0].description;
                        }
                    } catch (e) {
                        console.log(e);
                    }
                }

                const data: any[] = [editEventDescription.value, editEventStatus[0].value, editEventId.id];
                await updateEvent(data);
                await hideEditEventForm();
                await showSuccessMessage("Successfully edited event!", null);
                location.reload();
            }

        });
    }
}

// Invoke the events application entry point.
eventsApp();

// Function to hide the create event form
function hideCreateEvent(): void {
    const createEventForm: Element | null = document.querySelector(".create");
    createEventForm?.classList.add("hidden");
}

// Function to show the create event form
function showCreateEvent(): void {
    const createEventForm: Element | null = document.querySelector(".create");
    createEventForm?.classList.remove("hidden");
}

// Function to hide the edit event form
function hideEditEventForm(): void {
    const editEventForm: Element | null = document.querySelector(".edit-event");
    editEventForm?.classList.add("hidden");
}

/**
 * Handles the creation of a new event and related database entries.
 *
 * @param {string} description - The description of the new event.
 * @returns {Promise<void>} A Promise that resolves when the event is created successfully.
 */
async function createNewEvent(description: string | undefined): Promise<void> {
    // Generate an random uuidv4 ID
    const id: eventInterface["eventId"] = uuidv4();

    const errorMessage: Element | null = document.querySelector(".error-message");
    const createEventForm: Element | null = document.querySelector(".create");
    const confirmation: Element | null = document.querySelector(".filter");
    const successMessage: Element | null = document.querySelector(".success-background");
    const messageButton: Element | null = document.querySelector(".continue-button");
    const message: Element | null = document.querySelector(".message");
    const params: any[] = [id, description];
    try {
        // Create event inside database
        const event: string | any[] = await api.queryDatabase(EVENT_QUERY.CREATE_EVENT, ...params);

        if (event) {
            const token: string = session.get("JWTToken");
            const logged: JWTPayload = await verify(token, __SECRET_KEY__);
            // Create participant information with ID from session data
            const participantInfo: any[] = [id, logged.id];
            // Create participant inside the database
            const participant: string | any[] = await api.queryDatabase(PARTICIPANT_QUERY.CREATE_PARTICIPANT, ...participantInfo);

            if (participant) {
                createEventForm?.classList.add("hidden");
                successMessage?.classList.remove("hidden");
                confirmation?.classList.remove("hidden");
                messageButton?.classList.add("hidden");
                if (message) {
                    message.innerHTML = "Successfully created event!";
                }
                await delay(1000);
                location.reload();
            } else {
                errorMessage?.classList.remove("hidden");
                if (errorMessage) {
                    errorMessage.innerHTML = "Failed to create all participants, please try again later!";
                }
                console.log(Status.INTERNAL_SERVER_ERROR);
            }
        }
    } catch (Error) {
        console.log(Error);
    }
}

/**
 * Handles the deletion of an event.
 *
 * @returns {Promise<void>} A Promise that resolves when the event is successfully deleted.
 */
async function deleteEventFunction(this: HTMLElement): Promise<void> {
    const id: eventInterface["eventId"] = this.id;
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

/**
 * Handles the updating of an event.
 *
 * @param {any[]} data - The data required to update an event.
 * @returns {Promise<void>} A Promise that resolves when the event is successfully updated.
 */
async function updateEvent(data: any[]): Promise<void> {
    try {
        data[1] = data[1] === "" ? null : data[1];
        const updatedEvent: string | any[] = await api.queryDatabase(EVENT_QUERY.UPDATE_EVENT, ...data);

        if (updatedEvent) {
            console.log(Status.OK);
        } else {
            console.log("Failed to update expense!");
        }
    } catch (e) {
        console.log(e);
    }
}
