import "./hboictcloud-config";
import {api} from "@hboictcloud/api";
import {QUERY} from "./query/user.query";
import bcrypt from "bcryptjs";
import {User} from "./interface/user";

/**
 * Entry point
 */
function app(): void {
    const password: HTMLInputElement | null = document.querySelector("#password");
    const form: HTMLFormElement | null = document.querySelector("#form");
    const email: HTMLInputElement | null = document.querySelector("#email");
    const button: HTMLElement | null = document.querySelector(".submit");

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

            const validate: (password: HTMLInputElement | null, email: HTMLInputElement | null) => void = async (password: HTMLInputElement | null, email: HTMLInputElement | null): Promise<void> => {
                if (password && email) {
                    // Check database for existing users with input email.
                    const inputEmail: string[] = [email.value];
                    const user: string | any[] = await api.queryDatabase(QUERY.FIND_USER_BY_EMAIL, ...inputEmail);
                    if (user.length > 0) {
                        const databasePassword = user[0].password;
                        const inputPassword: string = password.toString();

                        //check if database password is equal to input password
                        bcrypt.compare(inputPassword, databasePassword, function(err: Error | null, result: boolean): void {
                            if (err) {
                                password.setCustomValidity("Password does not match email!");
                            }
                            if (result) {
                                console.log("password checks!");
                            }
                        });
                    }

                }
            };

            const inputs: (HTMLInputElement | null)[] = [password, email];

            inputs.forEach((input: HTMLInputElement | null): void => {
                validateInput(input, input?.name + " is required");
            });
            // Validates the input and if its invalid adds an customValidity warning.
            validate(password, email);

            // Check if all inputs are validated
            const formIsValid: boolean = inputs.every((input: HTMLInputElement | null) => input?.checkValidity());

            if (formIsValid) {
                if (form.checkValidity()) {
                    onsubmit().then();
                }
            } else {
                inputs.forEach((input: HTMLInputElement | null): void => {
                    if (input) {
                        input.addEventListener("input", (): void => {
                            input.setCustomValidity("");
                        });
                    }
                });
            }

        });
    }


    async function onsubmit(): Promise<void> {

        console.log("submit");

    }

    button?.addEventListener("click", handleClick);

    async function handleClick(this: HTMLElement): Promise<void> {
        this.classList.add("active");

        await delay(400);

        this.classList.remove("active");

    }
}

function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

app();
