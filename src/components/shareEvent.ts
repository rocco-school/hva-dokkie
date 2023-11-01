import {api} from "@hboictcloud/api";
import {EVENT_QUERY} from "../query/event.query";
import {EXPENSE_QUERY} from "../query/expanse.query";
import {PARTICIPANT_QUERY} from "../query/participant.query";
import {PAYMENT_QUERY} from "../query/payment.query";

/**
 * Share an event over whatsapp with the provided event data
 *
 * @param row - The row of the event of which should be shared.
 * @returns {Promise<void>}
 */
export async function shareEvent(row: HTMLTableRowElement): Promise<void> {
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

            if (getEvent) {
                // Helper function to get event status
                const getStatusEvent: (status: number) => string = (status: number): string => (status === 0 ? "Open" : "Closed");

                event.description = getEvent[0].description;
                event.status = getStatusEvent(getEvent[0].eventStatus);
            }

            event.totalCost = `€${getTotalCost ? getTotalCost[0].totalCost || 0 : 0}`;
            event.totalParticipants = getTotalParticipants ? getTotalParticipants[0].totalParticipants || 0 : 0;
            event.totalPaidPayments = getTotalPaidPayments ? getTotalPaidPayments[0].totalPaidPayments || 0 : 0;
            event.totalUnpaidPayments = getTotalUnpaidPayments ? getTotalUnpaidPayments[0].totalUnpaidPayments || 0 : 0;

            if (getExpenses) {
                // Helper function to get expense status
                const getStatusExpense: (status) => string = (status: number): string => (status === 0 ? "Open" : "Closed");

                // Handle expenses with promises inside
                if (typeof getExpenses !== "string") {
                    event.expenses = await Promise.all(getExpenses.map(async (expense) => {
                        const expenseStatus: string = getStatusExpense(expense.expenseStatus);
                        const arr: any[] = [eventID, expense.expenseId];

                        const getPayments: any | string = await api.queryDatabase(PAYMENT_QUERY.GET_PAYMENTS_BY_EXPENSE_ID, ...arr);

                        // Helper function to get payment status
                        const getStatusPayment: (status) => string = (status): string => (status === 0 ? "Unpaid" : "Paid");

                        const getPaymentAmount: (paymentAmount) => string = (paymentAmount): string => (paymentAmount < 0 ? "To receive: €" + (paymentAmount * -1) : "To pay: €" + paymentAmount);

                        if (typeof getPayments !== "string") {
                            const payments: object = getPayments.map((payment) => ({
                                description: payment.description,
                                customAmount: payment.customAmount,
                                paymentAmount: getPaymentAmount(payment.paymentAmount),
                                participant: payment.username,
                                status: getStatusPayment(payment.paymentStatus),
                            }));

                            return {
                                description: expense.description,
                                totalAmount: expense.totalAmount,
                                status: expenseStatus,
                                payments,
                            };
                        }
                    }));
                }
            }
        } catch (e) {
            console.log(e);
        }
    }

    console.log(event);


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
        - Amount: ${payment.paymentAmount}%0a
        - Participant: ${payment.participant}%0a
        - Status: ${payment.status}%0a
`).join("")}
`).join("")}`;


    // Open WhatsApp with the generated message
    window.open(`https://web.whatsapp.com/send?text=${message}`, "_blank");
}
