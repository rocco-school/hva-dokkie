import "./hboictcloud-config";
import {hashPassword} from "./hash-password";
import {api} from "@hboictcloud/api";
import {USER_QUERY} from "./query/user.query";
import {Status} from "./enum/status.enum";
import {verifyUserRedirect} from "./authentication/verifyUser";
import {delay} from "./components/delay";
import {showSuccessMessage} from "./components/successMessage";
import {closeMenu, openMenu} from "./components/handleMobileNavigation";


/**
 * Entry point
 */
async function app(): Promise<void> {

    // Checks if user is not already logged in if logged in redirects to homepage.
    await verifyUserRedirect("index.html");

    const password: HTMLInputElement | null = document.querySelector("#password");
    const confirmPassword: HTMLInputElement | null = document.querySelector("#confirm-password");
    const name: HTMLInputElement | null = document.querySelector("#name");
    const form: HTMLFormElement | null = document.querySelector("#form");
    const email: HTMLInputElement | null = document.querySelector("#email");
    const validRegex: RegExp = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
    const button: HTMLButtonElement | any = document.querySelector(".submit");
    const customErrorMessage: HTMLButtonElement | null = document.querySelector(".error-message");
    const openMobileMenu: Element | any = document.querySelector(".mobile-menu");
    const closeMobileMenu: Element | any = document.querySelector(".close-menu");
    const mobileNav: Element | any = document.querySelector(".overlay");

    // Handle open mobile nav menu
    openMobileMenu?.addEventListener("click", (): void => {
        openMenu(mobileNav);
    });

    // Handle closing mobile nav menu
    closeMobileMenu?.addEventListener("click", (): void => {
        closeMenu(mobileNav);
    });

    // Show password / Hide password
    document.querySelectorAll(".icon-eye").forEach(item => {
        item.addEventListener("click", handleClick);
    });

    button?.addEventListener("click", buttonClickEvent);

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
                    }
                }
            };

            const validatePassword: (password: HTMLInputElement | null) => void = (password: HTMLInputElement | null): void => {
                if (password) {
                    const passwordLength: number = password.value.length;
                    const passwordValue: string = password.value;

                    if (passwordLength <= 6) {
                        if (customErrorMessage) {
                            customErrorMessage.classList.remove("hidden");
                            customErrorMessage.innerHTML = "Password must be longer than 6 characters";
                        }
                        error = true;
                    } else if (passwordLength >= 20) {
                        if (customErrorMessage) {
                            customErrorMessage.classList.remove("hidden");
                            customErrorMessage.innerHTML = "Password must not be longer than 20 characters";
                        }
                        error = true;
                    } else if (passwordValue === "password") {
                        if (customErrorMessage) {
                            customErrorMessage.classList.remove("hidden");
                            customErrorMessage.innerHTML = "Password cannot be password";
                        }
                        error = true;
                    }
                }
            };

            const validateConfirmPassword: (confirmPassword: HTMLInputElement | null, password: HTMLInputElement | null) => void = (confirmPassword: HTMLInputElement | null, password: HTMLInputElement | null): void => {
                if (confirmPassword && password && confirmPassword.value !== password.value) {
                    if (customErrorMessage) {
                        customErrorMessage.classList.remove("hidden");
                        customErrorMessage.innerHTML = "Password confirmation does not match password";
                    }
                    error = true;
                }
            };

            const validateEmail: (email: HTMLInputElement | null, validRegex: RegExp) => void = async (email: HTMLInputElement | null, validRegex: RegExp): Promise<void> => {
                let emailExists: boolean = false;

                if (email) {

                    // Check database for existing users with input email.
                    const userEmail: any[] = [email.value];
                    const users: Promise<string | any[]> = api.queryDatabase(USER_QUERY.FIND_USER_BY_EMAIL, ...userEmail);

                    await users.then(
                        (user: string | any[]): void => {
                            if (user.length === 0) {
                                emailExists = false;
                            }
                            if (user.length > 0) {
                                emailExists = true;
                            }
                        },
                        (): void => {
                            emailExists = false;
                        }
                    );
                }

                // Checks with RegExp if email is valid.
                if (email && !email.value.match(validRegex)) {
                    if (customErrorMessage) {
                        customErrorMessage.classList.remove("hidden");
                        customErrorMessage.innerHTML = "Invalid email";
                    }
                    error = true;
                } else if (email && emailExists) {
                    if (customErrorMessage) {
                        customErrorMessage.classList.remove("hidden");
                        customErrorMessage.innerHTML = "This email is already registered!";
                    }
                    error = true;
                }
            };

            const inputs: (HTMLInputElement | null)[] = [name, password, confirmPassword, email];

            error = false;

            inputs.forEach((input: HTMLInputElement | null): void => {
                validateInput(input, input?.name + " is required");
            });
            // Validates the input and if its invalid adds an customValidity warning.
            await validatePassword(password);
            await validateConfirmPassword(confirmPassword, password);
            await validateEmail(email, validRegex);

            // Check if all inputs are validated
            const formIsValid: boolean = inputs.every((input: HTMLInputElement | null) => input?.checkValidity());

            if (formIsValid) {
                if (!error) {
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

}

app();

// Function to handle submit button click
async function buttonClickEvent(this: HTMLElement): Promise<void> {
    // Upon button click adds class and then removes it again.
    this.classList.add("active");
    await delay(400);
    this.classList.remove("active");
}

// Function to handle changing password or confirmations-password type on click
async function handleClick(this: HTMLImageElement): Promise<void> {
    const password: HTMLInputElement | null = document.querySelector("#password");
    const confirmPassword: HTMLInputElement | null = document.querySelector("#confirm-password");
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

// Function to handle changing password or confirmation-password icon and type.
function togglePasswordVisibility(input: HTMLInputElement | null, image: HTMLImageElement, hiddenSrc: string, openSrc: string): void {
    if (input) {
        // Get image with class open and change password type to plain text
        // Change the image of the clicked icon.
        const isOpen: boolean = image.classList.contains("open");
        input.type = isOpen ? "password" : "text";
        image.src = isOpen ? hiddenSrc : openSrc;
    }
}

// Function to handle creating new user and redirecting to login page
async function onsubmit(): Promise<void> {
    const password: HTMLInputElement | null = document.querySelector("#password");
    const name: HTMLInputElement | null = document.querySelector("#name");
    const email: HTMLInputElement | null = document.querySelector("#email");
    const form: HTMLInputElement | null = document.querySelector(".container");

    // make database entry with Hashed password.
    if (password) {
        const hashedPassword: Promise<Status | void> = hashPassword(password.value, email?.value, name?.value);
        // Check if Promise was resolved successful
        hashedPassword.then(
            async (): Promise<void> => {
                form?.classList.add("hidden");
                await showSuccessMessage("Successfully signed up", 2000);
                window.location.href = "login.html";
            },
            (): void => {
                console.log("Unsuccessful!");
            }
        );


    }
}