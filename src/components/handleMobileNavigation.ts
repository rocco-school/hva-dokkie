// Function to handle opening mobile menu
export function openMenu(mobileNav: Element | any): void {
    mobileNav?.classList.add("max-width");
    console.log("done!");
}

// Function to handle closing mobile menu
export function closeMenu(mobileNav: Element | any): void {
    mobileNav?.classList.remove("max-width");
    console.log("closed!");
}