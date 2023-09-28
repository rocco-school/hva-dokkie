export const QUERY: {
    SELECT_USER: string;
    SELECT_USERS: string;
    CREATE_USER: string;
    DELETE_USER: string;
    UPDATE_USER: string;
    FIND_USER_BY_EMAIL: string
} = {
    SELECT_USERS: "SELECT * FROM user LIMIT 50",
    SELECT_USER: "SELECT * FROM user WHERE id = ?",
    CREATE_USER: "INSERT INTO user (email, password, username) VALUES(?, ?, ?)",
    UPDATE_USER: "UPDATE user SET first_name = ?, last_name = ?, email = ?, address = ?, phone = ? WHERE id = ?",
    DELETE_USER: "DELETE FROM user WHERE userId = ?",
    FIND_USER_BY_EMAIL: "SELECT * FROM user WHERE email = ?",
};