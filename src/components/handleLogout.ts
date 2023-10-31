import "../hboictcloud-config";
import {session} from "@hboictcloud/api";

// Function to handle logging out
export async function loggedOut(this: HTMLElement): Promise<void> {
    // Remove JWTToken From session
    session.remove("JWTToken");
    location.reload();
}