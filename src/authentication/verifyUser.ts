import {session} from "@hboictcloud/api";
import {JWTPayload} from "jose";
import {verify} from "./jsonwebtoken";


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
            window.location.href = "login.html";
        }
    } catch (error) {
        console.log(error);
        window.location.href = "login.html";
    }
}