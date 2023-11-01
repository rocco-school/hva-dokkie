/**
 * Opens the mobile navigation by adding a CSS class.
 *
 * @param {Element} mobileNav - The HTML element representing the mobile navigation.
 */
export function openMenu(mobileNav: Element | any): void {
    mobileNav?.classList.add("max-width");
    console.log("done!");
}

/**
 * Closes the mobile navigation by removing a CSS class.
 *
 * @param {Element} mobileNav - The HTML element representing the mobile navigation.
 */
export function closeMenu(mobileNav: Element | any): void {
    mobileNav?.classList.remove("max-width");
    console.log("closed!");
}