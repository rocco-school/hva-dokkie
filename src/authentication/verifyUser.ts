import {session} from "@hboictcloud/api";
import {JWTPayload} from "jose";
import {verify} from "./jsonwebtoken";

export async function verifyUser(path: string): Promise<void> {
    const secret: string = __SECRET_KEY__;
    const token: string = session.get("JWPToken");
    try {
        const logged: JWTPayload = await verify(token, secret);
        if (logged) {
            window.location.href = path;
        } else {
            window.location.href = "login.html";
        }
    } catch (e) {
        console.log(e);
    }
}