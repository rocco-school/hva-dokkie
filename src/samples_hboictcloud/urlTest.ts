import { url } from "@hboictcloud/api";

export function setUrlRedirect(value: string): void {
    url.redirect("", {
        test: value,
    });
}

export function setUrlReplace(value: string): void {
    url.replace("", {
        test: value,
    });
}

export function getUrl(): string {
    return url.getFromQueryString("test");
}
