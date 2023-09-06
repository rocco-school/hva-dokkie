import { api } from "@hboictcloud/api";

try {
    //TODO: Pas het bestand .env en .env.production aan met de gegevens van HBO-ICT.Cloud
    api.configure({
        url: "https://api.hbo-ict.cloud",
        apiKey: __HBOICTCLOUD_APIKEY__,
        database: __HBOICTCLOUD_DATABASE__,
        environment: "live",
    });
} catch (reason) {
    console.error(reason);
}
