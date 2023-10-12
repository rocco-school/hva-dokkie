export const PARTICIPANT_QUERY: {
    SELECT_PARTICIPANTS: string;
    SELECT_PARTICIPANTS_BY_USER: string;
    SELECT_PARTICIPANTS_BY_EVENT: string;
    CREATE_PARTICIPANT: string;
    DELETE_PARTICIPANT: string;
    SELECT_PARTICIPANT_AND_USER_BY_EVENT: string;
} = {
    SELECT_PARTICIPANTS: "SELECT * FROM participant LIMIT 50",
    SELECT_PARTICIPANTS_BY_USER: "SELECT * FROM participant WHERE userId = ?",
    SELECT_PARTICIPANTS_BY_EVENT: "SELECT * FROM participant WHERE eventId = ?",
    CREATE_PARTICIPANT: "INSERT INTO participant (eventId, userId) VALUES(?, ?)",
    DELETE_PARTICIPANT: "DELETE FROM participant WHERE userId = ?",
    SELECT_PARTICIPANT_AND_USER_BY_EVENT: "SELECT participant.participantId, participant.userId, user.email, user.username FROM participant INNER JOIN user ON user.userId = participant.userId WHERE eventId = ?"
};