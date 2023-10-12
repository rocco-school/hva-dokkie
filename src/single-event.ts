import "./hboictcloud-config";
import {api, session} from "@hboictcloud/api";
import {JWTPayload} from "jose";
import {verify} from "./authentication/jsonwebtoken";
import {EVENT_QUERY} from "./query/event.query";
import {v4 as uuidv4} from "uuid";
import {PARTICIPANT_QUERY} from "./query/participant.query";

/**
 * Entry point
 */
let eventId: string = "";

async function app(): Promise<void> {
    await checkURLParams();
    await verifyUser();

    console.log(eventId);

    document.querySelectorAll(".hero-tab").forEach(item => {
        item.addEventListener("click", handleHeroTab);
    });
    document.querySelectorAll(".logout").forEach(item => {
        item.addEventListener("click", loggedOut);
    });

    const createButton: Element | null = document.querySelector(".create-button");
    createButton?.addEventListener("click", showCreatePayment);

    const cancelButton: Element | null = document.querySelector(".cancel");
    cancelButton?.addEventListener("click", hideCreatePayment);


    const form: HTMLFormElement | null = document.querySelector("#form");

    const name: HTMLInputElement | null = document.querySelector("#name");
    const description: HTMLInputElement | null = document.querySelector("#description");
    const amount: HTMLInputElement | null = document.querySelector("#amount");

    if (form) {
        form.addEventListener("submit", async (e: SubmitEvent): Promise<void> => {
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

            const inputs: (HTMLInputElement | null)[] = [description, amount, name];

            inputs.forEach((input: HTMLInputElement | null): void => {
                validateInput(input, input?.name + " is required");
            });

            // Check if all inputs are validated
            const formIsValid: boolean = inputs.every((input: HTMLInputElement | null) => input?.checkValidity());

            if (formIsValid) {
                if (form.checkValidity()) {
                    await createPayment(description?.value, amount?.value, name?.value);
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


function hideCreatePayment(): void {
    const createPaymentForm: Element | null = document.querySelector(".create-form");
    createPaymentForm?.classList.add("hidden");
}

function showCreatePayment(): void {
    const createPaymentForm: Element | null = document.querySelector(".create-form");
    createPaymentForm?.classList.remove("hidden");
}

async function handleHeroTab(this: HTMLElement): Promise<void> {
    const dashboard: Element | null = document.querySelector(".dashboard-content");
    const payment: Element | null = document.querySelector(".payment-content");
    const participants: Element | null = document.querySelector(".participant-content");
    document.querySelectorAll(".hero-tab").forEach(item => {
        item.classList.remove("is-active");
    });
    this.classList.add("is-active");

    document.querySelectorAll(".content").forEach(item => {
        item.classList.add("hidden");
    })
    ;
    if (this.classList.contains("dashboard")) {
        dashboard?.classList.remove("hidden");
    } else if (this.classList.contains("payment")) {
        payment?.classList.remove("hidden");
    } else if (this.classList.contains("participants")) {
        participants?.classList.remove("hidden");
    }
}


async function loggedOut(this: HTMLElement): Promise<void> {
    // Remove JWTToken From session
    session.remove("JWTToken");
    location.reload();
}

async function checkURLParams(): Promise<void> {
    try {
        let params: URLSearchParams = new URLSearchParams(location.search);
        const checkedParam: string | null = params.get("eventId");
        if (checkedParam) {
            eventId = checkedParam;
        }
    } catch (e) {
        console.log(e);
    }
}

async function verifyUser(): Promise<void> {
    try {
        // Get token from users session.
        const token: string = session.get("JWTToken");

        const logged: JWTPayload = await verify(token, __SECRET_KEY__);
        if (!logged) {
            console.log("Invalid JWT token!");
            window.location.href = "index.html";
            return;
        }

        const params: any[] = [eventId, logged.id];
        const verified: string | any[] = await api.queryDatabase(EVENT_QUERY.SELECT_EVENT_BY_EVENT_ID_AND_USER_ID, ...params);
        if (!verified) {
            console.log("User not found!");
            window.location.href = "index.html";
            return;
        }
        console.log("User successfully verified!");

    } catch (error) {
        console.log(error);
        window.location.href = "index.html";
    }
}


async function createPayment(description: string | undefined, amount: string | undefined, name: string | undefined): Promise<void> {

    // const errorMessage: Element | null = document.querySelector(".error-message");
    // const createPaymentForm: Element | null = document.querySelector(".create-form");
    const currentDate: number = Date.now();
    const params: any[] = [currentDate, description, amount, eventId, name];
    try {

        console.log(params);
        const payment: Promise<string | any[]> = api.queryDatabase(PARTICIPANT_QUERY.CREATE_PARTICIPANT, ...params);
        payment.then(
            (): void => {
                console.log(payment);
            },
            (): void => {
                console.log(payment);
                console.log("failed!");
            }
        );
        // Create event inside database
        // const event: Promise<string | any[]> = api.queryDatabase(EVENT_QUERY.CREATE_EVENT, ...params);
        // event.then(
        //     async (): Promise<void> => {
        //         // Get token from Session and check if verified.
        //         const token: string = session.get("JWTToken");
        //         const logged: JWTPayload = await verify(token, __SECRET_KEY__);
        //         // Create participant information with ID from session data
        //         const participantInfo: any[] = [id, name, logged.id];
        //         // Create participant inside the database
        //         const participant: Promise<string | any[]> = api.queryDatabase(PARTICIPANT_QUERY.CREATE_PARTICIPANT, ...participantInfo);
        //
        //         participant.then(
        //             (): void => {
        //                 createEventForm?.classList.add("hidden");
        //                 location.reload();
        //             },
        //             (): void => {
        //                 errorMessage?.classList.remove("hidden");
        //             }
        //         );
        //     }
        // );
    } catch (Error) {
        console.log(Error);
    }
}

app();
