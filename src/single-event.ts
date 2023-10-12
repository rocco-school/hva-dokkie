import "./hboictcloud-config";
import {api, session, utils} from "@hboictcloud/api";
import {JWTPayload} from "jose";
import {verify} from "./authentication/jsonwebtoken";
import {EVENT_QUERY} from "./query/event.query";
import {v4 as uuidv4} from "uuid";
import {PARTICIPANT_QUERY} from "./query/participant.query";
import {EXPENSE_QUERY} from "./query/expanse.query";

/**
 * Entry point
 */
let eventId: string = "";

async function app(): Promise<void> {
    await checkURLParams();
    await verifyUser();

    addExpensesTable();

    const form: HTMLFormElement | null = document.querySelector("#form");
    const createButton: Element | any = document.querySelector(".create-button");
    const cancelButton: Element | any = document.querySelector(".cancel");
    const description: HTMLInputElement | any = document.querySelector("#description");
    const amount: HTMLInputElement | any = document.querySelector("#amount");
    const createPayment: Element | any = document.querySelector(".create-payment");


    document.querySelectorAll(".hero-tab").forEach(item => {
        item.addEventListener("click", handleHeroTab);
    });
    document.querySelectorAll(".logout").forEach(item => {
        item.addEventListener("click", loggedOut);
    });

    createButton?.addEventListener("click", showCreateExpense);
    cancelButton?.addEventListener("click", hideCreateExpense);
    createPayment?.addEventListener("click", handleCreatePayment);

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

            const inputs: (HTMLInputElement | null)[] = [description, amount];

            inputs.forEach((input: HTMLInputElement | null): void => {
                validateInput(input, input?.name + " is required");
            });

            // Check if all inputs are validated
            const formIsValid: boolean = inputs.every((input: HTMLInputElement | null) => input?.checkValidity());

            if (formIsValid) {
                if (form.checkValidity()) {
                    await createExpense(description?.value, parseFloat(<string>amount?.value));
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
    const createPaymentForm: Element | null = document.querySelector(".create-form");
    createPaymentForm?.classList.add("hidden");
}

function showCreateExpense(): void {
    const createPaymentForm: Element | null = document.querySelector(".create-form");
    createPaymentForm?.classList.remove("hidden");
}

function handleCreatePayment(): void {
    const createPaymentForm: Element | null = document.querySelector(".payment-form");
    createPaymentForm?.classList.remove("hidden");

    const arr: any[] = [eventId];
    const participants: Promise<string | any[]> = api.queryDatabase(PARTICIPANT_QUERY.SELECT_PARTICIPANT_AND_USER_BY_EVENT, ...arr);
    const select: HTMLSelectElement | any = document.querySelector("#payment-participant");
    participants.then(
        (participant: string | any[]): void => {
            if (typeof participant !== "string") {
                participant.forEach(item => {
                    select.options[select.options.length] = new Option(item.username, item.userId);
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
        console.log("User successfully verified!");

    } catch (error) {
        console.log(error);
        window.location.href = "index.html";
    }
}


async function createExpense(description: string | undefined, amount: number | undefined): Promise<void> {
    const params: any[] = [description, amount, eventId];
    try {
        const payment: Promise<string | any[]> = api.queryDatabase(EXPENSE_QUERY.CREATE_EXPENSE, ...params);
        payment.then(
            (): void => {
                console.log("Successfully created expense!");
                location.reload();
            },
            (): void => {
                console.log("Failed to create expense!");
            }
        );
    } catch (Error) {
        console.log(Error);
    }
}

function addExpensesTable(): void {
    // Get token from session storage for userID
    const tableBody: Element | null = document.querySelector(".payment-table-body");
    const eventID: any = eventId;

    if (eventID) {
        // Get all events from userID
        const getExpenses: Promise<string | any[]> = api.queryDatabase(EXPENSE_QUERY.SELECT_EXPENSES_BY_EVENT, eventID);
        console.log(getExpenses);

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
                            tr.addEventListener("click", handleExpenseClick);
                            aButton.addEventListener("click", deleteExpenseFunction);
                        }
                    });
                }
            }
        );
    }
}

async function deleteExpenseFunction(this: HTMLElement): Promise<void> {
    // Get closest <tr> to get user ID
    const row: HTMLTableRowElement | null = this.closest("tr");
    console.log(row);

    if (row) {
        const id: any = row.getAttribute("id");
        const expense: Promise<string | any[]> = api.queryDatabase(EXPENSE_QUERY.DELETE_EXPENSE, id);
        expense.then(
            (): void => {
                console.log("Successfully deleted expense!");
                location.reload();
            },
            (): void => {
                console.log("Failed to delete expense!");
            }
        );
    }
}


async function handleExpenseClick(this: HTMLElement): Promise<void> {
    const expenseId: string = this.id;
    document.querySelector(".hero-tabs")?.classList.add("hidden");
    document.querySelector(".hero-tabs-underline")?.classList.add("hidden");
    document.querySelector(".dashboard-content")?.classList.add("hidden");
    document.querySelector(".payment-content")?.classList.remove("hidden");

}

app();
