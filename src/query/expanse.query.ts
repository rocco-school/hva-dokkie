export const EXPENSE_QUERY: {
    SELECT_EXPENSES: string;
    SELECT_EXPENSES_BY_EVENT: string;
    CREATE_EXPENSE: string;
    DELETE_EXPENSE: string;
} = {
    SELECT_EXPENSES: "SELECT * FROM expense LIMIT 50",
    SELECT_EXPENSES_BY_EVENT: "SELECT * FROM expense WHERE eventId = ?",
    CREATE_EXPENSE: "INSERT INTO expense (description, totalAmount, eventId) VALUES(?, ?, ?)",
    DELETE_EXPENSE: "DELETE FROM expense WHERE expenseId = ?"
};