import "./hboictcloud-config";
import {v4 as uuidv4} from "uuid";
import {
    addExpensesTable,
    populateParticipantTable, populatePaymentTable,
    removeAllChildren
} from "./components/createTable";
import {api, session} from "@hboictcloud/api";
import {verifyUserForEvent} from "./authentication/verifyUser";
import {EXPENSE_QUERY} from "./query/expanse.query";
import {PAYMENT_QUERY} from "./query/payment.query";
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
    await handlePopulateSelects();

    const showExpense: HTMLAnchorElement | any = document.querySelector(".create-expense-button");
    const hideExpense: HTMLAnchorElement | any = document.querySelector(".cancel-create-expense");

    const showParticipant: HTMLAnchorElement | any = document.querySelector(".create-participant-button");
    const hideParticipant: HTMLAnchorElement | any = document.querySelector(".cancel-create-participant");

    const showPayment: HTMLAnchorElement | any = document.querySelector(".create-payment-button");
    const hidePayment: HTMLAnchorElement | any = document.querySelector(".cancel-create-payment");

    const hideEditPayment: HTMLAnchorElement | any = document.querySelector(".cancel-edit-payment");

    const expenseDescription: HTMLInputElement | any = document.querySelector("#description");
    const expenseAmount: HTMLInputElement | any = document.querySelector("#amount");
    const expenseParticipants: HTMLInputElement | any = document.querySelector("#expense-participants");

    const editPaymentAmount: HTMLInputElement | any = document.querySelector("#edit-payment-amount");
    const editPaymentDatePaid: HTMLInputElement | any = document.querySelector("#edit-date-paid");

    const participant: HTMLInputElement | any = document.querySelector("#participant");

    const expenseForm: HTMLFormElement | any = document.querySelector("#form");
    const participantForm: HTMLFormElement | any = document.querySelector("#participant-form");


    const editPaymentForm: HTMLFormElement | any = document.querySelector("#edit-payment-form");
    const paymentForm: HTMLFormElement | any = document.querySelector("#payment-form");

    const customErrorMessage: HTMLButtonElement | any = document.querySelector(".error-message");
    const confirmButton: HTMLButtonElement | any = document.querySelector(".continue-button");

    const closeMessageButton: HTMLButtonElement | any = document.querySelector(".close-modal-button");
    const returnButton: HTMLButtonElement | any = document.querySelector(".return");

    confirmButton?.addEventListener("click", deleteFunction);

    showExpense?.addEventListener("click", showExpenseForm);
    hideExpense?.addEventListener("click", hideExpenseForm);

    hideEditPayment?.addEventListener("click", hideEditPaymentForm);

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


            const inputs: (HTMLInputElement | null)[] = [editPaymentAmount, editPaymentStatus[0]];

            error = false;

            for (const input of inputs) {
                await validateInput(input, input?.name + " is required");
            }

            if (!error) {
                customErrorMessage.classList.add("hidden");

                const data: any[] = [editPaymentAmount.value, editPaymentDatePaid.value, editPaymentStatus[0].value, editPaymentId.id];
                await editPayment(data);
                await calculatePayments();
                await hideEditPaymentForm();
                await showSuccessMessage("Payment successfully updated");
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
                await calculatePayments();
                await hidePaymentForm();
                await showSuccessMessage("Payment successfully created!");
                await removeAllChildren();
                await syncAllTables();
            }

        });
    }

}

app();


export async function calculatePayments(): Promise<void> {
    const expenseId: string | any = document.querySelector(".payment-content")?.id;
    let total: number = 0;

    const getExpense: Promise<string | any[]> = api.queryDatabase(EXPENSE_QUERY.SELECT_EXPENSE, expenseId);
    await getExpense.then(
        (expenses: string | any[]): void => {
            if (typeof expenses !== "string") {
                expenses.forEach(item => {
                    total = item.totalAmount;
                    return;
                });
            }
        },
        (): void => {
            console.log("Failed to retrieve expense!");
        }
    );

    if (expenseId) {
        const data: any[] = [eventId, expenseId];
        const getPayments: Promise<string | any[]> = api.queryDatabase(PAYMENT_QUERY.GET_PAYMENTS_BY_EXPENSE_ID, ...data);
        const participants: any = {};
        await getPayments.then(
            (payments: string | any[]): void => {
                if (typeof payments !== "string") {
                    payments.forEach(item => {
                        participants[item.username] = {id: item.paymentId, amount: item.customAmount};
                    });
                }
            },
            (): void => {
                console.log("Failed to retrieve payments!");
            }
        );

        // Update total value.
        for (const participant in participants) {
            total = total - participants[participant].amount;
        }

        // Get Number of people
        const numberOfParticipants: number = Object.keys(participants).length;

        // Get New total divided by number of persons
        const equalRemains: number = total / numberOfParticipants;

        // Update each persons value to new value.
        for (const participant in participants) {
            const newPaymentAmount: number = participants[participant].amount + equalRemains;
            const data: any[] = [newPaymentAmount, participants[participant].id];
            const updatePayment: Promise<string | any[]> = api.queryDatabase(PAYMENT_QUERY.UPDATE_PAYMENT_AMOUNT, ...data);
            updatePayment.then(
                (): void => {
                    console.log("Successfully updated payment amount!");
                },
                (): void => {
                    console.log("Could not update payment amount!");
                }
            );
        }

    }

}

async function createPayment(data: any[]): Promise<void> {
    try {
        const updatedPayment: string | any[] = await api.queryDatabase(PAYMENT_QUERY.CREATE_PAYMENT, ...data);

        if (updatedPayment) {
            console.log("Successfully created payment!");
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
            console.log("Successfully updated payment!");
        } else {
            console.log("Failed to update payment!");
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
                    await showSuccessMessage("Successfully created expense!");
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
            await showSuccessMessage("Successfully made expense!");
        } else {
            console.log("Unsuccessfully made payment");
        }
    } catch (e) {
        console.log(e);
    }


}

async function showSuccessMessage(message: string): Promise<void> {
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

    await delay(1000);

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

    console.log(getParticipants);

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

async function handleReturnClick(): Promise<void> {
    document.querySelector(".hero-tabs")?.classList.remove("hidden");
    document.querySelector(".hero-tabs-underline")?.classList.remove("hidden");
    document.querySelector(".dashboard-content")?.classList.remove("hidden");
    document.querySelector(".payment-content")?.classList.add("hidden");

    await removeAllChildren();
    await syncAllTables();
}