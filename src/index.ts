import "./hboictcloud-config";

/**
 * Entry point
 */
function app(): void {
    const button: HTMLElement | null = document.querySelector(".faq--question-arrow");
    button?.addEventListener("click", handleClick);

    async function handleClick(this: HTMLElement): Promise<void> {

        let parent:HTMLElement|null = this.parentElement;
        parent?.parentElement?.classList.toggle("is-active");
    }
}

app();
