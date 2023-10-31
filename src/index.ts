import "./hboictcloud-config";
import {session} from "@hboictcloud/api";
import {JWTPayload} from "jose";
import {verify} from "./authentication/jsonwebtoken";

/**
 * Entry point
 */
async function app(): Promise<void> {
    // Verify user and sets buttons based on verified user
    await verifyUser();


    // Handle start button click
    const button: Element | any = document.querySelector(".start_button");
    button?.addEventListener("click", scrollDown);

    // Handle open mobile nav menu
    const openMobileMenu: Element | any = document.querySelector(".mobile-menu");
    openMobileMenu?.addEventListener("click", openMenu);

    // Handle closing mobile nav menu
    const closeMobileMenu: Element | any = document.querySelector(".close-menu");
    closeMobileMenu?.addEventListener("click", closeMenu);

    // Handle logout event
    document.querySelectorAll(".logout").forEach(item => {
        item.addEventListener("click", loggedOut);
    });

    // Handle closing FAQ by clicking outside of FAQ
    window.onclick = handleClick;

    // Handle FAQ clicked
    document.querySelectorAll(".faq").forEach(item => {
        item.addEventListener("click", handleFAQClick);
    });
}

app();

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

function openMenu(): void {
    const mobileNav: Element | any = document.querySelector(".overlay");
    mobileNav?.classList.add("max-width");
    console.log("done!");
}

function closeMenu(): void {
    const mobileNav: Element | any = document.querySelector(".overlay");
    mobileNav?.classList.remove("max-width");
    console.log("closed!");
}

async function scrollDown(this: HTMLElement): Promise<void> {
    const elem: Element | null = document.querySelector(".faq-container");
    // Scrolls to faq-container Element
    elem?.scrollIntoView({behavior: "smooth", block: "end", inline: "nearest"});
}

async function closeAllFAQ(): Promise<void> {
    // Closes all active FAQ's
    const items: Element[] = Array.from(document.querySelectorAll(".faq"));
    items.forEach((item: Element): void => {
        item.classList.replace("is-active", "faq__height");
    });
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

async function handleClick(event: MouseEvent): Promise<void> {
    const click: EventTarget | any = event.target;

    // Get all FAQ items
    const items: NodeListOf<Element> = document.querySelectorAll(".faq");

    // Check if click is inside any of the FAQ items
    const bool: boolean = Array.from(items).some((item: Element) => item.contains(click));

    if (!bool) {
        await closeAllFAQ();
    }
}

async function loggedOut(this: HTMLElement): Promise<void> {
    // Remove JWTToken From session
    session.remove("JWTToken");
    location.reload();
}

