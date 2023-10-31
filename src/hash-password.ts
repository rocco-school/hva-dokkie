import bcrypt from "bcryptjs";
import {api} from "@hboictcloud/api";
import {USER_QUERY} from "./query/user.query";
import {Status} from "./enum/status.enum";

/**
 * Hashes the user's password and creates a new user in the database.
 * @param {string} password - The user's password to be hashed.
 * @param {string} email - The user's email address.
 * @param {string} name - The user's name.
 * @returns {Promise<Status | void>} A Promise that resolves to a status or void.
 * @throws {Status} Throws an error if the operation fails.
 */
export async function hashPassword(password, email, name): Promise<Status | void> {
    try {
        // Generates a random salt(unique text) to add to hash.
        return bcrypt.genSalt(10, function (err: Error | null, salt: string): Status | void {
            if (err) {
                return Status.INTERNAL_SERVER_ERROR;
            }

            // Hashes the password.
            // bcrypt has takes the previously generated Salt adds this to the password.
            // Then hashes the password+Salt and then adds the Salt to the hashed password+salt. Salt+(password+Salt)
            return bcrypt.hash(password, salt, async function (err: Error | null, hash: string): Promise<Status | void> {
                if (err) {
                    return Status.INTERNAL_SERVER_ERROR;
                }

                try {
                    //Create user in database with hashed password.
                    const createUser: any[] = [email, hash, name];
                    await api.queryDatabase(USER_QUERY.CREATE_USER, ...createUser);
                    return Status.CREATED;
                } catch (error: unknown) {
                    return Status.INTERNAL_SERVER_ERROR;
                }
            });

        });
    } catch (error: unknown) {
        return Status.BAD_REQUEST;
    }
}