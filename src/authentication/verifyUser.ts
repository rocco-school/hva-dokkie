import {session} from "@hboictcloud/api";
import {JWTPayload} from "jose";
import {verify} from "./jsonwebtoken";

export async function verifyUserRedirect(path: string): Promise<void> {
    const secret: string = __SECRET_KEY__;
    const token: string = session.get("JWPToken");
    try {
        const logged: JWTPayload = await verify(token, secret);
        if (logged) {
            window.location.href = path;
        }
    } catch (e) {
        console.log(e);
    }
}

export async function verifyUser(): Promise<void> {
    const secret: string = __SECRET_KEY__;
    const token: string = session.get("JWPToken");
    try {
        const logged: JWTPayload = await verify(token, secret);
        if (!logged) {
            window.location.href = "login.html";
        }
    } catch (e) {
        console.log(e);
    }
}