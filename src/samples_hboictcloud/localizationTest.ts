import { localization } from "@hboictcloud/api";

localization.setTranslations({
    paragraph: {
        en: "This text will be translated!",
        nl: "Deze tekst zal vertaald worden!",
    },
    english: {
        en: "English",
        nl: "Engels",
    },
    dutch: {
        en: "Dutch",
        nl: "Nederlands",
    },
});

switchToDutch();

export function switchToEnglish(): void {
    localization.switchLanguage("en");
}

export function switchToDutch(): void {
    localization.switchLanguage("nl");
}

export function switchToXX(): void {
    localization.switchLanguage("xx");
}
