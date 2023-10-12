export const PAYMENT_QUERY: {
    SELECT_PAYMENTS: string;
    SELECT_PAYMENT: string;
    CREATE_PAYMENT: string;
    DELETE_PAYMENT: string;
    UPDATE_PAYMENT: string;
    FIND_PAYMENTS_BY_EVENT_ID: string
} = {
    SELECT_PAYMENTS: "SELECT * FROM payment LIMIT 50",
    SELECT_PAYMENT: "SELECT * FROM payment WHERE paymentId = ?",
    CREATE_PAYMENT: "INSERT INTO payment (datePaid, description, amount, eventId) VALUES(?, ?, ?, ?)",
    DELETE_PAYMENT: "DELETE FROM payment WHERE paymentId = ?",
    UPDATE_PAYMENT: "UPDATE payment SET datePaid = ?, description = ?, amount = ? WHERE paymentId = ?",
    FIND_PAYMENTS_BY_EVENT_ID: "SELECT * FROM payment WHERE eventId = ?",
};