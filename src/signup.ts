import "./hboictcloud-config";
import {api} from "@hboictcloud/api";
import {QUERY} from "./query/user.query";
import {User} from "./interface/user";

/**
 * Entry point
 */
function app(): void {

    const password:HTMLInputElement = document.querySelector("#password");
    const confirmPassword:HTMLInputElement = document.querySelector("#confirm-password");
    const name:HTMLInputElement = document.querySelector("#name");
    const form:HTMLElement = document.querySelector("#form");
    const email:HTMLInputElement = document.querySelector("#email");

    document.querySelectorAll(".icon-eye").forEach(item => {
        item.addEventListener("click", handleClick);
    });

    async function handleClick(this: HTMLImageElement): Promise<void> {

        const items: Element[] = Array.from(document.querySelectorAll(".icon-eye"));
        this.classList.toggle("open");
        if (this.parentElement.id === "show-password") {
            if (this.classList.contains("open")) {
                password.type = "password";
                this.src = "assets/images/icons/eye-hidden-com.svg";
            } else {
                password.type = "text";
                this.src = "assets/images/icons/eye-open-com.svg";
            }
        }
        if (this.parentElement.id === "show-confirmation-password") {
            if (this.classList.contains("open")) {
                confirmPassword.type = "password";
                this.src = "assets/images/icons/eye-hidden-com.svg";
            } else {
                confirmPassword.type = "text";
                this.src = "assets/images/icons/eye-open-com.svg";
            }
        }
    }

    form.addEventListener("submit", (e:SubmitEvent):void => {
        if (name.value === "") {
            name.setCustomValidity("Name is required");
            stop();
        }
        if (name.value === "") {
            name.setCustomValidity("Name is required");
        }
        if (password.value.length <= 6) {
            password.setCustomValidity("Password must be longer than 6 characters");
        }
        if (password.value.length >= 20) {
            password.setCustomValidity("Password must not be longer than 20 characters");
        }
        if (password.value === "password") {
            password.setCustomValidity("Password cannot be password");
        }
        if (confirmPassword.value !== password.value) {
            confirmPassword.setCustomValidity("Does not match password");
        }

        const data: User = { email: email, password: password, name: name}

        api.queryDatabase(QUERY.CREATE_USER, Object.values(data))

        e.preventDefault();
    });
}

app();
