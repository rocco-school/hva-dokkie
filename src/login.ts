import "./hboictcloud-config";
import {api, session} from "@hboictcloud/api";
import {QUERY} from "./query/user.query";
import bcrypt from "bcryptjs";
import {sign, verify} from "./authentication/jsonwebtoken";
import {User} from "./interface/user";

/**
 * Entry point
 */
async function app(): Promise<void> {

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
                    const inputEmail: (string | any)[] = [email.value];
                    const user: any[] | string = await api.queryDatabase(QUERY.FIND_USER_BY_EMAIL, ...inputEmail);

                    if (user.length === 0) {
                        email.setCustomValidity("This email is not registered!");
                        return;
                    }

                    if (user.length > 0) {
                        const databasePassword: string = user[0].password;
                        const inputPassword: string = password.value.toString();

                        //check if database password is equal to input password
                        bcrypt.compare(inputPassword, databasePassword, function (err: Error | null, result: boolean): void {
                            if (err) {
                                password.setCustomValidity("Password does not match email!");
                            }
                            if (result) {
                                assignToken(user).then(
                                    (): void => {
                                        console.log("Succesfully logged in!");
                                    },
                                    (): void => {
                                        console.log("Login unsuccesful!");
                                    }
                                );
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


async function assignToken(user: any[] | string): Promise<void> {
    const secret: string = __SECRET_KEY__;

    const payload: { id: number, email: string } = {
        id: user[0].userId,
        email: user[0].email,
    };

    const jwpToken: string = (await sign(payload, secret)).valueOf();

    session.set("JWPToken", jwpToken);
}


function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

app();
