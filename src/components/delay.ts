import "../hboictcloud-config";

export function delay(ms: number): Promise<void> {
    // Sets time out with give ms
    return new Promise(resolve => setTimeout(resolve, ms));
}