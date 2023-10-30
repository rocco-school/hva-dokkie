import "./hboictcloud-config";
import {v4 as uuidv4} from "uuid";
import {
    addExpensesTable,
    populateParticipantTable,
    populatePaymentTable,
    removeAllChildren
} from "./components/createTable";
import {api, session} from "@hboictcloud/api";
import {verifyUserForEvent} from "./authentication/verifyUser";
import {EXPENSE_QUERY} from "./query/expanse.query";
import {PAYMENT_QUERY} from "./query/payment.query";
import {PARTICIPANT_QUERY} from "./query/participant.query";
import {USER_QUERY} from "./query/user.query";
import {delay} from "./components/delay";
import {Status} from "./enum/status.enum";
import {EVENT_QUERY} from "./query/event.query";

/**
 * Entry point
 */
let eventId: string = "";

async function app(): Promise<void> {
    await checkURLParams();
    await verifyUserForEvent(eventId);
    await syncAllTables();
    await hideAllCreateButtons();
    await handlePopulateSelects();
    await showEventData();

    await handleBreadcrumbs();

    const showExpense: HTMLAnchorElement | any = document.querySelector(".create-expense-button");
    const hideExpense: HTMLAnchorElement | any = document.querySelector(".cancel-create-expense");

    const showParticipant: HTMLAnchorElement | any = document.querySelector(".create-participant-button");
    const hideParticipant: HTMLAnchorElement | any = document.querySelector(".cancel-create-participant");

    const showPayment: HTMLAnchorElement | any = document.querySelector(".create-payment-button");
    const hidePayment: HTMLAnchorElement | any = document.querySelector(".cancel-create-payment");

    const hideEditPayment: HTMLAnchorElement | any = document.querySelector(".cancel-edit-payment");
    const hideEditExpense: HTMLAnchorElement | any = document.querySelector(".cancel-edit-expense");

    const expenseDescription: HTMLInputElement | any = document.querySelector("#description");
    const expenseAmount: HTMLInputElement | any = document.querySelector("#amount");
    const expenseParticipants: HTMLInputElement | any = document.querySelector("#expense-participants");

    const editPaymentAmount: HTMLInputElement | any = document.querySelector("#edit-payment-amount");
    const editExpenseAmount: HTMLInputElement | any = document.querySelector("#edit-expense-amount");
    const editPaymentDatePaid: HTMLInputElement | any = document.querySelector("#edit-date-paid");

    const participant: HTMLInputElement | any = document.querySelector("#participant");

    const expenseForm: HTMLFormElement | any = document.querySelector("#form");
    const participantForm: HTMLFormElement | any = document.querySelector("#participant-form");


    const editPaymentForm: HTMLFormElement | any = document.querySelector("#edit-payment-form");
    const editExpenseForm: HTMLFormElement | any = document.querySelector("#edit-expense-form");
    const paymentForm: HTMLFormElement | any = document.querySelector("#payment-form");

    const customErrorMessage: HTMLButtonElement | any = document.querySelector(".error-message");
    const confirmButton: HTMLButtonElement | any = document.querySelector(".continue-button");

    const closeMessageButton: HTMLButtonElement | any = document.querySelector(".close-modal-button");
    const returnButton: HTMLButtonElement | any = document.querySelector(".return");

    confirmButton?.addEventListener("click", deleteFunction);

    showExpense?.addEventListener("click", showExpenseForm);
    hideExpense?.addEventListener("click", hideExpenseForm);

    hideEditPayment?.addEventListener("click", hideEditPaymentForm);
    hideEditExpense?.addEventListener("click", hideEditExpenseForm);

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
    if (expenseForm) {
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
    }

    // Participant form validation
    if (participantForm) {
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

    // Edit payment form validation
    if (editPaymentForm) {
        editPaymentForm.addEventListener("submit", async (e: SubmitEvent): Promise<void> => {
            let error: boolean;
            const editPaymentStatus: HTMLInputElement | any = editPaymentForm.querySelectorAll("input[name='edit-status']:checked");
            const customErrorMessage: HTMLButtonElement | any = document.querySelector(".edit-payment-message");
            const editPaymentId: HTMLButtonElement | any = document.querySelector(".edit-payment");
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


            const inputs: (HTMLInputElement | null)[] = [editPaymentStatus[0]];

            error = false;

            for (const input of inputs) {
                await validateInput(input, input?.name + " is required");
            }

            if (!error) {
                customErrorMessage.classList.add("hidden");

                if (!editPaymentAmount.value) {
                    editPaymentAmount.value = 0;
                }

                const data: any[] = [editPaymentAmount.value, editPaymentDatePaid.value, editPaymentStatus[0].value, editPaymentId.id];
                await editPayment(data);
                await calculatePayments(null);
                await hideEditPaymentForm();
                await showSuccessMessage("Payment successfully updated", null);
                await removeAllChildren();
                await syncAllTables();

            }

        });
    }

    // Edit payment form validation
    if (editExpenseForm) {
        editExpenseForm.addEventListener("submit", async (e: SubmitEvent): Promise<void> => {
            let error: boolean;
            const editExpenseStatus: HTMLInputElement | any = editExpenseForm.querySelectorAll("input[name='edit-status']:checked");
            const customErrorMessage: HTMLButtonElement | any = document.querySelector(".edit-expense-message");
            const editExpenseId: HTMLButtonElement | any = document.querySelector(".edit-expense");
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


            const inputs: (HTMLInputElement | null)[] = [editExpenseStatus[0]];

            error = false;

            for (const input of inputs) {
                await validateInput(input, input?.name + " is required");
            }

            if (!error) {
                customErrorMessage.classList.add("hidden");

                if (!editExpenseAmount.value) {
                    try {
                        const expense: any[] | string = await api.queryDatabase(EXPENSE_QUERY.SELECT_EXPENSE, editExpenseId.id);
                        if (expense) {
                            editExpenseAmount.value = expense[0].totalAmount;
                        }
                    } catch (e) {
                        console.log(e);
                    }
                }

                const data: any[] = [editExpenseAmount.value, editExpenseStatus[0].value, editExpenseId.id];
                await editExpense(data);
                await calculatePayments(editExpenseId.id);
                await hideEditExpenseForm();
                await showSuccessMessage("Expense successfully updated", null);
                await removeAllChildren();
                await syncAllTables();

            }

        });
    }

    // Create payment form validation
    if (paymentForm) {
        paymentForm.addEventListener("submit", async (e: SubmitEvent): Promise<void> => {
            e.preventDefault();
            let error: boolean;
            const expenseId: string | undefined = document.querySelector(".payment-content")?.id;
            const paymentStatus: HTMLInputElement | any = document.querySelectorAll("input[name='payment-status']:checked");
            const customErrorMessage: HTMLButtonElement | any = document.querySelector(".create-payment-message");
            const createPaymentDescription: HTMLButtonElement | any = document.querySelector("#payment-description");
            const createPaymentCustomAmount: HTMLButtonElement | any = document.querySelector("#payment-amount");
            const createPaymentDatePaid: HTMLButtonElement | any = document.querySelector("#payment-date-paid");
            const createPaymentParticipant: HTMLButtonElement | any = document.querySelector("#payment-participant");

            async function validateInput(input: (HTMLInputElement | null), errorMessage: string): Promise<void> {
                if (input && input.value === "") {
                    if (customErrorMessage) {
                        console.log(errorMessage);
                        customErrorMessage.classList.remove("hidden");
                        customErrorMessage.innerHTML = errorMessage;
                    }
                    error = true;
                }
            }


            const inputs: (HTMLInputElement | null)[] = [createPaymentDescription, paymentStatus[0], createPaymentParticipant];

            error = false;

            for (const input of inputs) {
                await validateInput(input, input?.name + " is required");
            }

            if (!error) {
                let datePaid: Date | null = null;
                let customAmount: number = 0;
                if (createPaymentDatePaid.value) {
                    datePaid = createPaymentDatePaid.value;
                }
                if (createPaymentCustomAmount.value) {
                    customAmount = createPaymentCustomAmount.value;
                }

                const data: any[] = [datePaid, createPaymentDescription.value, customAmount, eventId, createPaymentParticipant.value, expenseId, paymentStatus[0].value];
                await createPayment(data);
                await calculatePayments(expenseId);
                await hidePaymentForm();
                await showSuccessMessage("Payment successfully updated!", null);
                await removeAllChildren();
                await syncAllTables();
            }

        });
    }

}

app();


async function hideAllCreateButtons(): Promise<void> {
    if (eventId) {
        try {
            const event: string | any[] = await api.queryDatabase(EVENT_QUERY.SELECT_EVENT, eventId);
            if (event) {
                if (event[0].eventStatus !== 1) {
                    const createExpenseButton: Element | null = document.querySelector(".create-expense-button");
                    const createParticipantButton: Element | null = document.querySelector(".create-participant-button");
                    const createPaymentButton: Element | null = document.querySelector(".create-payment-button");
                    createExpenseButton?.classList.remove("hidden");
                    createParticipantButton?.classList.remove("hidden");
                    createPaymentButton?.classList.remove("hidden");
                }
            }
        } catch (e) {
            console.log(e);
        }
    }
}

export async function handleBreadcrumbs(): Promise<void> {
    const dashboard: Element | null = document.querySelector(".expense-table");

    if (!dashboard?.classList.contains("hidden")) {
        const breadCrumbList: Element | null = document.querySelector(".breadcrumb-list");
        breadCrumbList?.lastElementChild?.classList.add("hidden");
        const id: any = eventId;
        if (id) {
            const event: Promise<string | any[]> = api.queryDatabase(EVENT_QUERY.SELECT_EVENT, id);
            event.then(
                (item: string): void => {
                    if (breadCrumbList?.lastElementChild) {
                        breadCrumbList.children[2].firstElementChild.children[1].remove();
                        const span: HTMLSpanElement = breadCrumbList.children[2].firstElementChild.appendChild(document.createElement("span"));
                        span.classList.add("breadcrumb-text");
                        span.appendChild(document.createTextNode(item[0]["description"]));
                    }
                },
                (): void => {
                    console.log(Status.NOT_FOUND);
                }
            );
        }
    }
}

async function showEventData(): Promise<void> {
    const totalCostText: Element | any = document.querySelector(".total-cost");
    const totalParticipantsText: Element | any = document.querySelector(".total-participants");
    const totalPaymentsText: Element | any = document.querySelector(".total-payments");
    const id: string | any = eventId;
    if (id) {
        const totalCost: Promise<string> = api.queryDatabase(EXPENSE_QUERY.GET_TOTAL_COST_BY_EVENT_ID, id);
        const totalParticipants: Promise<string> = api.queryDatabase(PARTICIPANT_QUERY.GET_AMOUNT_OF_PARTICIPANTS_BY_EVENT_ID, id);
        const totalPayments: Promise<string> = api.queryDatabase(PAYMENT_QUERY.GET_TOTAL_AMOUNT_OF_PAYMENTS_BY_EVENT_ID, id);
        totalCost.then(
            (item: string | any[]): void => {
                if (typeof item !== "string") {
                    if (item[0].totalCost) {
                        totalCostText.innerHTML = "€" + item[0].totalCost;
                    }
                }
            },
            (): void => {
                console.log("Could not retrieve totalCost!");
            }
        );

        totalParticipants.then(
            (item: string | any[]): void => {
                if (typeof item !== "string") {
                    if (item[0].totalParticipants) {
                        totalParticipantsText.innerHTML = item[0].totalParticipants;
                    }
                }
            },
            (): void => {
                console.log("Could not retrieve totalParticipants!");
            }
        );

        totalPayments.then(
            (item: string | any[]): void => {
                if (typeof item !== "string") {
                    if (item[0].totalPayments) {
                        totalPaymentsText.innerHTML = item[0].totalPayments;
                    }
                }
            },
            (): void => {
                console.log("Could not retrieve totalPayments!");
            }
        );
    }
}

export async function calculatePayments(expense: string | undefined | null): Promise<void> {
    let expenseId: string | any = document.querySelector(".payment-content")?.id;

    if (expense) {
        expenseId = expense;
    }

    let total: number = 0;

    try {
        const expenses: string | any[] = await api.queryDatabase(EXPENSE_QUERY.SELECT_EXPENSE, expenseId);

        if (typeof expenses !== "string") {
            expenses.forEach(item => {
                total = item.totalAmount;
                return;
            });
        } else {
            console.log("Failed to retrieve expense!");
            return;
        }

        if (expenseId) {
            const data: any[] = [eventId, expenseId];
            const payments: string | any[] = await api.queryDatabase(PAYMENT_QUERY.GET_PAYMENTS_BY_EXPENSE_ID, ...data);
            const participants: any = {};

            if (typeof payments !== "string") {
                payments.forEach(item => {
                    participants[item.username] = {id: item.paymentId, amount: item.customAmount};
                });

                // Calculate the total amount paid by all participants
                let totalPaid: number = 0;
                for (const participant in participants) {
                    totalPaid += participants[participant].amount;
                }

                // Calculate the new equal share for both participants
                const numberOfParticipants: number = Object.keys(participants).length;
                const equalShare: number = total / numberOfParticipants;

                // Calculate the adjustment needed for each participant
                for (const participant in participants) {
                    participants[participant].adjustment = equalShare - participants[participant].amount;
                }

                // Update each participant's payment amount and send a notification
                for (const participant in participants) {
                    const newPaymentAmount: number = participants[participant].adjustment;
                    const data: any[] = [newPaymentAmount, participants[participant].id];

                    try {
                        await api.queryDatabase(PAYMENT_QUERY.UPDATE_PAYMENT_AMOUNT, ...data);
                    } catch (error) {
                        console.log("Could not update payment amount!");
                    }
                }
            }
        }
    } catch (error) {
        console.log("Error: An error occurred while processing payments.");
    }
}

async function createPayment(data: any[]): Promise<void> {
    try {
        const updatedPayment: string | any[] = await api.queryDatabase(PAYMENT_QUERY.CREATE_PAYMENT, ...data);

        if (updatedPayment) {
            console.log(Status.OK);
        } else {
            console.log("Failed to create payment!");
        }
    } catch (e) {
        console.log(e);
    }
}

async function editPayment(data: any[]): Promise<void> {
    try {
        data[1] = data[1] === "" ? null : data[1];
        const updatedPayment: string | any[] = await api.queryDatabase(PAYMENT_QUERY.UPDATE_PAYMENT, ...data);

        if (updatedPayment) {
            console.log(Status.OK);
        } else {
            console.log("Failed to update payment!");
        }
    } catch (e) {
        console.log(e);
    }
}

async function editExpense(data: any[]): Promise<void> {
    try {
        data[1] = data[1] === "" ? null : data[1];
        const updatedExpense: string | any[] = await api.queryDatabase(EXPENSE_QUERY.UPDATE_EXPENSE, ...data);

        if (updatedExpense) {
            console.log(Status.OK);
        } else {
            console.log("Failed to update expense!");
        }
    } catch (e) {
        console.log(e);
    }
}

function deleteFunction(this: HTMLElement): void {
    const confirmation: Element | null = document.querySelector(".filter");
    const deleteIcon: Element | null = document.querySelector(".delete-background");
    if (this.classList.contains("expense")) {
        const expenseId: any = this.id;
        const deleteExpense: Promise<string | any[]> = api.queryDatabase(EXPENSE_QUERY.DELETE_EXPENSE, expenseId);

        deleteExpense.then(
            async (): Promise<void> => {
                confirmation?.classList.add("hidden");
                deleteIcon?.classList.add("hidden");
                await removeAllChildren();
                await syncAllTables();
            },
            (): void => {
                console.log("Failed to delete expense!");
            }
        );
    }

    if (this.classList.contains("participant")) {
        const participantId: any = this.id;
        const deleteParticipant: Promise<string | any[]> = api.queryDatabase(PARTICIPANT_QUERY.DELETE_PARTICIPANT, participantId);

        deleteParticipant.then(
            async (): Promise<void> => {
                confirmation?.classList.add("hidden");
                deleteIcon?.classList.add("hidden");
                await removeAllChildren();
                await syncAllTables();
            },
            (): void => {
                console.log("Failed to delete participant!");
            }
        );
    }

    if (this.classList.contains("payment")) {
        const paymentId: any = this.id;
        const deletePayment: Promise<string | any[]> = api.queryDatabase(PAYMENT_QUERY.DELETE_PAYMENT, paymentId);

        deletePayment.then(
            async (): Promise<void> => {
                await calculatePayments(null);
                confirmation?.classList.add("hidden");
                deleteIcon?.classList.add("hidden");
                await removeAllChildren();
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
                let count: number = 0;
                participants.forEach(async (participant: any): Promise<void> => {
                    if (amount) {
                        const cut: number = amount / participantsAmount;
                        const data: any[] = [null, description, cut, eventId, parseFloat(<string>participant), id, 0];
                        createPayments(data);
                    }
                    count++;
                    if (count === participantsAmount) {
                        await callback();
                    }

                });

                async function callback(): Promise<void> {
                    hideExpenseForm();
                    await showSuccessMessage("Successfully created expense!", null);
                    await removeAllChildren();
                    await syncAllTables();
                }
            },
            (): void => {
                console.log("Failed to create expense!");
            }
        );

    } catch (Error) {
        console.log(Error);
    }
}

async function createPayments(data: any[]): Promise<void> {
    try {
        const payment: string | any[] = await api.queryDatabase(PAYMENT_QUERY.CREATE_DEFAULT_PAYMENT, ...data);

        if (payment) {
            hideExpenseForm();
            await showSuccessMessage("Successfully made expense!", null);
        } else {
            console.log("Unsuccessfully made payment");
        }
    } catch (e) {
        console.log(e);
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

export async function syncAllTables(): Promise<void> {
    const tableParticipants: Element | null = document.querySelector(".participant-table-body");
    const tableExpenses: Element | null = document.querySelector(".expense-table-body");
    const expenseId: HTMLButtonElement | any = document.querySelector(".payment-content")?.id;

    await populateParticipantTable(eventId, tableParticipants);
    await addExpensesTable(eventId, tableExpenses);
    if (expenseId) {
        await populatePaymentTable(expenseId, eventId);
    }
    await showEventData();
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

function hideEditExpenseForm(): void {
    const editExpenseForm: Element | null = document.querySelector(".edit-expense");
    editExpenseForm?.classList.add("hidden");
}

function showPaymentForm(): void {

    const paymentContent: Element | null = document.querySelector(".payment-content");
    const expenseId: string | undefined = paymentContent?.id;

    if (expenseId) {
        populatePaymentSelect(expenseId);
    }

    const createPaymentForm: Element | null = document.querySelector(".payment-form");
    createPaymentForm?.classList.remove("hidden");
}

function hidePaymentForm(): void {
    const createPaymentForm: Element | null = document.querySelector(".payment-form");
    createPaymentForm?.classList.add("hidden");
}

function hideEditPaymentForm(): void {
    const editPaymentForm: Element | null = document.querySelector(".edit-payment");
    editPaymentForm?.classList.add("hidden");
}

async function showParticipantForm(): Promise<void> {
    const createPaymentForm: Element | null = document.querySelector(".add-participant");
    await handlePopulateSelects();
    createPaymentForm?.classList.remove("hidden");
}

function hideParticipantForm(): void {
    const createPaymentForm: Element | null = document.querySelector(".add-participant");
    createPaymentForm?.classList.add("hidden");
}

async function handleHeroTab(this: HTMLElement): Promise<void> {
    const dashboard: Element | null = document.querySelector(".dashboard-content");
    const expenseTable: Element | null = document.querySelector(".expense-table");
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
        expenseTable?.classList.remove("hidden");
        dashboard?.classList.remove("hidden");
    } else if (this.classList.contains("payment")) {
        payment?.classList.remove("hidden");
    } else if (this.classList.contains("participants")) {
        expenseTable?.classList.add("hidden");
        dashboard?.classList.remove("hidden");
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
        await showSuccessMessage("Successfully created participant!", null);

        await removeAllChildren();
        await syncAllTables();

    } catch (e) {
        console.log(e);
    }
}

function populatePaymentSelect(expenseId): void {
    const arr: any[] = [eventId, expenseId];
    const getParticipants: Promise<string | any[]> = api.queryDatabase(USER_QUERY.GET_LEFT_OVER_USERS_FROM_EXPENSE, ...arr);

    const paymentSelect: HTMLSelectElement | any = document.querySelector("#payment-participant");
    const paymentChildren: HTMLCollection | undefined = paymentSelect.children;

    if (paymentChildren) {
        Array.from(paymentChildren).forEach(child => {
            child.remove();
        });
    }

    const paymentOption: HTMLOptionElement = paymentSelect.options[paymentSelect.options.length] = new Option("Select an option!", "", false, true);

    paymentOption.setAttribute("disabled", "true");
    paymentOption.setAttribute("selected", "selected");
    paymentOption.setAttribute("hidden", "hidden");

    getParticipants.then(
        (participant: string | any[]): void => {
            if (typeof participant !== "string") {
                participant.forEach(item => {
                    paymentSelect.options[paymentSelect.options.length] = new Option(item.username, item.participantId);
                });
            }
        }
    );
}

function handlePopulateSelects(): void {
    const arr: any[] = [eventId];
    const participants: Promise<string | any[]> = api.queryDatabase(PARTICIPANT_QUERY.SELECT_PARTICIPANT_AND_USER_BY_EVENT, ...arr);
    const getUsers: Promise<string | any[]> = api.queryDatabase(USER_QUERY.GET_USERS_WITHOUT_PARTICIPANT_FOR_EVENT, ...arr);

    const expenseSelect: HTMLSelectElement | any = document.querySelector("#expense-participants");
    const participantSelect: HTMLSelectElement | any = document.querySelector("#participant");

    const expenseChildren: HTMLCollection | undefined = expenseSelect.children;
    const participantChildren: HTMLCollection | undefined = participantSelect.children;

    if (participantChildren) {
        Array.from(participantChildren).forEach(child => {
            child.remove();
        });
    }

    if (expenseChildren) {
        Array.from(expenseChildren).forEach(child => {
            child.remove();
        });
    }

    const expenseOption: HTMLOptionElement = expenseSelect.options[expenseSelect.options.length] = new Option("Select an option!", "", false, true);
    const option: HTMLOptionElement = participantSelect.options[participantSelect.options.length] = new Option("Select an option!", "", false, true);

    expenseOption.setAttribute("disabled", "true");
    expenseOption.setAttribute("selected", "selected");
    expenseOption.setAttribute("hidden", "hidden");

    option.setAttribute("disabled", "true");
    option.setAttribute("selected", "selected");
    option.setAttribute("hidden", "hidden");

    participants.then(
        (participant: string | any[]): void => {
            if (typeof participant !== "string") {
                participant.forEach(item => {
                    expenseSelect.options[expenseSelect.options.length] = new Option(item.username, item.participantId);
                });
            }
        }
    );

    getUsers.then(
        (users: string | any[]): void => {
            if (typeof users !== "string") {
                users.forEach(user => {
                    participantSelect.options[participantSelect.options.length] = new Option(user.username, user.userId);
                });
            }
        }
    );

}

async function closeMessage(): Promise<void> {
    const confirmation: Element | null = document.querySelector(".filter");
    const deleteIcon: Element | null = document.querySelector(".delete-background");
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

    await removeAllChildren();
    await syncAllTables();
}