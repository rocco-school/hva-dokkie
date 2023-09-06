import { session } from "@hboictcloud/api";

export function setSessionValue(value: string): void {
    session.set("test", value);
}

export function getSessionValue(): string {
    return session.get("test", "Leeg...");
}

export function removeSessionValue(): void {
    return session.remove("test");
}
