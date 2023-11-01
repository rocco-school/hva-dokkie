import "../hboictcloud-config";
import {session} from "@hboictcloud/api";


/**
 * Removes JWTToken from session upon
 *
 * @returns {Promise<void>} A Promise that resolves after the specified delay.
 */
export async function loggedOut(this: HTMLElement): Promise<void> {
    // Remove JWTToken From session
    session.remove("JWTToken");
    location.reload();
}