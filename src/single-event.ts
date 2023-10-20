import "./hboictcloud-config";
import {v4 as uuidv4} from "uuid";
import {
    addExpensesTable,
    populateParticipantTable,
    removeAllChildren
} from "./components/createTable";
import {api, session} from "@hboictcloud/api";
import {verifyUserForEvent} from "./authentication/verifyUser";
import {EXPENSE_QUERY} from "./query/expanse.query";
import {PAYMENT_QUERY} from "./query/payment.query";
import {JWTPayload} from "jose";
import {verify} from "./authentication/jsonwebtoken";
import {PARTICIPANT_QUERY} from "./query/participant.query";
import {USER_QUERY} from "./query/user.query";

/**
 * Entry point
 */
let eventId: string = "";

async function app(): Promise<void> {
    await checkURLParams();
    await verifyUserForEvent(eventId);
    await syncAllTables();

    handlePopulateSelects();

    console.log("hoi");

    const showExpense: Element | null = document.querySelector(".create-expense-button");
    const hideExpense: Element | null = document.querySelector(".cancel-create-expense");

    const showParticipant: Element | null = document.querySelector(".create-participant-button");
    const hideParticipant: Element | null = document.querySelector(".cancel-create-participant");

    const showPayment: Element | null = document.querySelector(".create-payment-button");
    const hidePayment: Element | null = document.querySelector(".cancel-create-payment");

    const expenseDescription: HTMLInputElement | any = document.querySelector("#description");
    const expenseAmount: HTMLInputElement | any = document.querySelector("#amount");
    const expenseParticipants: HTMLInputElement | any = document.querySelector("#expense-participants");

    const participant: HTMLInputElement | any = document.querySelector("#participant");

    const expenseForm: HTMLFormElement | null = document.querySelector("#form");
    const participantForm: HTMLFormElement | null = document.querySelector("#participant-form");

    const customErrorMessage: HTMLButtonElement | any = document.querySelector(".error-message");
    const confirmButton: HTMLButtonElement | any = document.querySelector(".continue-button");

    const closeMessageButton: HTMLButtonElement | any = document.querySelector(".close-modal-button");
    const returnButton: HTMLButtonElement | any = document.querySelector(".return");

    confirmButton?.addEventListener("click", deleteFunction);

    showExpense?.addEventListener("click", showExpenseForm);
    hideExpense?.addEventListener("click", hideExpenseForm);

    showParticipant?.addEventListener("click", showParticipantForm);
    hideParticipant?.addEventListener("click", hideParticipantForm);

    showPayment?.addEventListener("click", showPaymentForm);
    hidePayment?.addEventListener("click", hidePaymentForm);

    closeMessageButton?.addEventListener("click", closeMessage);
    returnButton?.addEventListener("click", handleReturnClick);

    document.querySelectorAll(".hero-tab").forEach(item => {
        item.addEventListener("click", handleHeroTab);
    });

    document.querySelectorAll(".logout").forEach(item => {
        item.addEventListener("click", loggedOut);
    });


    // Expense form validation
    expenseForm?.addEventListener("submit", async (e: SubmitEvent): Promise<void> => {
        let error: boolean = false;
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

        const inputs: (HTMLInputElement | null)[] = [expenseDescription, expenseAmount, expenseParticipants];

        error = false;

        for (const input of inputs) {
            await validateInput(input, input?.name + " is required");
        }


        if (!error) {
            const values: string[] = Array.from(expenseParticipants.selectedOptions).map(({value}: any) => value);
            await createExpense(expenseDescription?.value, parseFloat(<string>expenseAmount?.value), values);
        }
    });


    // Participant form validation
    participantForm?.addEventListener("submit", async (e: SubmitEvent): Promise<void> => {
        let error: boolean;
        e.preventDefault();

        error = false;

        function checkParticipants(): void {
            if (participant && participant.value === "") {
                if (customErrorMessage) {
                    customErrorMessage.classList.remove("hidden");
                    customErrorMessage.innerHTML = participant.name + "is required";
                }
                error = true;
            }
        }

        await checkParticipants();


        // Check if all inputs are validated
        if (!error) {
            await createParticipant(participant);
        }

    });


}

app();

function deleteFunction(this: HTMLElement): void {
    const confirmation: Element | null = document.querySelector(".filter");
    const deleteIcon: Element | null = document.querySelector(".delete");
    if (this.classList.contains("expense")) {
        const expenseId: string = this.id;
        const deleteExpense: Promise<string | any[]> = api.queryDatabase(EXPENSE_QUERY.DELETE_EXPENSE, expenseId);

        deleteExpense.then(
            async (): Promise<void> => {
                confirmation?.classList.add("hidden");
                deleteIcon?.classList.add("hidden");
                await syncAllTables();
            },
            (): void => {
                console.log("Failed to delete expense!");
            }
        );
    }

    if (this.classList.contains("participant")) {
        const participantId: string = this.id;
        const deleteParticipant: Promise<string | any[]> = api.queryDatabase(PARTICIPANT_QUERY.DELETE_PARTICIPANT, participantId);

        deleteParticipant.then(
            async (): Promise<void> => {
                confirmation?.classList.add("hidden");
                deleteIcon?.classList.add("hidden");
                await syncAllTables();
            },
            (): void => {
                console.log("Failed to delete participant!");
            }
        );
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
                participants.forEach(async (participant: any): Promise<void> => {
                    if (amount) {
                        const cut: number = amount / participantsAmount;
                        if (participant === "none") {

                            const getUserId: Promise<any> = getCurrentUserID();
                            await getUserId.then(
                                (userId): void => {
                                    const data: any[] = [eventId, userId];
                                    const getParticipant: Promise<string | any[]> = api.queryDatabase(PARTICIPANT_QUERY.GET_PARTICIPANT_BY_EVENT_AND_USER_ID, ...data);
                                    getParticipant.then(
                                        (par: string | any[]): void => {
                                            const data: any[] = [null, description, cut, eventId, par[0].participantId, id];
                                            createPayments(data);
                                        },
                                        (): void => {
                                            console.log("Failed to get participant!");
                                        }
                                    );
                                },
                                (): void => {
                                    console.log("Failed to get current user!");
                                }
                            );

                        } else {
                            const data: any[] = [null, description, cut, eventId, parseFloat(<string>participant), id];
                            createPayments(data);
                        }
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

function createPayments(data: any[]): void {
    const payment: Promise<string | any[]> = api.queryDatabase(PAYMENT_QUERY.CREATE_PAYMENT, ...data);

    payment.then(
        async (): Promise<void> => {
            hideExpenseForm();
            await showSuccessMessage("Successfully made expense!");
        },
        (): void => {
            console.log("Unsuccessfully made payment");
        }
    );
}

async function showSuccessMessage(message: string): Promise<void> {
    const filter: Element | null = document.querySelector(".filter");
    const messageButton: Element | null = document.querySelector(".continue-button");
    const CustomMessage: Element | null = document.querySelector(".message");
    const successIcon: Element | null = document.querySelector(".success");

    filter?.classList.remove("hidden");
    messageButton?.classList.add("hidden");
    successIcon?.classList.remove("hidden");

    if (CustomMessage) {
        CustomMessage.innerHTML = message ?? "Successful!";
    }

    await delay(1000);

    successIcon?.classList.add("hidden");
    filter?.classList.add("hidden");
    messageButton?.classList.remove("hidden");
    await syncAllTables();
}

async function getCurrentUserID(): Promise<unknown> {
    const token: string = session.get("JWTToken");
    const logged: JWTPayload = await verify(token, __SECRET_KEY__);

    return logged.id;
}


export async function syncAllTables(): Promise<void> {
    const tableParticipants: Element | null = document.querySelector(".participant-table-body");
    const tableExpenses: Element | null = document.querySelector(".expense-table-body");

    await removeAllChildren();

    populateParticipantTable(eventId, tableParticipants);
    addExpensesTable(eventId, tableExpenses);
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


function showExpenseForm(): void {
    const createPaymentForm: Element | null = document.querySelector(".create-expense");
    createPaymentForm?.classList.remove("hidden");
}

function hideExpenseForm(): void {
    const createPaymentForm: Element | null = document.querySelector(".create-expense");
    createPaymentForm?.classList.add("hidden");
}

function showPaymentForm(): void {
    const createPaymentForm: Element | null = document.querySelector(".create-payment");
    createPaymentForm?.classList.remove("hidden");
}

function hidePaymentForm(): void {
    const createPaymentForm: Element | null = document.querySelector(".create-payment");
    createPaymentForm?.classList.add("hidden");
}

async function showParticipantForm(): Promise<void> {
    const participantSelect: HTMLSelectElement | any = document.querySelector("#participant");
    const participantChildren: HTMLCollection | undefined = participantSelect.children;
    const createPaymentForm: Element | null = document.querySelector(".add-participant");
    const getUsers: Promise<string | any[]> = api.queryDatabase(USER_QUERY.GET_USERS_WITHOUT_PARTICIPANT_FOR_EVENT, eventId);

    await handlePopulateSelects();

    if (participantChildren) {
        Array.from(participantChildren).forEach(child => {
            child.remove();
        });
    }

    const option: HTMLOptionElement = participantSelect.options[participantSelect.options.length] = new Option("Select an option!", "", false, true);
    option.setAttribute("disabled", "true");
    option.setAttribute("selected", "selected");
    option.setAttribute("hidden", "hidden");

    getUsers.then(
        (users: string | any[]): void => {
            if (typeof users !== "string") {
                users.forEach(user => {
                    participantSelect.options[participantSelect.options.length] = new Option(user.username, user.userId);
                });
            }
        }
    );

    createPaymentForm?.classList.remove("hidden");
}

function hideParticipantForm(): void {
    const createPaymentForm: Element | null = document.querySelector(".add-participant");
    createPaymentForm?.classList.add("hidden");
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


async function createParticipant(participant: any): Promise<void> {
    try {
        const data: any[] = [eventId, participant.value];
        const newParticipant: string | any[] = await api.queryDatabase(PARTICIPANT_QUERY.CREATE_PARTICIPANT, ...data);
        if (!newParticipant) {
            console.log("Unsuccessful!");
            return;
        }

        hideParticipantForm();
        await showSuccessMessage("Successfully created participant!");

    } catch (e) {
        console.log(e);
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

function delay(ms: number): Promise<void> {
    // Sets time out with give ms
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function closeMessage(): Promise<void> {
    const confirmation: Element | null = document.querySelector(".filter");
    const deleteIcon: Element | null = document.querySelector(".delete");
    const cancelButton: Element | null = document.querySelector(".close-modal-button");

    cancelButton?.classList.add("hidden");
    confirmation?.classList.add("hidden");
    deleteIcon?.classList.add("hidden");
}

async function handleReturnClick(): Promise<void> {
    document.querySelector(".hero-tabs")?.classList.remove("hidden");
    document.querySelector(".hero-tabs-underline")?.classList.remove("hidden");
    document.querySelector(".dashboard-content")?.classList.remove("hidden");
    document.querySelector(".payment-content")?.classList.add("hidden");
}