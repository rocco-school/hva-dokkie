import "./hboictcloud-config";
import {api, session} from "@hboictcloud/api";
import {USER_QUERY} from "./query/user.query";
import bcrypt from "bcryptjs";
import {sign} from "./authentication/jsonwebtoken";
import {verifyUserRedirect} from "./authentication/verifyUser";

/**
 * Entry point
 */
async function app(): Promise<void> {
    // Checks if user is not already logged in if logged in redirects to homepage.
    await verifyUserRedirect("index.html");

    const password: HTMLInputElement | null = document.querySelector("#password");
    const form: HTMLFormElement | null = document.querySelector("#form");
    const email: HTMLInputElement | null = document.querySelector("#email");
    const button: HTMLElement | null = document.querySelector(".submit");
    const customErrorMessage: HTMLElement | null = document.querySelector(".error-message");

    if (form) {
        form.addEventListener("submit", async (e: SubmitEvent): Promise<void> => {
            let error: boolean = false;

            e.preventDefault();

            const validateInput: (input: (HTMLInputElement | null), errorMessage: string) => void = (input: HTMLInputElement | null, errorMessage: string): void => {
                if (input && input.value === "") {
                    if (customErrorMessage) {
                        customErrorMessage.classList.remove("hidden");
                        customErrorMessage.innerHTML = errorMessage;
                    }
                    error = true;
                } else {
                    if (input) {
                        if (customErrorMessage) {
                            customErrorMessage.classList.add("hidden");
                        }
                        error = false;
                    }
                }
            };

            const validate: (password: HTMLInputElement | null, email: HTMLInputElement | null) => void = async (password: HTMLInputElement | any, email: HTMLInputElement | any): Promise<void> => {
                if (password?.value && email?.value) {
                    if (customErrorMessage) {
                        customErrorMessage.classList.add("hidden");
                        error = false;
                    }
                    // Check database for existing users with input email.
                    const user: any[] | string = await api.queryDatabase(USER_QUERY.FIND_USER_BY_EMAIL, email.value);

                    if (user.length === 0) {
                        if (customErrorMessage) {
                            customErrorMessage.classList.remove("hidden");
                            customErrorMessage.innerHTML = "Email or password is incorrect!";
                        }
                        error = true;
                        return;
                    }

                    if (user.length > 0) {
                        const databasePassword: string = user[0].password;
                        const inputPassword: string = password.value.toString();

                        //check if database password is equal to input password
                        bcrypt.compare(inputPassword, databasePassword, function (err: Error | null, result: boolean): void {
                            if (err) {
                                if (customErrorMessage) {
                                    customErrorMessage.classList.remove("hidden");
                                    customErrorMessage.innerHTML = "Email or password is incorrect!";
                                }
                                error = true;
                            }
                            if (result) {
                                assignToken(user).then(
                                    (): void => {
                                        error = false;
                                        console.log("Succesfully logged in!");
                                        window.location.href = "index.html";
                                    },
                                    (): void => {
                                        if (customErrorMessage) {
                                            customErrorMessage.classList.remove("hidden");
                                            customErrorMessage.innerHTML = "Login unsuccessful!";
                                        }
                                        error = true;
                                    }
                                );
                            } else {
                                if (customErrorMessage) {
                                    customErrorMessage.classList.remove("hidden");
                                    customErrorMessage.innerHTML = "Email or password are incorrect!";
                                }
                                error = true;
                            }
                        });
                    }

                }
            };

            // Validates the input and if its invalid adds an customValidity warning.

            const inputs: (HTMLInputElement | null)[] = [password, email];

            inputs.forEach((input: HTMLInputElement | null): void => {
                validateInput(input, input?.name + " is required");
            });

            validate(password, email);

            // Check if all inputs are validated
            const formIsValid: boolean = inputs.every((input: HTMLInputElement | null) => input?.checkValidity());

            if (formIsValid) {
                if (error) {
                    console.log("Form fields valid!");
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

    button?.addEventListener("click", handleClick);

    async function handleClick(this: HTMLElement): Promise<void> {
        // Upon button click adds class and then removes it again.
        this.classList.add("active");
        await delay(400);
        this.classList.remove("active");
    }
}


async function assignToken(user: any[] | string): Promise<void> {
    // Get secret key from env file
    const secret: string = __SECRET_KEY__;

    // Construct payload for JWT
    const payload: { id: number, email: string } = {
        id: user[0].userId,
        email: user[0].email,
    };

    // Generate JWT with payload and secret.
    const jwtToken: string = (await sign(payload, secret)).valueOf();

    // Put JWT inside user session storage
    session.set("JWTToken", jwtToken);
}


function delay(ms: number): Promise<void> {
    // Sets time out with give ms
    return new Promise(resolve => setTimeout(resolve, ms));
}

app();
