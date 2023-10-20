import {api, session} from "@hboictcloud/api";
import {JWTPayload} from "jose";
import {verify} from "./jsonwebtoken";
import {EVENT_QUERY} from "../query/event.query";


export async function verifyUserRedirect(path: string): Promise<void> {
    try {
        // Get token from users session.
        const token: string = session.get("JWTToken");
        if (token) {
            //verify token with secret key to check if user is logged in.
            const logged: JWTPayload = await verify(token, __SECRET_KEY__);
            if (logged) {
                window.location.href = path;
            }
        }
    } catch (e) {
        console.log(e);
    }
}

export async function verifyUser(): Promise<void> {
    try {
        // Get token from users session.
        const token: string = session.get("JWTToken");
        //verify token with secret key to check if user is logged in.
        const logged: JWTPayload = await verify(token, __SECRET_KEY__);
        if (!logged) {
            console.log("Invalid JWT token!");
            window.location.href = "index.html";
            return;
        }
    } catch (error) {
        console.log(error);
        window.location.href = "login.html";
    }
}


export async function verifyUserForEvent(eventId: string): Promise<void> {
    try {
        // Get token from users session.
        const token: string = session.get("JWTToken");

        const logged: JWTPayload = await verify(token, __SECRET_KEY__);
        if (!logged) {
            console.log("Invalid JWT token!");
            window.location.href = "index.html";
            return;
        }

        const params: any[] = [eventId, logged.id];
        const verified: string | any[] = await api.queryDatabase(EVENT_QUERY.SELECT_EVENT_BY_EVENT_ID_AND_USER_ID, ...params);
        if (!verified) {
            console.log("User not found!");
            window.location.href = "index.html";
            return;
        }

    } catch (error) {
        console.log(error);
        window.location.href = "index.html";
    }
}
