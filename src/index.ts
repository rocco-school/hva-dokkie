import "./hboictcloud-config";

/**
 * Entry point
 */
function app(): void {

    document.querySelectorAll(".faq").forEach(item => {
        item.addEventListener("click", handleClick);
    });

    async function handleClick(this: HTMLElement): Promise<void> {

        document.querySelectorAll(".faq").forEach(item => {
            if (item !== this) {
                item.classList.remove("is-active");
            }
        });

        this.classList.toggle("is-active");
        // let parent:HTMLElement|null = this.parentElement;
        // parent?.parentElement?.classList.toggle("is-active");
    }
}

app();
