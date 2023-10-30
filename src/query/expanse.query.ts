export const EXPENSE_QUERY: {
    SELECT_EXPENSES: string;
    SELECT_EXPENSE: string;
    SELECT_EXPENSES_BY_EVENT: string;
    CREATE_EXPENSE: string;
    UPDATE_EXPENSE: string;
    DELETE_EXPENSE: string;
    GET_TOTAL_COST_BY_EVENT_ID: string;
} = {
    SELECT_EXPENSES: "SELECT * FROM expense LIMIT 50",
    SELECT_EXPENSE: "SELECT * FROM expense WHERE expenseId = ?",
    SELECT_EXPENSES_BY_EVENT: "SELECT * FROM expense WHERE eventId = ?",
    CREATE_EXPENSE: "INSERT INTO expense (expenseId, description, totalAmount, eventId) VALUES(?, ?, ?, ?)",
    UPDATE_EXPENSE: "UPDATE expense SET totalAmount = ?, expenseStatus = ? WHERE expenseId = ?",
    DELETE_EXPENSE: "DELETE FROM expense WHERE expenseId = ?",
    GET_TOTAL_COST_BY_EVENT_ID: "SELECT SUM(totalAmount) as totalCost FROM expense WHERE eventId = ?"
};