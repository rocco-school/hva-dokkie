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
import {EXPENSE_QUERY} from "./query/expanse.query";
import {PAYMENT_QUERY} from "./query/payment.query";
import {showSuccessMessage} from "./components/successMessage";
import {closeDeleteMessage} from "./components/deleteMessage";
import {loggedOut} from "./components/handleLogout";

async function app(): Promise<void> {
    // Verify user before rest of page loads.
    await verifyUser();
    // Adds Events to table
    await addEventsToTable();

    const logout: Element | any = document.querySelector(".logout");
    const createButton: Element | any = document.querySelector(".create-button");
    const cancelButton: Element | any = document.querySelector(".cancel");

    const createEvent: HTMLFormElement | any = document.querySelector("#create-event");
    const editEvent: HTMLFormElement | any = document.querySelector("#edit-event");

    const description: HTMLInputElement | any = document.querySelector("#description");
    const messageButton: HTMLButtonElement | any = document.querySelector(".continue-button");
    const closeMessageButton: HTMLButtonElement | any = document.querySelector(".close-modal-button");
    const hideEditEvent: HTMLAnchorElement | any = document.querySelector(".cancel-edit-event");

    // Handle deleting event.
    messageButton?.addEventListener("click", deleteEventFunction);

    // Handle closing delete confirmation window
    closeMessageButton?.addEventListener("click", closeDeleteMessage);

    // Handle logout event
    logout?.addEventListener("click", loggedOut);

    // Handle showing the create event form
    createButton?.addEventListener("click", showCreateEvent);

    // Handle canceling creating event.
    cancelButton?.addEventListener("click", hideCreateEvent);

    // Handle hiding the create event from
    hideEditEvent?.addEventListener("click", hideEditEventForm);

    if (createEvent) {
        createEvent.addEventListener("submit", async (e: SubmitEvent): Promise<void> => {
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

    if (editEvent) {
        editEvent.addEventListener("submit", async (e: SubmitEvent): Promise<void> => {
            let error: boolean;
            const editEventStatus: HTMLInputElement | any = editEvent.querySelectorAll("input[name='edit-status']:checked");
            const customErrorMessage: HTMLButtonElement | any = document.querySelector(".edit-event-message");
            const editEventDescription: HTMLButtonElement | any = document.querySelector("#edit-event-description");
            const editEventId: HTMLButtonElement | any = document.querySelector(".edit-event");
            e.preventDefault();


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

app();

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

// Function to add data to event table
async function addEventsToTable(): Promise<void> {
    // Get token from session storage for userID
    const token: string = session.get("JWTToken");
    const logged: JWTPayload = await verify(token, __SECRET_KEY__);
    const userID: eventInterface["userId"] = logged.id;
    const tableBody: Element | null = document.querySelector(".table-body");

    if (userID) {
        // Get all events from userID
        const getEvents: Promise<string | any[]> = api.queryDatabase(EVENT_QUERY.SELECT_EVENTS_BY_USER, userID);

        getEvents.then(
            (events: string | any[]): void => {
                if (typeof events !== "string") {
                    events.forEach((event: any): void => {
                        //Create <tr> for the table row
                        const tr: HTMLTableRowElement | undefined = tableBody?.appendChild(document.createElement("tr"));
                        const status: string = event.eventStatus === 0 ? "Open" : "Closed";
                        if (tr) {
                            // Create the other table data for the current row
                            tr.setAttribute("id", event.eventId);
                            tr.setAttribute("class", "event");
                            tr.appendChild(document.createElement("th")).appendChild(document.createTextNode(event.eventId));
                            tr.appendChild(document.createElement("td")).appendChild(document.createTextNode(event.description));
                            tr.appendChild(document.createElement("td")).appendChild(document.createTextNode(event.dateCreated));
                            tr.appendChild(document.createElement("td")).appendChild(document.createTextNode(status));
                            const whatsapp: HTMLTableCellElement = tr.appendChild(document.createElement("td"));
                            whatsapp.classList.add("whatsapp-row");
                            const whatsappButton: HTMLElement = whatsapp.appendChild(document.createElement("button"));
                            whatsappButton.classList.add("whatsapp-button");
                            whatsappButton.classList.add("event");
                            whatsappButton.id = event.eventId;
                            whatsappButton.innerHTML = "<img src='assets/images/icons/whatsapp.svg' alt='whatsapp event' class='icon-whatsapp'>";
                            const whatsappSpan: HTMLSpanElement = whatsappButton.appendChild(document.createElement("span"));
                            whatsappSpan.appendChild(document.createTextNode("whatsapp"));

                            const button: HTMLTableCellElement = tr.appendChild(document.createElement("td"));
                            const editButton: HTMLElement = button.appendChild(document.createElement("button"));
                            editButton.classList.add("edit-button");
                            editButton.classList.add("event");
                            editButton.id = event.eventId;
                            editButton.innerHTML = "<img src='assets/images/icons/edit.svg' alt='edit event' class='icon-edit'>";
                            const editSpan: HTMLSpanElement = editButton.appendChild(document.createElement("span"));
                            editSpan.appendChild(document.createTextNode("Edit"));

                            const deleteButton: HTMLElement = button.appendChild(document.createElement("button"));
                            deleteButton.classList.add("event");
                            deleteButton.classList.add("delete-button");
                            deleteButton.id = event.eventId;
                            deleteButton.innerHTML = "<img src='assets/images/icons/delete-color.svg' alt='delete event' class='icon-delete'>";
                            const deleteSpan: HTMLSpanElement = deleteButton.appendChild(document.createElement("span"));
                            deleteSpan.appendChild(document.createTextNode("Delete"));

                            if (event) {
                                if (event.eventStatus === 1) {
                                    editButton.setAttribute("disabled", "disabled");
                                    deleteButton.setAttribute("disabled", "disabled");
                                }
                            }

                            // Add event listeners
                            tr.addEventListener("click", async function (expense: MouseEvent | null): Promise<void> {
                                if (expense) {
                                    let target: HTMLElement = expense.target as HTMLElement;
                                    if ((target.parentElement && target.parentElement.classList.contains("delete-button")) || (target.firstElementChild && target.firstElementChild.classList.contains("delete-button")) || target.classList.contains("delete-button")) {
                                        await showDeleteConfirmation(tr);
                                    } else if ((target.parentElement && target.parentElement.classList.contains("edit-button")) || (target.firstElementChild && target.firstElementChild.classList.contains("edit-button")) || target.classList.contains("edit-button")) {
                                        await editRecord(tr);
                                    } else if ((target.parentElement && target.parentElement.classList.contains("whatsapp-button")) || (target.firstElementChild && target.firstElementChild.classList.contains("whatsapp-button")) || target.classList.contains("whatsapp-button")) {
                                        await shareEvent(tr);
                                    } else {
                                        await handleEventClick(tr);
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

// Function to share an event
async function shareEvent(row: HTMLTableRowElement): Promise<void> {
    // Get the event ID from the row's ID attribute
    const eventID: eventInterface["eventId"] = row.id;

    // Create an empty event object
    const event: any = {
        description: "",
        totalCost: "",
        totalParticipants: 0,
        totalPaidPayments: "",
        totalUnpaidPayments: "",
        status: "",
        expenses: []
    };

    if (eventID) {
        try {
            const [
                getEvent,
                getTotalCost,
                getTotalParticipants,
                getTotalPaidPayments,
                getTotalUnpaidPayments,
                getExpenses,
            ] = await Promise.all([
                api.queryDatabase(EVENT_QUERY.SELECT_EVENT, eventID),
                api.queryDatabase(EXPENSE_QUERY.GET_TOTAL_COST_BY_EVENT_ID, eventID),
                api.queryDatabase(PARTICIPANT_QUERY.GET_AMOUNT_OF_PARTICIPANTS_BY_EVENT_ID, eventID),
                api.queryDatabase(PAYMENT_QUERY.GET_TOTAL_PAID_PAYMENTS, eventID),
                api.queryDatabase(PAYMENT_QUERY.GET_TOTAL_UNPAID_PAYMENTS, eventID),
                api.queryDatabase(EXPENSE_QUERY.SELECT_EXPENSES_BY_EVENT, eventID),
            ]);

            if (getEvent) {
                // Helper function to get event status
                const getStatusEvent: (status: number) => string = (status: number): string => (status === 0 ? "Open" : "Closed");

                event.description = getEvent[0].description;
                event.status = getStatusEvent(getEvent[0].eventStatus);
            }

            event.totalCost = `€${getTotalCost ? getTotalCost[0].totalCost || 0 : 0}`;
            event.totalParticipants = getTotalParticipants ? getTotalParticipants[0].totalParticipants || 0 : 0;
            event.totalPaidPayments = getTotalPaidPayments ? getTotalPaidPayments[0].totalPaidPayments || 0 : 0;
            event.totalUnpaidPayments = getTotalUnpaidPayments ? getTotalUnpaidPayments[0].totalUnpaidPayments || 0 : 0;

            if (getExpenses) {
                // Helper function to get expense status
                const getStatusExpense: (status) => string = (status: number): string => (status === 0 ? "Open" : "Closed");

                // Handle expenses with promises inside
                if (typeof getExpenses !== "string") {
                    event.expenses = await Promise.all(getExpenses.map(async (expense) => {
                        const expenseStatus: string = getStatusExpense(expense.expenseStatus);
                        const arr: any[] = [eventID, expense.expenseId];

                        const getPayments: any | string = await api.queryDatabase(PAYMENT_QUERY.GET_PAYMENTS_BY_EXPENSE_ID, ...arr);

                        // Helper function to get payment status
                        const getStatusPayment: (status) => string = (status): string => (status === 0 ? "Unpaid" : "Paid");

                        const getPaymentAmount: (paymentAmount) => string = (paymentAmount): string => (paymentAmount < 0 ? "To receive: €" + (paymentAmount * -1) : "To pay: €" + paymentAmount);

                        if (typeof getPayments !== "string") {
                            const payments: object = getPayments.map((payment) => ({
                                description: payment.description,
                                customAmount: payment.customAmount,
                                paymentAmount: getPaymentAmount(payment.paymentAmount),
                                participant: payment.username,
                                status: getStatusPayment(payment.paymentStatus),
                            }));

                            return {
                                description: expense.description,
                                totalAmount: expense.totalAmount,
                                status: expenseStatus,
                                payments,
                            };
                        }
                    }));
                }
            }
        } catch (e) {
            console.log(e);
        }
    }

    console.log(event);


// Generate a formatted message for sharing the event
    const message: string = `Event Details:%0a
    - Description: ${event.description}%0a
    - Total Cost: ${event.totalCost}%0a
    - Total Participants: ${event.totalParticipants}%0a
    - Total Paid Payments: ${event.totalPaidPayments}%0a
    - Total Unpaid Payments: ${event.totalUnpaidPayments}%0a
    - Status: ${event.status}%0a

Expenses:%0a
${event.expenses.map((expense, index: number): string => `
    ${index + 1}. ${expense.description}%0a
    - Total Amount: ${expense.totalAmount}%0a
    - Status: ${expense.status}%0a
    Payments:%0a
${expense.payments.map((payment, paymentIndex: number): string => `
        ${paymentIndex + 1}. ${payment.description}%0a
        - Paid Amount: ${payment.customAmount || "N/A"}%0a
        - Amount: ${payment.paymentAmount}%0a
        - Participant: ${payment.participant}%0a
        - Status: ${payment.status}%0a
`).join("")}
`).join("")}`;


    // Open WhatsApp with the generated message
    window.open(`https://web.whatsapp.com/send?text=${message}`, "_blank");
}

// Function to show the edit event form
async function editRecord(row: HTMLTableRowElement): Promise<void> {
    if (row.classList.contains("event")) {
        const editEventForm: Element | null = document.querySelector(".edit-event");
        if (editEventForm) {
            editEventForm.id = row.id;
        }
        editEventForm?.classList.remove("hidden");
    }
}

// Function to hide the edit event form
function hideEditEventForm(): void {
    const editEventForm: Element | null = document.querySelector(".edit-event");
    editEventForm?.classList.add("hidden");
}

// Function to handle creating a new event
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

// Function to handle showing delete confirmation window
async function showDeleteConfirmation(row: HTMLTableRowElement): Promise<void> {
    const confirmation: Element | null = document.querySelector(".filter");
    const deleteIcon: Element | null = document.querySelector(".delete-background");
    const message: Element | null = document.querySelector(".message");
    const confirmationButton: Element | null = document.querySelector(".continue-button");
    const cancelButton: Element | null = document.querySelector(".close-modal-button");

    if (row) {
        const eventId: eventInterface["eventId"] = row.getAttribute("id");
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

// Function to handle deleting an event
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

// Function to handle showing event-detail page
async function handleEventClick(row: HTMLTableRowElement): Promise<void> {
    const id: eventInterface["eventId"] = row.getAttribute("id");

    if (id) {
        const url: string = utils.createUrl("single-event.html", {
            eventId: id,
        });
        if (url) {
            window.location.href = url;
        }
    }
}

// Function to handle updating an event.
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