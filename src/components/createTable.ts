import "../hboictcloud-config";
import {api} from "@hboictcloud/api";
import {PAYMENT_QUERY} from "../query/payment.query";
import {EXPENSE_QUERY} from "../query/expanse.query";
import {PARTICIPANT_QUERY} from "../query/participant.query";
import {handleBreadcrumbs} from "../single-event";
import {EVENT_QUERY} from "../query/event.query";
import {Status} from "../enum/status.enum";

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

async function editRecord(row: HTMLTableRowElement): Promise<void> {
    if (row.classList.contains("payment")) {
        const createPaymentForm: Element | null = document.querySelector(".edit-payment");
        if (createPaymentForm) {
            createPaymentForm.id = row.id;
        }
        createPaymentForm?.classList.remove("hidden");
    }

    if (row.classList.contains("expense")) {
        const editExpenseForm: Element | null = document.querySelector(".edit-expense");
        if (editExpenseForm) {
            editExpenseForm.id = row.id;
        }
        editExpenseForm?.classList.remove("hidden");
    }
}


async function showPaymentsTable(row: HTMLTableRowElement, eventId: any): Promise<void> {
    const expenseId: string | null = row.getAttribute("id");
    document.querySelector(".hero-tabs")?.classList.add("hidden");
    document.querySelector(".hero-tabs-underline")?.classList.add("hidden");
    document.querySelector(".dashboard-content")?.classList.add("hidden");
    const paymentContent: Element | null = document.querySelector(".payment-content");

    const breadCrumbList: Element | null = document.querySelector(".breadcrumb-list");
    const id: any = eventId;
    if (id) {
        const event: Promise<string | any[]> = api.queryDatabase(EVENT_QUERY.SELECT_EVENT, id);
        event.then(
            (item: string): void => {
                if (breadCrumbList?.lastElementChild) {
                    breadCrumbList.children[2].firstElementChild.children[1].remove();
                    const anchorElement: HTMLAnchorElement = breadCrumbList.children[2].firstElementChild.appendChild(document.createElement("a"));
                    anchorElement.href = "single-event.html?eventId=" + eventId;
                    anchorElement.classList.add("breadcrumb-link");
                    anchorElement.appendChild(document.createTextNode(item[0]["description"]));

                    breadCrumbList.children[3].classList.remove("hidden");
                    const expense: Promise<string | any[]> = api.queryDatabase(EXPENSE_QUERY.SELECT_EXPENSE, expenseId);
                    expense.then(
                        (item: string): void => {
                            if (breadCrumbList.children[3].firstElementChild.lastElementChild) {
                                breadCrumbList.children[3].firstElementChild.lastElementChild.innerHTML = item[0]["description"];
                            }
                        },
                        (): void => {
                            console.log(Status.NOT_FOUND);
                        }
                    );
                }
            },
            (): void => {
                console.log(Status.NOT_FOUND);
            }
        );
    }

    if (paymentContent) {
        paymentContent.classList.remove("hidden");
        paymentContent.id = expenseId;
    }

    if (expenseId) {
        await removeAllChildren();
        populatePaymentTable(expenseId, eventId);
    }
}

async function showDeleteConfirmation(row: HTMLElement): Promise<void> {
    if (row) {
        const id: string = row.id;
        const confirmation: Element | null = document.querySelector(".filter");
        const deleteIcon: Element | null = document.querySelector(".delete-background");
        const cancelButton: Element | null = document.querySelector(".close-modal-button");
        const confirmButton: Element | null = document.querySelector(".continue-button");
        const message: Element | null = document.querySelector(".message");
        if (confirmButton) {
            confirmButton.id = id;

            if (row.classList.contains("expense")) {
                confirmButton.classList.add("expense");
                if (message) {
                    message.innerHTML = "Are you sure you want to delete this expense?";
                }
            }

            if (row.classList.contains("participant")) {
                confirmButton.classList.add("participant");
                if (message) {
                    message.innerHTML = "Are you sure you want to delete this participant?";
                }
            }

            if (row.classList.contains("payment")) {
                confirmButton.classList.add("payment");
                if (message) {
                    message.innerHTML = "Are you sure you want to delete this payment?";
                }
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
        const params: any[] = [eventId, expenseId];
        const getPayments: Promise<string | any[]> = api.queryDatabase(PAYMENT_QUERY.GET_PAYMENTS_BY_EXPENSE_ID, ...params);

        getPayments.then(
            (payments: string | any[]): void => {
                if (typeof payments !== "string") {
                    payments.forEach((payment: any): void => {
                        const tr: HTMLTableRowElement | undefined = tableBody?.appendChild(document.createElement("tr"));
                        const status: string = payment.paymentStatus === 0 ? "Unpaid" : "Paid";
                        let paidDate: string | Date;
                        if (typeof payment.datePaid === "string") {
                            paidDate = new Date(payment.datePaid).toDateString();
                        } else {
                            paidDate = "Unkown";
                        }
                        let paymentAmount: string = "";
                        if (payment.paymentAmount < 0) {
                            const amount: number = payment.paymentAmount * -1;
                            paymentAmount = `To receive: € ${amount}`;
                        } else {
                            paymentAmount = `To pay: € ${payment.paymentAmount}`;
                        }

                        const customAmount: string = payment.customAmount === null ? 0 : payment.customAmount;
                        if (tr) {
                            // Create the other table data for the current row
                            tr.setAttribute("id", payment.paymentId);
                            tr.setAttribute("class", "payment");
                            tr.appendChild(document.createElement("th")).appendChild(document.createTextNode(payment.paymentId));
                            tr.appendChild(document.createElement("td")).appendChild(document.createTextNode(payment.description));
                            tr.appendChild(document.createElement("td")).appendChild(document.createTextNode(payment.username));
                            tr.appendChild(document.createElement("td")).appendChild(document.createTextNode("€ " + customAmount));
                            tr.appendChild(document.createElement("td")).appendChild(document.createTextNode(paymentAmount));
                            tr.appendChild(document.createElement("td")).appendChild(document.createTextNode(paidDate));
                            tr.appendChild(document.createElement("td")).appendChild(document.createTextNode(status));
                            const button: HTMLTableCellElement = tr.appendChild(document.createElement("td"));
                            const editButton: HTMLElement = button.appendChild(document.createElement("a"));
                            editButton.classList.add("edit-button");
                            editButton.classList.add("payment");
                            editButton.id = payment.paymentId;
                            editButton.innerHTML = "<img src='assets/images/icons/edit.svg' alt='edit payment' class='icon-edit'>";
                            const editSpan: HTMLSpanElement = editButton.appendChild(document.createElement("span"));
                            editSpan.appendChild(document.createTextNode("Edit"));

                            const deleteButton: HTMLElement = button.appendChild(document.createElement("a"));
                            deleteButton.classList.add("payment");
                            deleteButton.classList.add("delete-button");
                            deleteButton.classList.add("payment");
                            deleteButton.id = payment.paymentId;
                            deleteButton.innerHTML = "<img src='assets/images/icons/delete-color.svg' alt='delete payment' class='icon-delete'>";
                            const deleteSpan: HTMLSpanElement = deleteButton.appendChild(document.createElement("span"));
                            deleteSpan.appendChild(document.createTextNode("Delete"));

                            const expense: Promise<string | any> = api.queryDatabase(EXPENSE_QUERY.SELECT_EXPENSE, expenseId);
                            expense.then(
                                async (item: string): Promise<void> => {
                                    if (item[0]["expenseStatus"] === 1) {
                                        const createButton: Element | any = document.querySelector(".create-payment-button");
                                        createButton.classList.add("hidden");
                                        editButton.classList.add("hidden");
                                        deleteButton.classList.add("hidden");
                                    }

                                    if (item[0]["expenseStatus"] === 0) {

                                        if (eventId) {
                                            try {
                                                const event: string | any[] = await api.queryDatabase(EVENT_QUERY.SELECT_EVENT, eventId);
                                                if (event) {
                                                    if (event[0].eventStatus === 1) {
                                                        const createButton: Element | any = document.querySelector(".create-payment-button");
                                                        createButton.classList.add("hidden");
                                                        editButton.classList.add("hidden");
                                                        deleteButton.classList.add("hidden");
                                                    } else {
                                                        tr.addEventListener("click", async function (expense: MouseEvent | null): Promise<void> {
                                                            if (expense) {
                                                                let target: HTMLElement = expense.target as HTMLElement;
                                                                if ((target.parentElement && target.parentElement.classList.contains("delete-button")) || (target.firstElementChild && target.firstElementChild.classList.contains("delete-button"))) {
                                                                    await showDeleteConfirmation(deleteButton);
                                                                } else {
                                                                    await editRecord(tr);
                                                                }
                                                            }

                                                        });
                                                    }
                                                }
                                            } catch (e) {
                                                console.log(e);
                                            }
                                        }
                                    }
                                },
                                (): void => {
                                    console.log(Status.NOT_FOUND);
                                }
                            );


                        }
                    });
                }
            }
        );
    }
}

export async function addExpensesTable(eventId: string | any, tableBody: Element | null): Promise<void> {
    // Get token from session storage for userID
    if (eventId) {
        // Get all events from userID
        const getExpenses: Promise<string | any[]> = api.queryDatabase(EXPENSE_QUERY.SELECT_EXPENSES_BY_EVENT, eventId);

        getExpenses.then(
            async (events: string | any[]): Promise<void> => {
                if (typeof events !== "string") {
                    for (const expense of events) {
                        //Create <tr> for the table row
                        const tr: HTMLTableRowElement | undefined = tableBody?.appendChild(document.createElement("tr"));

                        const status: string = expense.expenseStatus === 0 ? "Open" : "Closed";

                        let createdAt: string | Date;
                        if (typeof expense.dateCreated === "string") {
                            const date: Date = new Date(expense.dateCreated);
                            createdAt = date.toUTCString().replace(" GMT", "");
                        } else {
                            createdAt = "Unkown";
                        }

                        if (tr) {
                            // Create the other table data for the current row
                            tr.setAttribute("id", expense.expenseId);
                            tr.setAttribute("class", "expense");
                            tr.appendChild(document.createElement("th")).appendChild(document.createTextNode(expense.expenseId));
                            tr.appendChild(document.createElement("td")).appendChild(document.createTextNode(expense.description));
                            tr.appendChild(document.createElement("td")).appendChild(document.createTextNode("€" + expense.totalAmount));
                            tr.appendChild(document.createElement("td")).appendChild(document.createTextNode(createdAt));
                            tr.appendChild(document.createElement("td")).appendChild(document.createTextNode(status));
                            const button: HTMLTableCellElement = tr.appendChild(document.createElement("td"));
                            const editButton: HTMLElement = button.appendChild(document.createElement("button"));
                            editButton.classList.add("edit-button");
                            editButton.classList.add("expense");
                            editButton.id = expense.expenseId;
                            editButton.innerHTML = "<img src='assets/images/icons/edit.svg' alt='edit expense' class='icon-edit'>";
                            const editSpan: HTMLSpanElement = editButton.appendChild(document.createElement("span"));
                            editSpan.appendChild(document.createTextNode("Edit"));

                            const deleteButton: HTMLElement = button.appendChild(document.createElement("button"));
                            deleteButton.classList.add("expense");
                            deleteButton.classList.add("delete-button");
                            deleteButton.id = expense.expenseId;
                            deleteButton.innerHTML = "<img src='assets/images/icons/delete-color.svg' alt='delete expense' class='icon-delete'>";
                            const deleteSpan: HTMLSpanElement = deleteButton.appendChild(document.createElement("span"));
                            deleteSpan.appendChild(document.createTextNode("Delete"));

                            if (expense) {
                                if (expense.expenseStatus === 1) {
                                    editButton.setAttribute("disabled", "disabled");
                                    deleteButton.setAttribute("disabled", "disabled");
                                }

                                if (eventId) {
                                    try {
                                        const event: string | any[] = await api.queryDatabase(EVENT_QUERY.SELECT_EVENT, eventId);
                                        if (event) {
                                            if (event[0].eventStatus === 1) {
                                                editButton.setAttribute("disabled", "disabled");
                                                deleteButton.setAttribute("disabled", "disabled");
                                            }
                                        }
                                    } catch (e) {
                                        console.log(e);
                                    }
                                }

                            }

                            tr.addEventListener("click", async function (expense: MouseEvent | null): Promise<void> {
                                if (expense) {
                                    let target: HTMLElement = expense.target as HTMLElement;
                                    if ((target.parentElement && target.parentElement.classList.contains("delete-button")) || (target.firstElementChild && target.firstElementChild.classList.contains("delete-button")) || target.classList.contains("delete-button")) {
                                        await showDeleteConfirmation(deleteButton);
                                    } else if ((target.parentElement && target.parentElement.classList.contains("edit-button")) || (target.firstElementChild && target.firstElementChild.classList.contains("edit-button")) || target.classList.contains("edit-button")) {
                                        await editRecord(tr);
                                    } else {
                                        await showPaymentsTable(tr, eventId);
                                    }
                                }

                            });
                        }
                    }
                }
            }
        );
    }
}


export function populateParticipantTable(eventId: string | any, tableBody: Element | null): void {
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
                            aButton.innerHTML = "<img src='assets/images/icons/delete-color.svg' alt='delete expense' class='icon-delete'>";
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