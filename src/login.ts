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
                    const user: any[] | string = await api.queryDatabase(USER_QUERY.FIND_USER_BY_EMAIL, ...inputEmail);

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
                                        window.location.href = "index.html";
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
                    console.log("Succesfully logged in!");
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
