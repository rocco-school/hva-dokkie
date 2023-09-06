import "./hboictcloud-config";
import { url } from "@hboictcloud/api";
import { switchToDutch, switchToEnglish, switchToXX } from "./samples_hboictcloud/localizationTest";
import { getSessionValue, removeSessionValue, setSessionValue } from "./samples_hboictcloud/sessionTest";
import { getUrl, setUrlRedirect, setUrlReplace } from "./samples_hboictcloud/urlTest";
import { runQuery } from "./samples_hboictcloud/queryTest";

/**
 * Entry point
 */
export function app(): void {
    console.log("Hello world from TypeScript!");

    //URL
    document.querySelector("#url")!.innerHTML = getUrl() ?? "Leeg...";

    document.querySelector("#button-url-replace")?.addEventListener("click", function () {
        const value: string = (document.querySelector("#input-url") as HTMLInputElement).value;

        //Pas de URL aan zonder de verversen
        setUrlReplace(value);
    });

    document.querySelector("#button-url-redirect")?.addEventListener("click", function () {
        const value: string = (document.querySelector("#input-url") as HTMLInputElement).value;

        //Pas de URL aan en herlaad de huidige pagina met geschiedenis
        setUrlRedirect(value);
    });

    //Session
    document.querySelector("#session")!.innerHTML = getSessionValue();

    document.querySelector("#button-session-ok")?.addEventListener("click", function () {
        const value: string = (document.querySelector("#input-session") as HTMLInputElement).value;

        setSessionValue(value);

        //Herlaad de huidige pagina met geschiedenis
        url.redirect("");
    });

    document.querySelector("#button-session-reset")?.addEventListener("click", function () {
        removeSessionValue();

        //Herlaad de huidige pagina met geschiedenis
        url.redirect("");
    });

    //Query
    document.querySelector("#button-query")?.addEventListener("click", async function () {
        const value: string = (document.querySelector("#input-query") as HTMLInputElement).value;

        const result: Array<any> = (await runQuery(value)) as Array<any>;

        document.querySelector("#query")!.innerHTML = JSON.stringify(result);
    });

    //Localization
    document.querySelector("#button-localization-english")?.addEventListener("click", function () {
        switchToEnglish();
    });

    document.querySelector("#button-localization-dutch")?.addEventListener("click", function () {
        switchToDutch();
    });

    document.querySelector("#button-xx")?.addEventListener("click", function () {
        switchToXX();
    });
}

app();
