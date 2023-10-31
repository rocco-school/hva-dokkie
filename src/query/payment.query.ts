export const PAYMENT_QUERY: {
    SELECT_PAYMENTS: string;
    SELECT_PAYMENT: string;
    CREATE_PAYMENT: string;
    CREATE_DEFAULT_PAYMENT: string;
    DELETE_PAYMENT: string;
    UPDATE_PAYMENT: string;
    UPDATE_PAYMENT_AMOUNT: string;
    FIND_PAYMENTS_BY_EVENT_ID: string;
    GET_PAYMENTS_BY_EXPENSE_ID: string;
    GET_TOTAL_AMOUNT_OF_PAYMENTS_BY_EVENT_ID: string;
    GET_TOTAL_PAID_PAYMENTS: string;
    GET_TOTAL_UNPAID_PAYMENTS: string;
} = {
    SELECT_PAYMENTS: "SELECT * FROM payment LIMIT 50",
    SELECT_PAYMENT: "SELECT * FROM payment WHERE paymentId = ?",
    CREATE_PAYMENT: "INSERT INTO payment (datePaid, description, customAmount, eventId, participantId, expenseId, paymentStatus) VALUES(?, ?, ?, ?, ?, ?, ?)",
    CREATE_DEFAULT_PAYMENT: "INSERT INTO payment (datePaid, description, paymentAmount, eventId, participantId, expenseId, paymentStatus) VALUES(?, ?, ?, ?, ?, ?, ?)",
    DELETE_PAYMENT: "DELETE FROM payment WHERE paymentId = ?",
    UPDATE_PAYMENT: "UPDATE payment SET customAmount = ?, datePaid = ?, paymentStatus = ? WHERE paymentId = ?",
    UPDATE_PAYMENT_AMOUNT: "UPDATE payment SET paymentAmount = ? WHERE paymentId = ?",
    FIND_PAYMENTS_BY_EVENT_ID: "SELECT * FROM payment WHERE eventId = ?",
    GET_PAYMENTS_BY_EXPENSE_ID: "SELECT payment.paymentId, payment.datePaid, payment.description, payment.customAmount, payment.paymentAmount, payment.eventId, payment.paymentId, payment.expenseId, payment.paymentStatus, user.userId, user.email, user.username FROM payment INNER JOIN participant ON participant.participantId = payment.participantId INNER JOIN user ON user.userId = participant.userId WHERE payment.eventId = ? AND payment.expenseId = ?",
    GET_TOTAL_AMOUNT_OF_PAYMENTS_BY_EVENT_ID: "SELECT COUNT(*) as totalPayments FROM payment WHERE eventId = ? AND paymentStatus = 0",
    GET_TOTAL_PAID_PAYMENTS: "SELECT SUM(paymentAmount) as totalPaidPayments FROM payment WHERE eventId = ? AND paymentStatus = 1",
    GET_TOTAL_UNPAID_PAYMENTS: "SELECT SUM(paymentAmount) as totalUnpaidPayments FROM payment WHERE eventId = ? AND paymentStatus = 0",
};