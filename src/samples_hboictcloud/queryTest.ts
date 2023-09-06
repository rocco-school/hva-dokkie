import { api } from "@hboictcloud/api";

export async function runQuery(query: string): Promise<Array<any> | undefined> {
    try {
        const result: Array<any> = (await api.queryDatabase(query)) as Array<any>;

        return result;
    } catch (error) {
        console.error(error);
    }

    return undefined;
}
