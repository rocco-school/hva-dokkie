import "./hboictcloud-config";
import {hashPassword} from "./hash-password";
import {api} from "@hboictcloud/api";
import {QUERY} from "./query/user.query";
import {Status} from "./enum/status.enum";
import {verifyUserRedirect} from "./authentication/verifyUser";


/**
 * Entry point
 */
async function app(): Promise<void> {

    await verifyUserRedirect("index.html");

    const password: HTMLInputElement | null = document.querySelector("#password");
    const confirmPassword: HTMLInputElement | null = document.querySelector("#confirm-password");
    const name: HTMLInputElement | null = document.querySelector("#name");
    const form: HTMLFormElement | null = document.querySelector("#form");
    const email: HTMLInputElement | null = document.querySelector("#email");
    const validRegex: RegExp = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
    const button: HTMLButtonElement | null = document.querySelector(".submit");


    document.querySelectorAll(".icon-eye").forEach(item => {
        item.addEventListener("click", handleClick);
    });

    button?.addEventListener("click", buttonClicked);

    async function buttonClicked(this: HTMLElement): Promise<void> {
        // Upon button click adds class and then removes it again.
        this.classList.add("active");
        await delay(400);
        this.classList.remove("active");
    }

    async function handleClick(this: HTMLImageElement): Promise<void> {
        this.classList.toggle("open");

        const parentElementId: string | undefined = this.parentElement?.id;

        // Check what the parentID is if it checks call function.
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
            // Get image with class open and change password type to plain text
            // Change the image of the clicked icon.
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

            const validateEmail: (email: HTMLInputElement | null, validRegex: RegExp) => void = async (email: HTMLInputElement | null, validRegex: RegExp): Promise<void> => {
                let emailExists: boolean = false;

                if (email) {

                    // Check database for existing users with input email.
                    const userEmail: string[] = [email.value];
                    const user: Promise<string | any[]> = api.queryDatabase(QUERY.FIND_USER_BY_EMAIL, ...userEmail);

                    try {
                        await user;
                        emailExists = true;
                    } catch (error) {
                        emailExists = false;
                    }
                }
                // Checks with RegExp if email is valid.
                if (email && !email.value.match(validRegex)) {
                    email.setCustomValidity("Invalid email");
                } else if (email && emailExists) {
                    email.setCustomValidity("This email is already registered!");
                } else {
                    if (email) {
                        email.setCustomValidity("");
                    }
                }
            };

            const inputs: (HTMLInputElement | null)[] = [name, password, confirmPassword, email];


            inputs.forEach((input: HTMLInputElement | null): void => {
                validateInput(input, input?.name + " is required");
            });
            // Validates the input and if its invalid adds an customValidity warning.
            validatePassword(password);
            validateConfirmPassword(confirmPassword, password);
            validateEmail(email, validRegex);


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
        // make database entry with Hashed password.
        if (password) {
            const hashedPassword: Promise<Status | void> = hashPassword(password.value, email?.value, name?.value);

            // Check if Promise was resolved successful
            hashedPassword.then(
                (): void => {
                    console.log("Successfull!");
                    window.location.href = "login.html";
                },
                (): void => {
                    console.log("Unsucessfull!");
                }
            );


        }
    }

}

function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

app();
