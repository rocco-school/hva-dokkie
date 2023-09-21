import "./hboictcloud-config";
import {api, createQueryString, queryDatabase} from "@hboictcloud/api";
import {QUERY} from "./query/user.query";
import {hashPassword} from "./hash-password";
import {hash} from "bcryptjs";


/**
 * Entry point
 */
function app(): void {
    const password: HTMLInputElement | null = document.querySelector("#password");
    const confirmPassword: HTMLInputElement | null = document.querySelector("#confirm-password");
    const name: HTMLInputElement | null = document.querySelector("#name");
    const form: HTMLFormElement | null = document.querySelector("#form");
    const email: HTMLInputElement | null = document.querySelector("#email");

    if (form) {
        form.addEventListener("submit", onsubmit);
    }

    document.querySelectorAll(".icon-eye").forEach(item => {
        item.addEventListener("click", handleClick);
    });

    async function handleClick(this: HTMLImageElement): Promise<void> {
        this.classList.toggle("open");

        const parentElementId: string | undefined = this.parentElement?.id;

        switch (parentElementId) {
            case "show-password":
                if (password) {
                    togglePasswordVisibility(password, this, "assets/images/icons/eye-hidden-com.svg", "assets/images/icons/eye-open-com.svg");
                }
                break;
            case "show-confirmation-password":
                if (confirmPassword) {
                    togglePasswordVisibility(confirmPassword, this, "assets/images/icons/eye-hidden-com.svg", "assets/images/icons/eye-open-com.svg");
                }
                break;
        }
    }

    function togglePasswordVisibility(input: HTMLInputElement | null, image: HTMLImageElement, hiddenSrc: string, openSrc: string): void {
        if (input) {
            const isOpen: boolean = image.classList.contains("open");
            input.type = isOpen ? "password" : "text";
            image.src = isOpen ? hiddenSrc : openSrc;
        }
    }

    if (form) {
        form.addEventListener("submit", (e: SubmitEvent): void => {
            e.preventDefault();

            const validateInput: (input: (HTMLInputElement | null), errorMessage: string) => void = (input: HTMLInputElement | null, errorMessage: string): void => {
                if (input && input.value === "") {
                    input.setCustomValidity(errorMessage);
                } else {
                    if (input) {
                        input.setCustomValidity("");
                    }
                }
            };

            const validatePassword: (password: HTMLInputElement | null) => void = (password: HTMLInputElement | null): void => {
                if (password) {
                    const passwordLength: number = password.value.length;
                    const passwordValue: string = password.value;

                    if (passwordLength <= 6) {
                        password.setCustomValidity("Password must be longer than 6 characters");
                    } else if (passwordLength >= 20) {
                        password.setCustomValidity("Password must not be longer than 20 characters");
                    } else if (passwordValue === "password") {
                        password.setCustomValidity("Password cannot be password");
                    } else {
                        password.setCustomValidity("");
                    }
                }
            };

            const validateConfirmPassword: (confirmPassword: HTMLInputElement | null, password: HTMLInputElement | null) => void = (confirmPassword: HTMLInputElement | null, password: HTMLInputElement | null): void => {
                if (confirmPassword && password && confirmPassword.value !== password.value) {
                    confirmPassword.setCustomValidity("Does not match password");
                } else {
                    if (confirmPassword) {
                        confirmPassword.setCustomValidity("");
                    }
                }
            };

            const validateEmail: (email: HTMLInputElement | null, validRegex: RegExp) => void = (email: HTMLInputElement | null, validRegex: RegExp): void => {
                if (email && !email.value.match(validRegex)) {
                    email.setCustomValidity("Invalid email");
                } else {
                    if (email) {
                        email.setCustomValidity("");
                    }
                }
            };

            const inputs: (HTMLInputElement | null)[] = [name, password, confirmPassword, email];
            const validRegex: RegExp = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;

            inputs.forEach((input: HTMLInputElement | null): void => {
                validateInput(input, input?.name + " is required");
            });

            validatePassword(password);
            validateConfirmPassword(confirmPassword, password);
            validateEmail(email, validRegex);

            inputs.forEach((input) => {
                if (input) {
                    input.addEventListener("input", () => {
                        input.setCustomValidity("");
                    });
                }
            });

            // if (form.checkValidity()) {
            //     form.submit();
            // }
        });
    }


    async function onsubmit(): Promise<void> {
        if (password) {
            const hashedPassword: Promise<string | void> = hashPassword(password.value , email?.value, name?.value);
        }
    }


}

app();
