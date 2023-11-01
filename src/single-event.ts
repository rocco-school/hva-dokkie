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
import {Status} from "./enum/status.enum";
import {EVENT_QUERY} from "./query/event.query";
import {showSuccessMessage} from "./components/successMessage";
import {closeDeleteMessage} from "./components/deleteMessage";
import {loggedOut} from "./components/handleLogout";
import {closeMenu, openMenu} from "./components/handleMobileNavigation";

// Declare eventId at a higher scope, making it accessible to multiple functions.
let eventId: string | any = "";

/**
 * The main application entry point for the single-event page.
 *
 * This function initializes the single-event page, including event handling,
 * user verification, and other related functionality.
 *
 * @returns {Promise<void>} A Promise that resolves when the application setup is complete.
 */
async function singleEventApp(): Promise<void> {
    // Check URL parameters and extract necessary information.
    await checkURLParams();

    // Verify the user's access to the event using the eventId.
    await verifyUserForEvent(eventId);

    // Synchronize data for all tables.
    await syncAllTables();

    // Hide all create buttons.
    await hideAllCreateButtons();

    // Handle populating select elements.
    await handlePopulateSelects();

    // Show event data on the page.
    await showEventData();

    // Handle breadcrumbs for navigation.
    await handleBreadcrumbs();


    // Page Element Initialization
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

    const openMobileMenu: Element | any = document.querySelector(".mobile-menu");
    const closeMobileMenu: Element | any = document.querySelector(".close-menu");
    const mobileNav: Element | any = document.querySelector(".overlay");

    // Handle open mobile nav menu
    openMobileMenu?.addEventListener("click", (): void => {
        openMenu(mobileNav);
    });

    // Handle closing mobile nav menu
    closeMobileMenu?.addEventListener("click", (): void => {
        closeMenu(mobileNav);
    });

    // Handle expense forms
    showExpense?.addEventListener("click", showExpenseForm);
    hideExpense?.addEventListener("click", hideExpenseForm);
    hideEditExpense?.addEventListener("click", hideEditExpenseForm);

    // Handle participant forms
    showParticipant?.addEventListener("click", showParticipantForm);
    hideParticipant?.addEventListener("click", hideParticipantForm);

    // Handle payments forms
    showPayment?.addEventListener("click", showPaymentForm);
    hidePayment?.addEventListener("click", hidePaymentForm);
    hideEditPayment?.addEventListener("click", hideEditPaymentForm);

    // Handle delete confirmation
    confirmButton?.addEventListener("click", deleteFunction);
    closeMessageButton?.addEventListener("click", closeDeleteMessage);

    document.querySelectorAll(".hero-tab").forEach(item => {
        item.addEventListener("click", handleHeroTab);
    });

    document.querySelectorAll(".logout").forEach(item => {
        item.addEventListener("click", loggedOut);
    });


    // Event listener for the create expense form submission.
    if (expenseForm) {
        expenseForm?.addEventListener("submit", async (e: SubmitEvent): Promise<void> => {
            let error: boolean = false;
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

            // Check if all inputs are validated
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

    // Event listener for the edit expense form submission.
    if (editExpenseForm) {
        editExpenseForm.addEventListener("submit", async (e: SubmitEvent): Promise<void> => {
            let error: boolean;
            const editExpenseStatus: HTMLInputElement | any = editExpenseForm.querySelectorAll("input[name='edit-status']:checked");
            const customErrorMessage: HTMLButtonElement | any = document.querySelector(".edit-expense-message");
            const editExpenseId: HTMLButtonElement | any = document.querySelector(".edit-expense");
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

            // Check if all inputs are validated
            const inputs: (HTMLInputElement | null)[] = [editExpenseStatus[0]];

            error = false;

            for (const input of inputs) {
                await validateInput(input, input?.name + " is required");
            }

            if (!error) {
                customErrorMessage.classList.add("hidden");

                if (!editExpenseAmount.value) {
                    try {
                        // Retrieve expense details from the database for the provided editExpenseId
                        const expense: any[] | string = await api.queryDatabase(EXPENSE_QUERY.SELECT_EXPENSE, editExpenseId.id);
                        if (expense) {
                            // Populate the editExpenseAmount input with the totalAmount from the database
                            editExpenseAmount.value = expense[0].totalAmount;
                        }
                    } catch (e) {
                        console.log(e);
                    }
                }

                // Prepare the data for updating the expense
                const data: any[] = [editExpenseAmount.value, editExpenseStatus[0].value, editExpenseId.id];

                // Perform the update operation for the expense
                await editExpense(data);

                // Calculate payments related to the edited expense
                await calculatePayments(editExpenseId.id);

                // Hide the edit expense form
                await hideEditExpenseForm();

                // Show a success message to the user
                await showSuccessMessage("Expense successfully updated", null);

                // Remove all child elements (possibly a table row) from the DOM
                await removeAllChildren();

                // Synchronize all relevant tables
                await syncAllTables();
            }

        });
    }

    // Participant form validation
    if (participantForm) {
        participantForm?.addEventListener("submit", async (e: SubmitEvent): Promise<void> => {
            let error: boolean;
            e.preventDefault();

            // Initialize error as false by default
            error = false;

            /**
             * Checks if the participant input is empty and sets an error message if needed.
             */
            function checkParticipants(): void {
                if (participant && participant.value === "") {
                    if (customErrorMessage) {
                        customErrorMessage.classList.remove("hidden");
                        customErrorMessage.innerHTML = participant.name + " is required";
                    }
                    error = true;
                }
            }

            // Perform validation to check if the participant input is empty
            await checkParticipants();

            // Check if all inputs are validated and no errors were encountered
            if (!error) {
                // Call the function to create a new participant
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

            // Check if all inputs are validated
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
                // Prepare the data for updating the payment
                const data: any[] = [editPaymentAmount.value, editPaymentDatePaid.value, editPaymentStatus[0].value, editPaymentId.id];
                // Perform the update operation for the payment
                await editPayment(data);
                // Calculate payments related to the edited payment
                await calculatePayments(null);
                // Hide the edit payment form
                await hideEditPaymentForm();
                // Show a success message to the user
                await showSuccessMessage("Payment successfully updated", null);
                // Remove all child elements (possibly a table row) from the DOM
                await removeAllChildren();
                // Synchronize all relevant tables
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

            /**
             * Validates the input field and sets a custom validation message if needed.
             * @param {HTMLInputElement | null} input - The input element to validate.
             * @param {string} errorMessage - The error message to display if validation fails.
             */
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

            // Check if all inputs are validated
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
                // Perform the create operation for the payment
                await createPayment(data);
                // Calculate payments related to the created payment
                await calculatePayments(expenseId);
                // Hide the edit payment form
                await hidePaymentForm();
                // Show a success message to the user
                await showSuccessMessage("Payment successfully updated!", null);
                // Remove all child elements (possibly a table row) from the DOM
                await removeAllChildren();
                // Synchronize all relevant tables
                await syncAllTables();
            }

        });
    }

}

// Invoke the singleEvent application entry point.
singleEventApp();

/**
 * Function to hide all create buttons when the event is closed.
 *
 * This function checks the status of the event and hides the create buttons for expenses, participants, and payments
 * if the event is closed (eventStatus !== 1).
 *
 * @returns {Promise<void>} A Promise that resolves when the create buttons are hidden or shown.
 */
async function hideAllCreateButtons(): Promise<void> {
    if (eventId) {
        try {
            const event: any | string[] = await api.queryDatabase(EVENT_QUERY.SELECT_EVENT, eventId);
            if (event) {
                if (event[0].eventStatus !== 1) {
                    // Show create buttons for expenses, participants, and payments
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

/**
 * Function to handle page breadcrumbs.
 *
 * This function updates the breadcrumb on the page to display the description of the selected event.
 *
 * @returns {Promise<void>} A Promise that resolves when the breadcrumb is updated.
 */
export async function handleBreadcrumbs(): Promise<void> {
    const dashboard: Element | null = document.querySelector(".expense-table");

    if (!dashboard?.classList.contains("hidden")) {
        const breadCrumbList: Element | null = document.querySelector(".breadcrumb-list");
        breadCrumbList?.lastElementChild?.classList.add("hidden");
        const id: any = eventId;

        if (id) {
            // Query the database to retrieve event details
            const event: Promise<string | any[]> = api.queryDatabase(EVENT_QUERY.SELECT_EVENT, id);

            event.then(
                (item: string): void => {
                    if (breadCrumbList?.lastElementChild) {
                        // Remove the existing breadcrumb text
                        breadCrumbList.children[2].firstElementChild.children[1].remove();

                        // Create a new span for the breadcrumb text and set the event description
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

/**
 * Function to display event data in dashboard widgets.
 *
 * This function retrieves and displays event data in dashboard widgets, such as total cost, total participants, and total payments.
 *
 * @returns {Promise<void>} A Promise that resolves when the data is displayed in the widgets.
 */
async function showEventData(): Promise<void> {
    // Query selectors to access dashboard widgets
    const totalCostText: Element | any = document.querySelector(".total-cost");
    const totalParticipantsText: Element | any = document.querySelector(".total-participants");
    const totalPaymentsText: Element | any = document.querySelector(".total-payments");

    const id: string | any = eventId;

    if (id) {
        // Query the database to retrieve total cost, total participants, and total payments for the event
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


/**
 * Function to calculate payments for expenses.
 *
 * This function calculates payments for expenses by adjusting participants' payment amounts to equalize the shares.
 *
 * @param {string | undefined | null} expense - The ID of the expense for which to calculate payments.
 * @returns {Promise<void>} A Promise that resolves when the payments are calculated.
 */
export async function calculatePayments(expense: string | undefined | null): Promise<void> {
    let expenseId: string | any = document.querySelector(".payment-content")?.id;

    if (expense) {
        expenseId = expense;
    }

    let total: number = 0;

    try {
        // Retrieve the selected expense data
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

            // Retrieve payments related to the selected expense
            const payments: string | any[] = await api.queryDatabase(PAYMENT_QUERY.GET_PAYMENTS_BY_EXPENSE_ID, ...data);
            const participants: any = {};

            if (typeof payments !== "string") {
                payments.forEach(item => {
                    participants[item.username] = { id: item.paymentId, amount: item.customAmount };
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

/**
 * Function to create a payment entry in the database.
 *
 * This function creates a new payment entry in the database using the provided data.
 *
 * @param {any[]} data - An array of data needed to create the payment entry.
 * @returns {Promise<void>} A Promise that resolves when the payment is successfully created.
 */
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

/**
 * Function to edit an existing payment entry in the database.
 *
 * This function updates an existing payment entry in the database using the provided data.
 *
 * @param {any[]} data - An array of data needed to update the payment entry.
 * @returns {Promise<void>} A Promise that resolves when the payment is successfully updated.
 */
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

/**
 * Function to edit an existing expense entry in the database.
 *
 * This function updates an existing expense entry in the database using the provided data.
 *
 * @param {any[]} data - An array of data needed to update the expense entry.
 * @returns {Promise<void>} A Promise that resolves when the expense is successfully updated.
 */
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

/**
 * Function to handle the deletion of an expense, participant, or payment entry in the database.
 *
 * This function deletes an expense, participant, or payment entry in the database based on the clicked element's class.
 *
 * @returns {void}
 */
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

/**
 * Function to handle creating an expense entry and related payments.
 *
 * This function creates an expense entry in the database and distributes the cost among participants, creating payment entries.
 *
 * @param {string} description - The description of the expense.
 * @param {number} amount - The total cost of the expense.
 * @param {any[]} participants - An array of participants for the expense.
 * @returns {Promise<void>}
 */
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
                        await createPayments(data);
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

/**
 * Function to handle creating default payment entries for an expense.
 *
 * This function creates default payment entries for participants of an expense.
 *
 * @param {any[]} data - An array of data to create payment entries.
 * @returns {Promise<void>}
 */
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

/**
 * Function to synchronize all tables (Expenses, Participants, Payments, and Widget).
 *
 * This function updates and synchronizes the display of the Expenses, Participants,
 * and Payments tables, as well as the Widget showing event data.
 *
 * @returns {Promise<void>}
 */
export async function syncAllTables(): Promise<void> {
    const tableParticipants: Element | null = document.querySelector(".participant-table-body");
    const tableExpenses: Element | null = document.querySelector(".expense-table-body");
    const expenseId: HTMLButtonElement | any = document.querySelector(".payment-content")?.id;

    // Populate the Participants table with updated data for the current event.
    await populateParticipantTable(eventId, tableParticipants);

    // Add updated Expenses data to the Expenses table for the current event.
    await addExpensesTable(eventId, tableExpenses);

    // If there's a selected expense, populate the Payments table for that expense.
    if (expenseId) {
        await populatePaymentTable(expenseId, eventId);
    }

    // Update and display event data in the Widget.
    await showEventData();
}

/**
 * Function to check and retrieve the `eventId` from the URL parameters.
 *
 * This function parses the URL parameters and retrieves the `eventId` if it exists
 * in the URL. The `eventId` is used to identify the current event for various operations.
 *
 * @returns {Promise<void>}
 */
async function checkURLParams(): Promise<void> {
    try {
        // Create a URLSearchParams object to parse the URL parameters.
        let params: URLSearchParams = new URLSearchParams(location.search);

        // Check if the "eventId" parameter exists in the URL.
        const checkedParam: string | null = params.get("eventId");

        if (checkedParam) {
            // Set the global "eventId" variable to the retrieved value.
            eventId = checkedParam;
        }
    } catch (e) {
        console.log(e);
    }
}

// Function to show the create expense form
function showExpenseForm(): void {
    const createPaymentForm: Element | null = document.querySelector(".create-expense");
    createPaymentForm?.classList.remove("hidden");
}

// Function to hide the create expense form
function hideExpenseForm(): void {
    const createPaymentForm: Element | null = document.querySelector(".create-expense");
    createPaymentForm?.classList.add("hidden");
}

// Function to hide the edit expense form
function hideEditExpenseForm(): void {
    const editExpenseForm: Element | null = document.querySelector(".edit-expense");
    editExpenseForm?.classList.add("hidden");
}

// Function to show the create payment form
function showPaymentForm(): void {
    const paymentContent: Element | null = document.querySelector(".payment-content");
    const expenseId: string | undefined = paymentContent?.id;

    // Check if there is a selected expense and populate payment select options if available.
    if (expenseId) {
        populatePaymentSelect(expenseId);
    }

    const createPaymentForm: Element | null = document.querySelector(".payment-form");

    // Display the create payment form by removing the "hidden" class.
    createPaymentForm?.classList.remove("hidden");
}

// Function to hide the create payment form
function hidePaymentForm(): void {
    const createPaymentForm: Element | null = document.querySelector(".payment-form");
    createPaymentForm?.classList.add("hidden");
}

// Function to hide the edit payment form
function hideEditPaymentForm(): void {
    const editPaymentForm: Element | null = document.querySelector(".edit-payment");
    editPaymentForm?.classList.add("hidden");
}

// Function to show the add participant form
async function showParticipantForm(): Promise<void> {
    const createPaymentForm: Element | null = document.querySelector(".add-participant");
    await handlePopulateSelects();
    createPaymentForm?.classList.remove("hidden");
}

// Function to hide the add participant form
function hideParticipantForm(): void {
    const createPaymentForm: Element | null = document.querySelector(".add-participant");
    createPaymentForm?.classList.add("hidden");
}

/**
 * Function to handle tab navigation on the single-event detail page.
 *
 * This function is responsible for handling tab navigation on the single-event detail page.
 * It shows and hides content based on the selected tab and updates the tab's visual state.
 */
async function handleHeroTab(this: HTMLElement): Promise<void> {
    const dashboard: Element | null = document.querySelector(".dashboard-content");
    const expenseTable: Element | null = document.querySelector(".expense-table");
    const payment: Element | null = document.querySelector(".payment-content");
    const participants: Element | null = document.querySelector(".participant-content");

    // Remove the "is-active" class from all hero tabs.
    document.querySelectorAll(".hero-tab").forEach(item => {
        item.classList.remove("is-active");
    });

    // Add the "is-active" class to the selected hero tab.
    this.classList.add("is-active");

    // Hide all content sections by adding the "hidden" class.
    document.querySelectorAll(".content").forEach(item => {
        item.classList.add("hidden");
    });

    // Show content sections based on the selected tab.
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

/**
 * Function to handle adding a new participant to an event.
 *
 * This function adds a new participant to the specified event and updates the UI accordingly.
 *
 * @param {any} participant - The participant to be added.
 * @returns {Promise<void>} A Promise that resolves once the participant is successfully added.
 */
async function createParticipant(participant: any): Promise<void> {
    try {
        // Prepare data for creating a new participant.
        const data: any[] = [eventId, participant.value];

        // Attempt to create the new participant in the database.
        const newParticipant: string | any[] = await api.queryDatabase(PARTICIPANT_QUERY.CREATE_PARTICIPANT, ...data);

        // Check if the participant creation was successful.
        if (!newParticipant) {
            console.log("Unsuccessful!");
            return;
        }

        // Hide the participant form and display a success message.
        hideParticipantForm();
        await showSuccessMessage("Successfully created participant!", null);

        // Refresh the UI by removing all child elements and syncing tables.
        await removeAllChildren();
        await syncAllTables();
    } catch (e) {
        console.log(e);
    }
}


/**
 * Function to populate the payment participants select dropdown based on the given expense ID.
 *
 * This function fetches participants associated with the expense and populates the payment participants select dropdown.
 *
 * @param {string} expenseId - The ID of the expense for which participants will be added to the select dropdown.
 */
function populatePaymentSelect(expenseId: string): void {
    // Prepare the query parameters for fetching participants.
    const arr: any[] = [eventId, expenseId];

    // Query the database to get the participants left to pay for the expense.
    const getParticipants: Promise<string | any[]> = api.queryDatabase(USER_QUERY.GET_LEFT_OVER_USERS_FROM_EXPENSE, ...arr);

    // Get a reference to the payment participant select element.
    const paymentSelect: HTMLSelectElement | any = document.querySelector("#payment-participant");

    // Get the children (options) of the select element.
    const paymentChildren: HTMLCollection | undefined = paymentSelect.children;

    // Clear existing options in the select element.
    if (paymentChildren) {
        Array.from(paymentChildren).forEach(child => {
            child.remove();
        });
    }

    // Create an initial disabled and selected option.
    const paymentOption: HTMLOptionElement = paymentSelect.options[paymentSelect.options.length] = new Option("Select an option!", "", false, true);
    paymentOption.setAttribute("disabled", "true");
    paymentOption.setAttribute("selected", "selected");
    paymentOption.setAttribute("hidden", "hidden");

    // Fetch and populate participants based on the database query.
    getParticipants.then(
        (participants: string | any[]): void => {
            if (typeof participants !== "string") {
                participants.forEach(item => {
                    paymentSelect.options[paymentSelect.options.length] = new Option(item.username, item.participantId);
                });
            }
        }
    );
}

/**
 * Function to populate select dropdowns for participants and expenses based on event data.
 *
 * This function fetches participants and users without participants for the event
 * and populates the respective select dropdowns.
 */
function handlePopulateSelects(): void {
    // Prepare query parameters to fetch participants and users.
    const arr: any[] = [eventId];

    // Query the database to get participants (users with participants) for the event.
    const participants: Promise<string | any[]> = api.queryDatabase(PARTICIPANT_QUERY.SELECT_PARTICIPANT_AND_USER_BY_EVENT, ...arr);

    // Query the database to get users without participants for the event.
    const getUsers: Promise<string | any[]> = api.queryDatabase(USER_QUERY.GET_USERS_WITHOUT_PARTICIPANT_FOR_EVENT, ...arr);

    // Get references to the expense and participant select elements.
    const expenseSelect: HTMLSelectElement | any = document.querySelector("#expense-participants");
    const participantSelect: HTMLSelectElement | any = document.querySelector("#participant");

    // Get the children (options) of the select elements.
    const expenseChildren: HTMLCollection | undefined = expenseSelect.children;
    const participantChildren: HTMLCollection | undefined = participantSelect.children;

    // Clear existing options in the select elements.
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

    // Create initial disabled and selected options for the select elements.
    const expenseOption: HTMLOptionElement = expenseSelect.options[expenseSelect.options.length] = new Option("Select an option!", "", false, true);
    const option: HTMLOptionElement = participantSelect.options[participantSelect.options.length] = new Option("Select an option!", "", false, true);

    expenseOption.setAttribute("disabled", "true");
    expenseOption.setAttribute("selected", "selected");
    expenseOption.setAttribute("hidden", "hidden");

    option.setAttribute("disabled", "true");
    option.setAttribute("selected", "selected");
    option.setAttribute("hidden", "hidden");

    // Fetch and populate participants in the expense select dropdown.
    participants.then(
        (participant: string | any[]): void => {
            if (typeof participant !== "string") {
                participant.forEach(item => {
                    expenseSelect.options[expenseSelect.options.length] = new Option(item.username, item.participantId);
                });
            }
        }
    );

    // Fetch and populate users without participants in the participant select dropdown.
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