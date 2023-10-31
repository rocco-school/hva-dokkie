import "../hboictcloud-config";
import {api} from "@hboictcloud/api";
import {PAYMENT_QUERY} from "../query/payment.query";
import {EXPENSE_QUERY} from "../query/expanse.query";
import {PARTICIPANT_QUERY} from "../query/participant.query";
import {EVENT_QUERY} from "../query/event.query";

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

/**
 * Show the payments table and breadcrumb information for a specific expense.
 *
 * @param {HTMLTableRowElement} row - The HTML table row representing the expense.
 * @param {eventInterface[eventId]} eventId - The ID of the event to which the expense belongs.
 * @returns {Promise<void>}
 */
async function showPaymentsTable(row, eventId): Promise<void> {
    // Get the expense ID from the row's attributes
    const expenseId: expenseInterface["expenseId"] = row.getAttribute("id");

    // Hide elements to show the payment content
    document.querySelector(".hero-tabs")?.classList.add("hidden");
    document.querySelector(".hero-tabs-underline")?.classList.add("hidden");
    document.querySelector(".dashboard-content")?.classList.add("hidden");
    const paymentContent: Element | null = document.querySelector(".payment-content");
    const breadCrumbList: Element | null = document.querySelector(".breadcrumb-list");

    if (!eventId) return;

    // Fetch the event details using the provided eventId
    const event: any[] | string = await api.queryDatabase(EVENT_QUERY.SELECT_EVENT, eventId);

    // Check if the response is a string (error) or an array (data)
    if (typeof event === "string") return;

    if (event) {
        // Update the breadcrumb to include the event description
        if (breadCrumbList?.lastElementChild) {
            breadCrumbList.children[2].firstElementChild.children[1].remove();
            const anchorElement: HTMLAnchorElement = breadCrumbList.children[2].firstElementChild.appendChild(document.createElement("a"));
            anchorElement.href = "single-event.html?eventId=" + eventId;
            anchorElement.classList.add("breadcrumb-link");
            anchorElement.appendChild(document.createTextNode(event[0].description));

            breadCrumbList.children[3].classList.remove("hidden");

            // Fetch the expense details using the provided expenseId
            const expense: any[] | string = await api.queryDatabase(EXPENSE_QUERY.SELECT_EXPENSE, expenseId);

            // Check if the response is a string (error) or an array (data)
            if (typeof expense === "string") return;

            if (expense) {
                if (breadCrumbList.children[3].firstElementChild.lastElementChild) {
                    breadCrumbList.children[3].firstElementChild.lastElementChild.innerHTML = expense[0].description;
                }
            }
        }
    }

    if (paymentContent) {
        paymentContent.classList.remove("hidden");
        paymentContent.id = expenseId;
    }

    if (expenseId) {
        // Remove existing payment data and populate the payments table
        await removeAllChildren();
        await populatePaymentTable(expenseId, eventId);
    }
}

/**
 * Display a confirmation dialog for deleting a row (expense, participant, or payment).
 * @param row - The HTML element representing the row to be deleted.
 */
async function showDeleteConfirmation(row: HTMLElement): Promise<void> {
    // Check if row is defined
    if (!row) return;

    // Get the ID of the row (expense, participant, or payment)
    const id: string = row.id;

    // Get references to various HTML elements used in the confirmation dialog
    const confirmation: Element | null = document.querySelector(".filter");
    const deleteIcon: Element | null = document.querySelector(".delete-background");
    const cancelButton: Element | null = document.querySelector(".close-modal-button");
    const confirmButton: Element | null = document.querySelector(".continue-button");
    const message: Element | null = document.querySelector(".message");
    if (confirmButton) {
        confirmButton.id = id;

        // Set appropriate CSS class and confirmation message based on the row type
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

    // Show the confirmation dialog elements
    cancelButton?.classList.remove("hidden");
    confirmation?.classList.remove("hidden");
    deleteIcon?.classList.remove("hidden");

}

/**
 * Add expense data to a table within the provided tableBody element.
 *
 * @param {eventInterface[eventId]} eventId - The ID of the event for which expenses should be added.
 * @param {Element} tableBody - The HTML element where the expense data should be added.
 * @returns {Promise<void>}
 */
export async function addExpensesTable(eventId, tableBody): Promise<void> {
    // Check if eventId is defined
    if (!eventId) return;

    try {
        // Fetch expenses data for the given eventId
        const events: any | string = await api.queryDatabase(EXPENSE_QUERY.SELECT_EXPENSES_BY_EVENT, eventId);

        // Check if the response is a string (error) or an array (data)
        if (typeof events === "string") return;

        // Iterate through each expense and create a table row for it
        for (const expense: any of events) {
            const {expenseStatus, expenseId, description, totalAmount, dateCreated} = expense;
            const tr: HTMLTableRowElement = tableBody?.appendChild(document.createElement("tr"));

            // Determine the status based on expenseStatus
            const status: string = expenseStatus === 0 ? "Open" : "Closed";

            // Format the creation date
            const createdAt: string = dateCreated ? new Date(dateCreated).toUTCString().replace(" GMT", "") : "Unknown";

            if (tr) {
                // Set attributes for the table row
                tr.setAttribute("id", expenseId);
                tr.setAttribute("class", "expense");

                // Helper function to create and append table cells
                const createTableCell: (text) => Text = (text) => tr.appendChild(document.createElement("td")).appendChild(document.createTextNode(text));

                // Create table cells for each expense detail
                createTableCell(expenseId);
                createTableCell(description);
                createTableCell("€" + totalAmount);
                createTableCell(createdAt);
                createTableCell(status);

                // Create Edit and Delete buttons
                const editButton: any = createButton("Edit", "edit-button expense", expenseId, "assets/images/icons/edit.svg");
                const deleteButton: any = createButton("Delete", "delete-button expense", expenseId, "assets/images/icons/delete-color.svg");

                // Append the buttons to the table cell
                const buttonCell: HTMLTableCellElement = tr.appendChild(document.createElement("td"));
                buttonCell.appendChild(editButton);
                buttonCell.appendChild(deleteButton);

                // Disable buttons if expenseStatus is 1 (Closed)
                if (expense.expenseStatus === 1) {
                    editButton.setAttribute("disabled", "disabled");
                    deleteButton.setAttribute("disabled", "disabled");
                }

                // Fetch the event and disable buttons if eventStatus is 1 (Closed)
                const event: any | string = await api.queryDatabase(EVENT_QUERY.SELECT_EVENT, eventId);
                if (event && event[0].eventStatus === 1) {
                    editButton.setAttribute("disabled", "disabled");
                    deleteButton.setAttribute("disabled", "disabled");
                }

                // Add event listeners for clicking on rows and buttons
                tr.addEventListener("click", async function (event: MouseEvent): Promise<void> {
                    const target: HTMLElement = event.target as HTMLElement;

                    if (target.parentElement && target.parentElement.classList.contains("delete-button") ||
                        (target.firstElementChild && target.firstElementChild.classList.contains("delete-button")) ||
                        target.classList.contains("delete-button")) {
                        // Handle delete button click
                        await showDeleteConfirmation(deleteButton);
                    } else if (target.parentElement && target.parentElement.classList.contains("edit-button") ||
                        (target.firstElementChild && target.firstElementChild.classList.contains("edit-button")) ||
                        target.classList.contains("edit-button")) {
                        // Handle edit button click
                        await editRecord(tr);
                    } else {
                        // Handle clicking on the row (showPaymentsTable function)
                        await showPaymentsTable(tr, eventId);
                    }
                });
            }
        }
    } catch (e) {
        console.log(e);
    }
}

/**
 * Add participant data to a table within the provided tableBody element.
 *
 * @param {participantInterface[eventId]} eventId - The ID of the event for which participants should be added.
 * @param {Element} tableBody - The HTML element where the expense data should be added.
 * @returns {Promise<void>}
 */
export async function populateParticipantTable(eventId, tableBody): Promise<void> {
    // Check if eventId is defined
    if (!eventId) return;

    try {
        // Fetch expenses data for the given eventId
        const participants: any | string = await api.queryDatabase(PARTICIPANT_QUERY.SELECT_PARTICIPANT_AND_USER_BY_EVENT, eventId);

        // Check if the response is a string (error) or an array (data)
        if (typeof participants === "string") return;

        // Iterate through each expense and create a table row for it
        for (const participant: any of participants) {
            const {participantId, username, email} = participant;
            const tr: HTMLTableRowElement = tableBody?.appendChild(document.createElement("tr"));

            if (tr) {
                // Set attributes for the table row
                tr.setAttribute("id", participantId);
                tr.setAttribute("class", "participant");

                // Helper function to create and append table cells
                const createTableCell: (text) => Text = (text) => tr.appendChild(document.createElement("td")).appendChild(document.createTextNode(text));

                // Create table cells for each expense detail
                createTableCell(participantId);
                createTableCell(username);
                createTableCell(email);

                // Create Edit and Delete buttons
                const deleteButton: any = createButton("Delete", "delete-button expense", participantId, "assets/images/icons/delete-color.svg");

                // Append the buttons to the table cell
                const buttonCell: HTMLTableCellElement = tr.appendChild(document.createElement("td"));
                buttonCell.appendChild(deleteButton);

                // Fetch the event and disable buttons if eventStatus is 1 (Closed)
                const event: any | string = await api.queryDatabase(EVENT_QUERY.SELECT_EVENT, eventId);
                if (event && event[0].eventStatus === 1) {
                    deleteButton.setAttribute("disabled", "disabled");
                }

                // Add event listeners for clicking on rows and buttons
                tr.addEventListener("click", async function (event: MouseEvent): Promise<void> {
                    const target: HTMLElement = event.target as HTMLElement;

                    if (target.parentElement && target.parentElement.classList.contains("delete-button") ||
                        (target.firstElementChild && target.firstElementChild.classList.contains("delete-button")) ||
                        target.classList.contains("delete-button")) {
                        // Handle delete button click
                        await showDeleteConfirmation(deleteButton);
                    }
                });
            }
        }
    } catch (e) {
        console.log(e);
    }
}

/**
 * Add payments data to a table within the provided tableBody element.
 *
 * @param {paymentInterface[expenseId]} expenseId - The ID of the expense for which payments should be added.
 * @param {paymentInterface[eventId]} eventId - The ID of the event to which the expense belongs.
 * @returns {Promise<void>}
 */
export async function populatePaymentTable(expenseId, eventId): Promise<void> {
    const tableBody: Element | null = document.querySelector(".payment-table-body");

    console.log(tableBody);
    // Check if eventId and expenseId is defined
    if (!eventId) return;
    if (!expenseId) return;
    if (!tableBody) return;

    try {

        // Fetch expenses data for the given eventId
        console.log(expenseId, eventId);
        const params: any[] = [eventId, expenseId];
        const payments: any | string = await api.queryDatabase(PAYMENT_QUERY.GET_PAYMENTS_BY_EXPENSE_ID, ...params);

        // Check if the response is a string (error) or an array (data)
        if (typeof payments === "string") return;

        // Iterate through each expense and create a table row for it
        for (const payment: any of payments) {
            const {
                paymentId,
                description,
                username,
                customAmount,
                paymentAmount,
                paidDate,
                paymentStatus
            } = payment;
            const tr: HTMLTableRowElement = tableBody?.appendChild(document.createElement("tr"));

            // Determine the status based on expenseStatus
            const status: string = paymentStatus === 0 ? "Unpaid" : "Paid";

            // Format the creation date
            const createdAt: string = paidDate ? new Date(paidDate).toUTCString().replace(" GMT", "") : "Unknown";

            if (tr) {
                // Set attributes for the table row
                tr.setAttribute("id", paymentId);
                tr.setAttribute("class", "payment");

                // Helper function to create and append table cells
                const createTableCell: (text) => Text = (text) => tr.appendChild(document.createElement("td")).appendChild(document.createTextNode(text));

                // Determine if the payment is to be received or paid, based on the paymentAmount value
                const payAmount: string = paymentAmount < 0 ? "To receive: €" + (paymentAmount * -1) : "To pay: €" + paymentAmount;

                // Create table cells for each expense detail
                createTableCell(paymentId);
                createTableCell(description);
                createTableCell(username);
                createTableCell("€" + customAmount);
                createTableCell(payAmount);
                createTableCell(createdAt);
                createTableCell(status);

                // Create Edit and Delete buttons
                const editButton: any = createButton("Edit", "edit-button expense", expenseId, "assets/images/icons/edit.svg");
                const deleteButton: any = createButton("Delete", "delete-button expense", expenseId, "assets/images/icons/delete-color.svg");

                // Append the buttons to the table cell
                const buttonCell: HTMLTableCellElement = tr.appendChild(document.createElement("td"));
                buttonCell.appendChild(editButton);
                buttonCell.appendChild(deleteButton);

                const expense: any | string = await api.queryDatabase(EXPENSE_QUERY.SELECT_EXPENSE, expenseId);
                if (expense) {
                    // Disable buttons if expenseStatus is 1 (Closed)
                    if (expense.expenseStatus === 1) {
                        editButton.setAttribute("disabled", "disabled");
                        deleteButton.setAttribute("disabled", "disabled");
                    }
                }

                // Fetch the event and disable buttons if eventStatus is 1 (Closed)
                const event: any | string = await api.queryDatabase(EVENT_QUERY.SELECT_EVENT, eventId);
                if (event && event[0].eventStatus === 1) {
                    editButton.setAttribute("disabled", "disabled");
                    deleteButton.setAttribute("disabled", "disabled");
                }

                // Add event listeners for clicking on rows and buttons
                tr.addEventListener("click", async function (event: MouseEvent): Promise<void> {
                    const target: HTMLElement = event.target as HTMLElement;

                    if (target.parentElement && target.parentElement.classList.contains("delete-button") ||
                        (target.firstElementChild && target.firstElementChild.classList.contains("delete-button")) ||
                        target.classList.contains("delete-button")) {
                        // Handle delete button click
                        await showDeleteConfirmation(deleteButton);
                    } else {
                        // Handle edit button click
                        await editRecord(tr);
                    }
                });
            }
        }
    } catch (e) {
        console.log(e);
    }
}

/**
 * Create an HTML button element with specified text, classes, ID, and image.
 *
 * @param {string} text - The text displayed on the button.
 * @param {string} className - The CSS classes to apply to the button.
 * @param {string} id - The ID attribute of the button.
 * @param {string} imageSrc - The URL for an associated image.
 * @returns {HTMLButtonElement} - The created button element.
 */
const createButton: (text, className, id, imageSrc) => HTMLButtonElement = (text, className, id, imageSrc) => {
    // Split the provided classNames string into an array
    const classes: string[] = className.replace(/\s+/g, "  ").split(" ");

    // Create an HTML button element
    const button: HTMLButtonElement = document.createElement("button");

    // Add each class from the array to the button element
    for (const item: any in classes) {
        if (!classes[item]) continue;
        button.classList.add(classes[item]);
    }

    // Set the ID and inner HTML of the button
    button.id = id;
    button.innerHTML = `<img src='${imageSrc}' alt='${text}' class='icon-edit'><span>${text}</span>`;

    return button;
};
