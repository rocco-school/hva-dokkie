import "./hboictcloud-config";
import {session} from "@hboictcloud/api";
import {JWTPayload} from "jose";
import {verify} from "./authentication/jsonwebtoken";

/**
 * Entry point
 */
async function app(): Promise<void> {

    async function verifyUser(): Promise<void> {
        const secret: string = __SECRET_KEY__;
        const token: string = session.get("JWPToken");
        if (token) {
            try {
                const logged: JWTPayload = await verify(token, secret);
                const logOut: Element | null = document.querySelector(".logout");
                const logIn: Element | null  = document.querySelector(".login");
                const signUp: Element | null  = document.querySelector(".signup");
                if (logged) {
                    logIn?.classList.add("hidden");
                    signUp?.classList.add("hidden");
                    logOut?.classList.remove("hidden");
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


    const logout: Element | null = document.querySelector(".logout");
    logout?.addEventListener("click", loggedOut);

    async function loggedOut(this: HTMLElement): Promise<void> {
        session.remove("JWPToken");
        location.reload();
    }

    async function handleClick(event: MouseEvent): Promise<void> {
        const click: EventTarget | null = event.target;

        const items: NodeListOf<Element> = document.querySelectorAll(".faq");

        const bool: boolean = Array.from(items).some((item: Element) => item.contains(click));

        if (!bool) {
            await closeAllFAQ();
        }
    }

    window.onclick = handleClick;

    document.querySelectorAll(".faq").forEach(item => {
        item.addEventListener("click", handleFAQClick);
    });

    const button: Element | null = document.querySelector(".start_button");
    button?.addEventListener("click", scrollDown);

    async function closeAllFAQ(): Promise<void> {
        const items: Element[] = Array.from(document.querySelectorAll(".faq"));
        items.forEach((item: Element): void => {
            item.classList.replace("is-active", "faq__height");
        });
    }

    async function scrollDown(this: HTMLElement): Promise<void> {
        const elem: Element | null = document.querySelector(".faq-container");
        elem?.scrollIntoView({behavior: "smooth", block: "end", inline: "nearest"});
    }

    async function handleFAQClick(this: HTMLElement): Promise<void> {
        const items: Element[] = Array.from(document.querySelectorAll(".faq"));

        items.forEach((item: Element): void => {
            if (item !== this) {
                item.classList.replace("is-active", "faq__height");
            }
        });

        this.classList.toggle("faq__height");
        this.classList.toggle("is-active");
    }
}

app();
