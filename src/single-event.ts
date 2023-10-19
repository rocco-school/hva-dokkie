import "./hboictcloud-config";
import {api, session} from "@hboictcloud/api";
import {JWTPayload} from "jose";
import {verify} from "./authentication/jsonwebtoken";
import {EVENT_QUERY} from "./query/event.query";
import {PARTICIPANT_QUERY} from "./query/participant.query";
import {EXPENSE_QUERY} from "./query/expanse.query";
import {PAYMENT_QUERY} from "./query/payment.query";
import {v4 as uuidv4} from "uuid";

/**
 * Entry point
 */
let eventId: string = "";

async function app(): Promise<void> {
    await checkURLParams();
    await verifyUser();

    addExpensesTable();
    handlePopulateSelects();

    const form: HTMLFormElement | null = document.querySelector("#form");
    const createButton: Element | any = document.querySelector(".create-button");
    const cancelButton: Element | any = document.querySelector(".cancel");
    const description: HTMLInputElement | any = document.querySelector("#description");
    const amount: HTMLInputElement | any = document.querySelector("#amount");
    const participants: HTMLInputElement | any = document.querySelector("#expense-participants");
    const createPayment: Element | any = document.querySelector(".create-payment");
    const messageButton: HTMLButtonElement | any = document.querySelector(".continue-button");
    const closeMessageButton: HTMLButtonElement | any = document.querySelector(".close-modal-button");
    const returnButton: HTMLButtonElement | any = document.querySelector(".return");
    const customErrorMessage: HTMLButtonElement | any = document.querySelector(".error-message");

    document.querySelectorAll(".hero-tab").forEach(item => {
        item.addEventListener("click", handleHeroTab);
    });
    document.querySelectorAll(".logout").forEach(item => {
        item.addEventListener("click", loggedOut);
    });

    createButton?.addEventListener("click", showCreateExpense);
    cancelButton?.addEventListener("click", hideCreateExpense);
    createPayment?.addEventListener("click", handleCreatePayment);
    messageButton?.addEventListener("click", handleMessage);
    closeMessageButton?.addEventListener("click", closeMessage);
    returnButton?.addEventListener("click", handleReturnClick);

    if (form) {
        form.addEventListener("submit", async (e: SubmitEvent): Promise<void> => {
            let error: boolean = false;
            e.preventDefault();

            const validateInput: (input: (HTMLInputElement | null), errorMessage: string) => void = (input: HTMLInputElement | null, errorMessage: string): void => {
                if (input && input.value === "") {
                    if (customErrorMessage) {
                        customErrorMessage.classList.remove("hidden");
                        customErrorMessage.innerHTML = errorMessage;
                    }
                    error = true;
                }
            };

            const inputs: (HTMLInputElement | null)[] = [description, amount, participants];

            error = false;

            inputs.forEach((input: HTMLInputElement | null): void => {
                validateInput(input, input?.name + " is required");
            });

            // Check if all inputs are validated
            const formIsValid: boolean = inputs.every((input: HTMLInputElement | null) => input?.checkValidity());

            if (formIsValid) {
                if (!error) {
                    const values: string[] = Array.from(participants.selectedOptions).map(({value}: any) => value);
                    await createExpense(description?.value, parseFloat(<string>amount?.value), values);
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


function hideCreateExpense(): void {
    const createPaymentForm: Element | null = document.querySelector(".create");
    createPaymentForm?.classList.add("hidden");
}

function showCreateExpense(): void {
    const createPaymentForm: Element | null = document.querySelector(".create");
    createPaymentForm?.classList.remove("hidden");
}

function handleCreatePayment(): void {
    const createPaymentForm: Element | null = document.querySelector(".payment-form");
    createPaymentForm?.classList.remove("hidden");
}

async function handleMessage(this: HTMLElement): Promise<void> {
    if (this.id) {
        await deleteExpenseFunction(this.id);
    }
}

function handlePopulateSelects(): void {
    const arr: any[] = [eventId];
    const participants: Promise<string | any[]> = api.queryDatabase(PARTICIPANT_QUERY.SELECT_PARTICIPANT_AND_USER_BY_EVENT, ...arr);
    const expenseSelect: HTMLSelectElement | any = document.querySelector("#expense-participants");
    const paymentSelect: HTMLSelectElement | any = document.querySelector("#payment-participant");
    participants.then(
        (participant: string | any[]): void => {
            if (typeof participant !== "string") {
                participant.forEach(item => {
                    expenseSelect.options[expenseSelect.options.length] = new Option(item.username, item.participantId);
                    paymentSelect.options[paymentSelect.options.length] = new Option(item.username, item.participantId);
                });
            }
        }
    );

}

async function handleHeroTab(this: HTMLElement): Promise<void> {
    const dashboard: Element | null = document.querySelector(".dashboard-content");
    const payment: Element | null = document.querySelector(".payment-content");
    const participants: Element | null = document.querySelector(".participant-content");
    document.querySelectorAll(".hero-tab").forEach(item => {
        item.classList.remove("is-active");
    });
    this.classList.add("is-active");

    document.querySelectorAll(".content").forEach(item => {
        item.classList.add("hidden");
    })
    ;
    if (this.classList.contains("dashboard")) {
        dashboard?.classList.remove("hidden");
    } else if (this.classList.contains("payment")) {
        payment?.classList.remove("hidden");
    } else if (this.classList.contains("participants")) {
        participants?.classList.remove("hidden");
    }
}


async function loggedOut(this: HTMLElement): Promise<void> {
    // Remove JWTToken From session
    session.remove("JWTToken");
    location.reload();
}

async function checkURLParams(): Promise<void> {
    try {
        let params: URLSearchParams = new URLSearchParams(location.search);
        const checkedParam: string | null = params.get("eventId");
        if (checkedParam) {
            eventId = checkedParam;
        }
    } catch (e) {
        console.log(e);
    }
}

async function closeMessage(): Promise<void> {
    const confirmation: Element | null = document.querySelector(".filter");
    const deleteIcon: Element | null = document.querySelector(".delete");
    const cancelButton: Element | null = document.querySelector(".close-modal-button");

    cancelButton?.classList.add("hidden");
    confirmation?.classList.add("hidden");
    deleteIcon?.classList.add("hidden");
}


async function verifyUser(): Promise<void> {
    try {
        // Get token from users session.
        const token: string = session.get("JWTToken");

        const logged: JWTPayload = await verify(token, __SECRET_KEY__);
        if (!logged) {
            console.log("Invalid JWT token!");
            window.location.href = "index.html";
            return;
        }

        const params: any[] = [eventId, logged.id];
        const verified: string | any[] = await api.queryDatabase(EVENT_QUERY.SELECT_EVENT_BY_EVENT_ID_AND_USER_ID, ...params);
        if (!verified) {
            console.log("User not found!");
            window.location.href = "index.html";
            return;
        }

    } catch (error) {
        console.log(error);
        window.location.href = "index.html";
    }
}


async function createExpense(description: string | undefined, amount: number | undefined, participants: any): Promise<void> {
    const id: string = uuidv4();
    const params: any[] = [id, description, amount, eventId];
    try {
        const participantsAmount: number = participants.length;

        const expense: Promise<string | any[]> = api.queryDatabase(EXPENSE_QUERY.CREATE_EXPENSE, ...params);
        expense.then(
            (): void => {
                participants.forEach((participant: any): void => {
                    if (amount) {
                        const cut: number = amount / participantsAmount;
                        const data: any[] = [null, description, cut, eventId, parseFloat(<string>participant), id];
                        const payment: Promise<string | any[]> = api.queryDatabase(PAYMENT_QUERY.CREATE_PAYMENT, ...data);

                        payment.then(
                            async (): Promise<void> => {
                                hideCreateExpense();
                                const filter: Element | null = document.querySelector(".filter");
                                const messageButton: Element | null = document.querySelector(".continue-button");
                                const message: Element | null = document.querySelector(".message");
                                const successIcon: Element | null = document.querySelector(".success");

                                filter?.classList.remove("hidden");
                                messageButton?.classList.add("hidden");
                                successIcon?.classList.remove("hidden");

                                if (message) {
                                    message.innerHTML = "Successfully created expense!";
                                }

                                await delay(1000);
                                location.reload();

                            },
                            (): void => {
                                console.log("Unsuccessfully made payment");
                            }
                        );
                    }
                });
            },
            (): void => {
                console.log("Failed to create expense!");
            }
        );

    } catch (Error) {
        console.log(Error);
    }
}

function delay(ms: number): Promise<void> {
    // Sets time out with give ms
    return new Promise(resolve => setTimeout(resolve, ms));
}

function addExpensesTable(): void {
    // Get token from session storage for userID
    const tableBody: Element | null = document.querySelector(".expense-table-body");
    const eventID: any = eventId;

    if (eventID) {
        // Get all events from userID
        const getExpenses: Promise<string | any[]> = api.queryDatabase(EXPENSE_QUERY.SELECT_EXPENSES_BY_EVENT, eventID);

        getExpenses.then(
            (events: string | any[]): void => {
                if (typeof events !== "string") {
                    events.forEach((expense: any): void => {
                        //Create <tr> for the table row
                        const tr: HTMLTableRowElement | undefined = tableBody?.appendChild(document.createElement("tr"));
                        if (tr) {
                            // Create the other table data for the current row
                            tr.setAttribute("id", expense.expenseId);
                            tr.setAttribute("class", "expense");
                            tr.appendChild(document.createElement("th")).appendChild(document.createTextNode(expense.expenseId));
                            tr.appendChild(document.createElement("td")).appendChild(document.createTextNode(expense.description));
                            tr.appendChild(document.createElement("td")).appendChild(document.createTextNode("€" + expense.totalAmount));
                            tr.appendChild(document.createElement("td")).appendChild(document.createTextNode(expense.dateCreated));
                            tr.appendChild(document.createElement("td")).appendChild(document.createTextNode("open"));
                            const button: HTMLTableCellElement = tr.appendChild(document.createElement("td"));
                            const aButton: HTMLElement = button.appendChild(document.createElement("a"));
                            aButton.classList.add("delete-button");
                            const span: HTMLSpanElement = aButton.appendChild(document.createElement("span"));
                            span.appendChild(document.createTextNode("Delete"));

                            // Add event listeners
                            tr.addEventListener("click", function (expense: MouseEvent | null): void {
                                if (expense) {
                                    let target: HTMLElement = expense.target as HTMLElement;
                                    if ((target.parentElement && target.parentElement.classList.contains("delete-button")) || (target.firstElementChild && target.firstElementChild.classList.contains("delete-button"))) {
                                        showDelete(tr);
                                    } else {
                                        handleExpenseClick(tr);
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

async function showDelete(row: HTMLTableRowElement): Promise<void> {
    const confirmation: Element | null = document.querySelector(".filter");
    const deleteIcon: Element | null = document.querySelector(".delete");
    const message: Element | null = document.querySelector(".message");
    const confirmationButton: Element | null = document.querySelector(".continue-button");
    const cancelButton: Element | null = document.querySelector(".close-modal-button");

    if (row) {
        const expenseId: any = row.getAttribute("id");
        confirmationButton?.setAttribute("id", expenseId);

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


async function deleteExpenseFunction(id: string): Promise<void> {
    if (id) {
        // Delete expense in database
        const expense: Promise<string | any[]> = api.queryDatabase(EXPENSE_QUERY.DELETE_EXPENSE, id);
        expense.then(
            (): void => {
                location.reload();
            },
            (): void => {
                console.log("Failed to delete expense!");
            }
        );
    }
}


async function handleExpenseClick(row: HTMLTableRowElement): Promise<void> {
    const expenseId: string | null = row.getAttribute("id");
    document.querySelector(".hero-tabs")?.classList.add("hidden");
    document.querySelector(".hero-tabs-underline")?.classList.add("hidden");
    document.querySelector(".dashboard-content")?.classList.add("hidden");
    document.querySelector(".payment-content")?.classList.remove("hidden");

    if (expenseId) {
        await populatePaymentTable(expenseId);
    }
}

async function handleReturnClick(): Promise<void> {
    document.querySelector(".hero-tabs")?.classList.remove("hidden");
    document.querySelector(".hero-tabs-underline")?.classList.remove("hidden");
    document.querySelector(".dashboard-content")?.classList.remove("hidden");
    document.querySelector(".payment-content")?.classList.add("hidden");
}


async function populatePaymentTable(expenseId: string): Promise<void> {
    if (expenseId && eventId) {

        const tableBody: Element | null = document.querySelector(".payment-table-body");
        const params: string[] = [eventId, expenseId];
        const getPayments: Promise<string | any[]> = api.queryDatabase(PAYMENT_QUERY.GET_PAYMENTS_BY_EXPENSE_ID, ...params);

        getPayments.then(
            (payments: string | any[]): void => {
                if (typeof payments !== "string") {
                    payments.forEach((payment: any): void => {
                        const tr: HTMLTableRowElement | undefined = tableBody?.appendChild(document.createElement("tr"));
                        if (tr) {
                            // Create the other table data for the current row
                            tr.setAttribute("id", payment.paymentId);
                            tr.setAttribute("class", "payment");
                            tr.appendChild(document.createElement("th")).appendChild(document.createTextNode(payment.paymentId));
                            tr.appendChild(document.createElement("td")).appendChild(document.createTextNode(payment.datePaid));
                            tr.appendChild(document.createElement("td")).appendChild(document.createTextNode(payment.description));
                            tr.appendChild(document.createElement("td")).appendChild(document.createTextNode("€" + payment.customAmount));
                            tr.appendChild(document.createElement("td")).appendChild(document.createTextNode("€" + payment.paymentAmount));
                            tr.appendChild(document.createElement("td")).appendChild(document.createTextNode(payment.username));
                            tr.appendChild(document.createElement("td")).appendChild(document.createTextNode("not paid!"));
                            // Add event listeners
                            tr.addEventListener("click", (): void => {
                                handleExpenseClick(tr);
                            });
                        }
                    });
                }
            }
        );
    }


}


app();
