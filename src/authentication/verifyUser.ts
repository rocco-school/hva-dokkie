import {session} from "@hboictcloud/api";
import {JWTPayload} from "jose";
import {verify} from "./jsonwebtoken";


export async function verifyUserRedirect(path: string): Promise<void> {
    try {
        const token: string = session.get("JWPToken");
        const logged: JWTPayload = await verify(token, __SECRET_KEY__);
        if (logged) {
            window.location.href = path;
        }
    } catch (e) {
        console.log(e);
    }
}

export async function verifyUser(): Promise<void> {
    try {
        const token: string = session.get("JWPToken");
        const logged: JWTPayload = await verify(token, __SECRET_KEY__);
        if (!logged) {
            window.location.href = "login.html";
        }
    } catch (error) {
        console.log(error);
        window.location.href = "login.html";
    }
}