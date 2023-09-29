export const EVENT_QUERY: {
    SELECT_EVENT: string;
    SELECT_EVENTS: string;
    CREATE_EVENT: string;
    DELETE_EVENT: string;
    UPDATE_EVENT: string
    SELECT_EVENTS_BY_USER: string
} = {
    SELECT_EVENTS: "SELECT * FROM event LIMIT 50",
    SELECT_EVENT: "SELECT * FROM event WHERE eventId = ?",
    CREATE_EVENT: "INSERT INTO event (eventId, description) VALUES(?, ?)",
    UPDATE_EVENT: "UPDATE event SET description = ? WHERE eventId = ?",
    DELETE_EVENT: "DELETE FROM event WHERE eventId = ?",
    SELECT_EVENTS_BY_USER: "SELECT event.eventId, event.description, event.dateCreated FROM participant INNER JOIN event ON participant.eventId = event.eventId WHERE userId = ?"
};