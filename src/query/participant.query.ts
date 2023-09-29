export const PARTICIPANT_QUERY: {
    SELECT_PARTICIPANTS: string;
    SELECT_PARTICIPANTS_BY_USER: string;
    SELECT_PARTICIPANTS_BY_EVENT: string;
    CREATE_PARTICIPANT: string;
    DELETE_PARTICIPANT: string;
} = {
    SELECT_PARTICIPANTS: "SELECT * FROM participant LIMIT 50",
    SELECT_PARTICIPANTS_BY_USER: "SELECT * FROM participant WHERE userId = ?",
    SELECT_PARTICIPANTS_BY_EVENT: "SELECT * FROM participant WHERE eventId = ?",
    CREATE_PARTICIPANT: "INSERT INTO participant (eventId, name, userId) VALUES(?, ?, ?)",
    DELETE_PARTICIPANT: "DELETE FROM participant WHERE userId = ?"
};