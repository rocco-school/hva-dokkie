export const thisIsAModule = true;

declare global {
    const __HBOICTCLOUD_APIKEY__: string;
    const __HBOICTCLOUD_DATABASE__: string;
    const __SECRET_KEY__: string;
}