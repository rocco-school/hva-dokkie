import "./hboictcloud-config";

/**
 * Entry point
 */
function app(): void {

    document.querySelectorAll(".faq").forEach(item => {
        item.addEventListener("click", handleClick);
    });

    const button:Element|null = document.querySelector(".start_button");
    button?.addEventListener("click", scrollDown);

    async function scrollDown(this: HTMLElement): Promise<void> {
        const elem:Element|null = document.querySelector(".faq-container");
        elem?.scrollIntoView({ behavior: "smooth", block: "end", inline: "nearest" });
    }
    async function handleClick(this: HTMLElement): Promise<void> {

        document.querySelectorAll(".faq").forEach(item => {
            if (item !== this) {
                item.classList.remove("is-active");
                item.classList.add("faq__height");
            }
        });

        this.classList.toggle("faq__height");
        this.classList.toggle("is-active");
        // let parent:HTMLElement|null = this.parentElement;
        // parent?.parentElement?.classList.toggle("is-active");
    }

}

app();
