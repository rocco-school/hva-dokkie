import "./hboictcloud-config";
import {verifyUserHomePage} from "./authentication/verifyUser";
import {loggedOut} from "./components/handleLogout";
import {closeMenu, openMenu} from "./components/handleMobileNavigation";

/**
 * Entry point
 */
async function app(): Promise<void> {
    // Verify user and sets buttons based on verified user
    await verifyUserHomePage();

    // Handle start button click
    const button: Element | any = document.querySelector(".start_button");
    button?.addEventListener("click", scrollDown);

    const openMobileMenu: Element | any = document.querySelector(".mobile-menu");
    const closeMobileMenu: Element | any = document.querySelector(".close-menu");
    const mobileNav: Element | any = document.querySelector(".overlay");

    // Handle open mobile nav menu
    openMobileMenu?.addEventListener("click", (): void => {
        openMenu(mobileNav);
    });

    // Handle closing mobile nav menu
    closeMobileMenu?.addEventListener("click", (): void => {
        closeMenu(mobileNav);
    });
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

// Function to handle scrolling down to FAQ's
async function scrollDown(this: HTMLElement): Promise<void> {
    const elem: Element | null = document.querySelector(".faq-container");
    // Scrolls to faq-container Element
    elem?.scrollIntoView({behavior: "smooth", block: "end", inline: "nearest"});
}

// Function to handle closing all opened FAQ
async function closeAllFAQ(): Promise<void> {
    // Closes all active FAQ's
    const items: Element[] = Array.from(document.querySelectorAll(".faq"));
    items.forEach((item: Element): void => {
        item.classList.replace("is-active", "faq__height");
    });
}

// Function to handle opening FAQ
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

// Function to handle click outside FAQ to close all opened FAQ
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



