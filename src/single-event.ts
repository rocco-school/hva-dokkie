import "./hboictcloud-config";
import {api, session} from "@hboictcloud/api";
import {JWTPayload} from "jose";
import {verify} from "./authentication/jsonwebtoken";
import {EVENT_QUERY} from "./query/event.query";

/**
 * Entry point
 */
let eventId: string = "";

async function app(): Promise<void> {

    await checkURLParams();
    await verifyUser();


    console.log(eventId);


    document.querySelectorAll(".logout").forEach(item => {
        item.addEventListener("click", loggedOut);
    });

}

async function loggedOut(this: HTMLElement): Promise<void> {
    // Remove JWTToken From session
    session.remove("JWTToken");
    location.reload();
}

async function checkURLParams(): Promise<void> {
    try {
        let params: URLSearchParams = new URLSearchParams(location.search);
        const checkedParam: string | null = params.get("eventId");
        if (checkedParam) {
            eventId = checkedParam;
        }
    } catch (e) {
        console.log(e);
    }
}

async function verifyUser(): Promise<void> {
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
        console.log("User successfully verified!");

    } catch (error) {
        console.log(error);
        window.location.href = "index.html";
    }
}

app();
