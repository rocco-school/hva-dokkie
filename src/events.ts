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

    messageButton?.addEventListener("click", handleMessage);
    closeMessageButton?.addEventListener("click", closeMessage);

    // Handle logout event
    logout?.addEventListener("click", loggedOut);
    // Handle showing the create event form
    createButton?.addEventListener("click", showCreateEvent);
    // Handle canceling creating event.
    cancelButton?.addEventListener("click", hideCreateEvent);

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
            // Retrieve event, total cost, total participants, total paid payments, total unpaid payments, and expenses data
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

            // Populate the event object with retrieved data
            if (getEvent) {
                event.description = getEvent[0].description;
                event.status = getEvent[0].eventStatus;
            }

            if (getTotalCost) {
                if (!getTotalCost[0].totalCost) {
                    getTotalCost[0].totalCost = 0;
                }
                event.totalCost = "€" + getTotalCost[0].totalCost;
            }

            if (getTotalParticipants) {
                if (!getTotalParticipants[0].totalParticipants) {
                    getTotalParticipants[0].totalParticipants = 0;
                }
                event.totalParticipants = getTotalParticipants[0].totalParticipants;
            }

            if (getTotalPaidPayments) {
                if (!getTotalPaidPayments[0].totalPaidPayments) {
                    getTotalPaidPayments[0].totalPaidPayments = 0;
                }
                event.totalPaidPayments = getTotalPaidPayments[0].totalPaidPayments;
            }

            if (getTotalUnpaidPayments) {
                if (!getTotalUnpaidPayments[0].totalUnpaidPayments) {
                    getTotalUnpaidPayments[0].totalUnpaidPayments = 0;
                }
                event.totalUnpaidPayments = getTotalUnpaidPayments[0].totalUnpaidPayments;
            }

            if (getExpenses) {
                // Loop through expenses and build expense objects
                for (const expense: any of getExpenses) {
                    let expensesStatus: string = "";
                    if (expense.expenseStatus === 0) {
                        expensesStatus = "Open";
                    } else {
                        expensesStatus = "Closed";
                    }

                    const expenseObject: object = {
                        description: expense.description,
                        totalAmount: expense.totalAmount,
                        status: expensesStatus,
                        payments: []
                    };

                    const arr: any[] = [eventID, expense.expenseId];

                    // Retrieve payments for the current expense
                    const getPayments: any | string = await api.queryDatabase(PAYMENT_QUERY.GET_PAYMENTS_BY_EXPENSE_ID, ...arr);

                    // Loop through payments and build payment objects
                    for (const payment: any of getPayments) {
                        let paymentsStatus: string = "";
                        if (payment.paymentStatus === 0) {
                            paymentsStatus = "Paid";
                        } else {
                            paymentsStatus = "Unpaid";
                        }

                        const paymentObject: object = {
                            description: payment.description,
                            customAmount: payment.customAmount,
                            paymentAmount: payment.paymentAmount,
                            participant: payment.username,
                            status: paymentsStatus,
                        };
                        // Add payment object to the current expense
                        expenseObject.payments.push(paymentObject);
                    }
                    // Add expense object to the event's expenses array
                    event.expenses.push(expenseObject);
                }
            }


        } catch (e) {
            console.log(e);
        }
    }

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
        - To-be Paid Amount: ${payment.paymentAmount}%0a
        - Participant: ${payment.participant}%0a
        - Status: ${payment.status}%0a
`).join("")}
`).join("")}`;


    // Open WhatsApp with the generated message
    window.open(`https://web.whatsapp.com/send?text=${message}`, "_blank");
}

async function editRecord(row: HTMLTableRowElement): Promise<void> {
    if (row.classList.contains("event")) {
        const editEventForm: Element | null = document.querySelector(".edit-event");
        if (editEventForm) {
            editEventForm.id = row.id;
        }
        editEventForm?.classList.remove("hidden");
    }
}

function hideEditEventForm(): void {
    const editEventForm: Element | null = document.querySelector(".edit-event");
    editEventForm?.classList.add("hidden");
}

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

async function showSuccessMessage(message: string, duration: number | null): Promise<void> {
    const filter: Element | null = document.querySelector(".filter");
    const messageButton: Element | null = document.querySelector(".continue-button");
    const CustomMessage: Element | null = document.querySelector(".message");
    const successIcon: Element | null = document.querySelector(".success-background");

    filter?.classList.remove("hidden");
    messageButton?.classList.add("hidden");
    successIcon?.classList.remove("hidden");

    if (CustomMessage) {
        CustomMessage.innerHTML = message ?? "Successful!";
    }

    if (!duration) {
        duration = 1000;
    }

    await delay(duration);

    successIcon?.classList.add("hidden");
    filter?.classList.add("hidden");
    messageButton?.classList.remove("hidden");
}

async function deleteEventFunction(id: eventInterface["eventId"]): Promise<void> {
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

async function handleMessage(this: HTMLElement): Promise<void> {
    if (this.id) {
        await deleteEventFunction(this.id);
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