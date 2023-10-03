import "./hboictcloud-config";
import {session} from "@hboictcloud/api";
import {JWTPayload} from "jose";
import {verify} from "./authentication/jsonwebtoken";

/**
 * Entry point
 */
async function app(): Promise<void> {
    // Verify user and sets buttons based on verified user
    async function verifyUser(): Promise<void> {
        // Gets Secret key from ENV
        const secret: string = __SECRET_KEY__;
        // Gets token from session
        const token: string = session.get("JWTToken");
        if (token) {
            try {
                // Checks if user is verified with secret and token
                const logged: JWTPayload = await verify(token, secret);
                // gets elements and shows/hides them based on if user verified.
                const logOut: Element | null = document.querySelector(".logout");
                const logIn: Element | null = document.querySelector(".login");
                const signUp: Element | null = document.querySelector(".signup");
                const events: Element | null = document.querySelector(".events");
                const users: Element | null = document.querySelector(".users");
                if (logged) {
                    logIn?.classList.add("hidden");
                    signUp?.classList.add("hidden");
                    logOut?.classList.remove("hidden");
                    events?.classList.remove("hidden");
                    users?.classList.remove("hidden");
                } else {
                    logIn?.classList.remove("hidden");
                    signUp?.classList.remove("hidden");
                }
            } catch (error) {
                console.error("An error occurred:", error);
            }
        }
    }

    await verifyUser();


    // Handle logout event
    const logout: Element | null = document.querySelector(".logout");
    logout?.addEventListener("click", loggedOut);

    async function loggedOut(this: HTMLElement): Promise<void> {
        // Remove JWTToken From session
        session.remove("JWTToken");
        location.reload();
    }

    async function handleClick(event: MouseEvent): Promise<void> {
        const click: EventTarget | null = event.target;

        // Get all FAQ items
        const items: NodeListOf<Element> = document.querySelectorAll(".faq");

        // Check if click is inside any of the FAQ items
        const bool: boolean = Array.from(items).some((item: Element) => item.contains(click));

        if (!bool) {
            await closeAllFAQ();
        }
    }

    window.onclick = handleClick;

    // Handle FAQ clicked
    document.querySelectorAll(".faq").forEach(item => {
        item.addEventListener("click", handleFAQClick);
    });

    // Handle start button click
    const button: Element | null = document.querySelector(".start_button");
    button?.addEventListener("click", scrollDown);

    async function closeAllFAQ(): Promise<void> {
        // Closes all active FAQ's
        const items: Element[] = Array.from(document.querySelectorAll(".faq"));
        items.forEach((item: Element): void => {
            item.classList.replace("is-active", "faq__height");
        });
    }

    async function scrollDown(this: HTMLElement): Promise<void> {
        const elem: Element | null = document.querySelector(".faq-container");
        // Scrolls to faq-container Element
        elem?.scrollIntoView({behavior: "smooth", block: "end", inline: "nearest"});
    }

    async function handleFAQClick(this: HTMLElement): Promise<void> {
        // Get all FAQ items
        const items: Element[] = Array.from(document.querySelectorAll(".faq"));

        // Replaces all is-active from FAQ to faq__height
        items.forEach((item: Element): void => {
            if (item !== this) {
                item.classList.replace("is-active", "faq__height");
            }
        });

        // Toggles faq_height and is-active on clicked FAQ
        this.classList.toggle("faq__height");
        this.classList.toggle("is-active");
    }
}

app();
