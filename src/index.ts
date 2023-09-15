import "./hboictcloud-config";

/**
 * Entry point
 */
function app(): void {

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
