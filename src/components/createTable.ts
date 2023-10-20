import "../hboictcloud-config";
import {api} from "@hboictcloud/api";
import {PAYMENT_QUERY} from "../query/payment.query";
import {EXPENSE_QUERY} from "../query/expanse.query";
import {PARTICIPANT_QUERY} from "../query/participant.query";

export async function removeAllChildren(): Promise<void> {
    const tablePayment: Element | null = document.querySelector(".payment-table-body");
    const expenseTable: Element | null = document.querySelector(".expense-table-body");
    const tableParticipant: Element | null = document.querySelector(".participant-table-body");

    const paymentChildren: HTMLCollection | undefined = tablePayment?.children;
    const expenseChildren: HTMLCollection | undefined = expenseTable?.children;
    const participantChildren: HTMLCollection | undefined = tableParticipant?.children;

    if (paymentChildren) {
        Array.from(paymentChildren).forEach(child => {
            child.remove();
        });
    }

    if (expenseChildren) {
        Array.from(expenseChildren).forEach(child => {
            child.remove();
        });
    }

    if (participantChildren) {
        Array.from(participantChildren).forEach(child => {
            child.remove();
        });
    }
}


async function showPaymentsTable(row: HTMLTableRowElement, eventId: any): Promise<void> {
    const expenseId: string | null = row.getAttribute("id");
    document.querySelector(".hero-tabs")?.classList.add("hidden");
    document.querySelector(".hero-tabs-underline")?.classList.add("hidden");
    document.querySelector(".dashboard-content")?.classList.add("hidden");
    document.querySelector(".payment-content")?.classList.remove("hidden");

    if (expenseId) {
        populatePaymentTable(expenseId, eventId);
    }
}

async function showDeleteConfirmation(row: HTMLElement): Promise<void> {
    if (row) {
        const id: string = row.id;
        const confirmation: Element | null = document.querySelector(".filter");
        const deleteIcon: Element | null = document.querySelector(".delete");
        const cancelButton: Element | null = document.querySelector(".close-modal-button");
        const confirmButton: Element | null = document.querySelector(".continue-button");
        const message: Element | null = document.querySelector(".message");

        if (message) {
            message.innerHTML = "Are you sure you want to delete this expense?";
        }

        if (confirmButton) {
            confirmButton.id = id;

            if (row.classList.contains("expense")) {
                confirmButton.classList.add("expense");
            }

            if (row.classList.contains("participant")) {
                confirmButton.classList.add("participant");
            }
        }

        cancelButton?.classList.remove("hidden");
        confirmation?.classList.remove("hidden");
        deleteIcon?.classList.remove("hidden");
    }
}


export function populatePaymentTable(expenseId: string, eventId: string): void {
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
                        }
                    });
                }
            }
        );
    }
}

export function addExpensesTable(eventId: string, tableBody: Element | null): void {
    // Get token from session storage for userID
    if (eventId) {
        // Get all events from userID
        const getExpenses: Promise<string | any[]> = api.queryDatabase(EXPENSE_QUERY.SELECT_EXPENSES_BY_EVENT, eventId);

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
                            aButton.classList.add("expense");
                            aButton.id = expense.expenseId;
                            const span: HTMLSpanElement = aButton.appendChild(document.createElement("span"));
                            span.appendChild(document.createTextNode("Delete"));

                            // Add event listeners
                            tr.addEventListener("click", async function (expense: MouseEvent | null): Promise<void> {
                                if (expense) {
                                    let target: HTMLElement = expense.target as HTMLElement;
                                    if ((target.parentElement && target.parentElement.classList.contains("delete-button")) || (target.firstElementChild && target.firstElementChild.classList.contains("delete-button"))) {
                                        await showDeleteConfirmation(aButton);
                                    } else {
                                        await showPaymentsTable(tr, eventId);
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


export function populateParticipantTable(eventId: string, tableBody: Element | null): void {
    if (eventId) {
        const getParticipants: Promise<string | any[]> = api.queryDatabase(PARTICIPANT_QUERY.SELECT_PARTICIPANT_AND_USER_BY_EVENT, eventId);

        getParticipants.then(
            (participants: string | any[]): void => {
                if (typeof participants !== "string") {
                    participants.forEach((participant: any): void => {
                        const tr: HTMLTableRowElement | undefined = tableBody?.appendChild(document.createElement("tr"));
                        if (tr) {
                            // Create the other table data for the current row
                            tr.setAttribute("id", participant.participantId);
                            tr.setAttribute("class", "participant");
                            tr.appendChild(document.createElement("th")).appendChild(document.createTextNode(participant.participantId));
                            tr.appendChild(document.createElement("th")).appendChild(document.createTextNode(participant.username));
                            tr.appendChild(document.createElement("th")).appendChild(document.createTextNode(participant.email));
                            const button: HTMLTableCellElement = tr.appendChild(document.createElement("td"));
                            const aButton: HTMLElement = button.appendChild(document.createElement("a"));
                            aButton.classList.add("delete-button");
                            aButton.classList.add("participant");
                            aButton.id = participant.participantId;
                            const span: HTMLSpanElement = aButton.appendChild(document.createElement("span"));
                            span.appendChild(document.createTextNode("Delete"));

                            button.addEventListener("click", async (): Promise<void> => {
                                await showDeleteConfirmation(aButton);
                            });
                        }
                    });
                }
            }
        );
    }
}