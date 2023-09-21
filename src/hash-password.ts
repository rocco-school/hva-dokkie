import bcrypt from "bcryptjs";
import {api} from "@hboictcloud/api";
import {QUERY} from "./query/user.query";

export async function hashPassword(password: string, email: string | undefined, name: string | undefined): Promise<string | void> {

    bcrypt.genSalt(10, function (err: Error | null, salt: string): void {
        if (!err) {
            bcrypt.hash(password, salt, function (err: Error | null, hash: string): void {
                if (!err) {
                    const createUser: (string | undefined)[] = [email, hash, name];
                    api.queryDatabase(QUERY.CREATE_USER, ...createUser);
                }
            });
        }
    });
}