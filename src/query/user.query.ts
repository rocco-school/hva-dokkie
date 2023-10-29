    export const USER_QUERY: {
    SELECT_USER: string;
    SELECT_USERS: string;
    CREATE_USER: string;
    DELETE_USER: string;
    UPDATE_USER: string;
    FIND_USER_BY_EMAIL: string
    GET_USERS_WITHOUT_PARTICIPANT_FOR_EVENT: string
    GET_LEFT_OVER_USERS_FROM_EXPENSE: string
} = {
    SELECT_USERS: "SELECT * FROM user LIMIT 50",
    SELECT_USER: "SELECT * FROM user WHERE userId = ?",
    CREATE_USER: "INSERT INTO user (email, password, username) VALUES(?, ?, ?)",
    UPDATE_USER: "UPDATE user SET email = ?, password = ?, username = ? WHERE userId = ?",
    DELETE_USER: "DELETE FROM user WHERE userId = ?",
    FIND_USER_BY_EMAIL: "SELECT * FROM user WHERE email = ?",
    GET_USERS_WITHOUT_PARTICIPANT_FOR_EVENT: "SELECT * FROM user WHERE userId NOT IN (SELECT userId from participant WHERE eventId = ?)",
    GET_LEFT_OVER_USERS_FROM_EXPENSE: "SELECT DISTINCT participant.participantId, user.username FROM user LEFT JOIN participant ON user.userId = participant.userId WHERE participant.eventId = ? AND participant.participantId NOT IN (SELECT DISTINCT payment.participantId FROM payment WHERE payment.expenseId = ?)"
};