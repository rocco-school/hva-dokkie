export const PAYMENT_QUERY: {
    SELECT_PAYMENTS: string;
    SELECT_PAYMENT: string;
    CREATE_PAYMENT: string;
    DELETE_PAYMENT: string;
    UPDATE_PAYMENT: string;
    FIND_PAYMENTS_BY_EVENT_ID: string;
    GET_PAYMENTS_BY_EXPENSE_ID: string;
} = {
    SELECT_PAYMENTS: "SELECT * FROM payment LIMIT 50",
    SELECT_PAYMENT: "SELECT * FROM payment WHERE paymentId = ?",
    CREATE_PAYMENT: "INSERT INTO payment (datePaid, description, customAmount, eventId, participantId, expenseId) VALUES(?, ?, ?, ?, ?, ?)",
    DELETE_PAYMENT: "DELETE FROM payment WHERE paymentId = ?",
    UPDATE_PAYMENT: "UPDATE payment SET datePaid = ?, description = ?, amount = ? WHERE paymentId = ?",
    FIND_PAYMENTS_BY_EVENT_ID: "SELECT * FROM payment WHERE eventId = ?",
    GET_PAYMENTS_BY_EXPENSE_ID: "SELECT payment.paymentId, payment.datePaid, payment.description, payment.customAmount, payment.eventId, payment.paymentId, payment.expenseId, user.userId, user.email, user.username FROM payment INNER JOIN participant ON participant.participantId = payment.participantId INNER JOIN user ON user.userId = participant.userId WHERE payment.eventId = ? AND payment.expenseId = ?",
};