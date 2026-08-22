/**
 * Purpose: Declares CSS side-effect imports for the Expo Router app shell.
 * Caller: TypeScript compiler.
 * Dependencies: None.
 * Main Functions: None.
 * Side Effects: Extends module resolution for .css imports.
 */

declare module "*.css" {
  const css: string

  export default css
}
