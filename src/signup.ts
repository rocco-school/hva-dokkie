import "./hboictcloud-config";

/**
 * Entry point
 */
function app(): void {

    const button: HTMLElement | null = document.querySelector(".submit");
    button?.addEventListener("click", handleClick);

    async function handleClick(this: HTMLElement): Promise<void> {
        this.classList.add("active");

        await delay(400);

        this.classList.remove("active");

        redirect("http://localhost:3000/login.html");

    }
}

const redirect:any = (url:any, asLink:boolean = true) => asLink ? (window.location.href = url) : window.location.replace(url);

function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

app();
