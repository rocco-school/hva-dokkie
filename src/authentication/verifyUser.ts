import {api, session} from "@hboictcloud/api";
import {JWTPayload} from "jose";
import {verify} from "./jsonwebtoken";
import {EVENT_QUERY} from "../query/event.query";


/**
 * Verify if the user is authenticated by checking their JWT token.
 * If the user is not authenticated, they are redirected to the provided path.
 * @param {string} path - The provided path for this event.
 * @returns {Promise<void>} A Promise that resolves after the specified delay.
 */
export async function verifyUserRedirect(path): Promise<void> {
    try {
        // Get the JWT token from the user's session.
        const token: string = session.get("JWTToken");
        if (token) {
            // Verify the JWT token with the secret key to check if the user is logged in.
            const logged: JWTPayload = await verify(token, __SECRET_KEY__);
            if (logged) {
                window.location.href = path;
            }
        }
    } catch (e) {
        console.log(e);
    }
}


/**
 * Verify if the user is authenticated by checking their JWT token.
 * If the user is not authenticated, they are redirected to the login page.
 * @returns {Promise<void>} A Promise that resolves after the specified delay.
 */
export async function verifyUser(): Promise<void> {
    try {
        // Get the JWT token from the user's session.
        const token: string = session.get("JWTToken");

        // Verify the JWT token with the secret key to check if the user is logged in.
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


/**
 * Verify if the user is authorized to access the specified event.
 * This function checks the user's JWT token, event ID, and user ID to determine authorization.
 * If the user is not authorized, it redirects them to the index page.
 * @param {eventInterface[eventId]} eventId - The unique identifier of the event.
 * @returns {Promise<void>} A Promise that resolves after the specified delay.
 */
export async function verifyUserForEvent(eventId): Promise<void> {
    try {
        // Get token from user's session.
        const token: string = session.get("JWTToken");

        // Verify the JWT token.
        const logged: JWTPayload = await verify(token, __SECRET_KEY__);
        if (!logged) {
            console.log("Invalid JWT token!");
            window.location.href = "index.html";
            return;
        }

        // Prepare parameters for database query.
        const params: any[] = [eventId, logged.id];

        // Query the database to check user authorization for the event.
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

/**
 * Verify if the user is authenticated by checking their JWT token.
 * If the user is not authenticated, they will only get access to log in and signup page.
 * If the user is authorized, they will get access to all pages.
 * @returns {Promise<void>} A Promise that resolves after the specified delay.
 */
export async function verifyUserHomePage(): Promise<void> {
    // Gets Secret key from ENV
    const secret: string = __SECRET_KEY__;
    // Gets token from session
    const token: string = session.get("JWTToken");
    if (token) {
        try {
            // Checks if user is verified with secret and token
            const logged: JWTPayload = await verify(token, secret);

            // gets elements and shows/hides them based on if user verified.

            if (logged) {
                // Add hidden class
                document.querySelectorAll(".login").forEach(item => {
                    item.classList.add("hidden");
                });
                document.querySelectorAll(".signup").forEach(item => {
                    item.classList.add("hidden");
                });

                // Remove hidden class
                document.querySelectorAll(".logout").forEach(item => {
                    item.classList.remove("hidden");
                });
                document.querySelectorAll(".users").forEach(item => {
                    item.classList.remove("hidden");
                });
                document.querySelectorAll(".events").forEach(item => {
                    item.classList.remove("hidden");
                });
            } else {
                document.querySelectorAll(".login").forEach(item => {
                    item.classList.remove("hidden");
                });
                document.querySelectorAll(".signup").forEach(item => {
                    item.classList.remove("hidden");
                });

            }
        } catch (error) {
            console.error("An error occurred:", error);
        }
    }
}