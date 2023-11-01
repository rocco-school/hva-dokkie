/**
 * Delays execution for the specified number of milliseconds.
 *
 * @param {number} ms - The delay duration in milliseconds.
 * @returns {Promise<void>} A Promise that resolves after the specified delay.
 */
export function delay(ms: number): Promise<void> {
    // Sets time out with give ms
    return new Promise(resolve => setTimeout(resolve, ms));
}