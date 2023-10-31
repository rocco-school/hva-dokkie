import {SignJWT, jwtVerify, type JWTPayload} from "jose";


/**
 * Sign the JSON Web Token (JWT) with the provided payload and secret
 *
 * @param {JWTPayload} payload - The data to be included in the JWT.
 * @param {string} secret - The secret key for JWT signing.
 * @returns A signed JWT string.
 */
export async function sign(payload, secret): Promise<string> {
    // Get current date
    const iat: number = Math.floor(Date.now() / 1000);
    // Set expiration time
    const days: number = parseInt(__VITE_JWT_EXPIRATION_TIME__);

    const exp: number = iat + 60 * 60 * 24 * (days ? days : 1); // one day

    return new SignJWT({...payload})
        .setProtectedHeader({alg: "HS256", typ: "JWT"})
        .setExpirationTime(exp)
        .setIssuedAt(iat)
        .setNotBefore(iat)
        .sign(new TextEncoder().encode(secret));
}

/**
 * Verify a JSON Web Token (JWT) using the provided token and secret.
 *
 * @param {string} token - The JWT token to be verified.
 * @param {string} secret - The secret key for JWT verification.
 * @returns The payload extracted from the JWT if verification is successful.
 */
export async function verify(token, secret): Promise<JWTPayload> {
    // Verify the JWT token and extract its payload.
    const {payload} = await jwtVerify(token, new TextEncoder().encode(secret));
    // Return the payload, which indicates successful verification.
    return payload;
}