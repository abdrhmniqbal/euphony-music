/**
 * Purpose: Declares JSON imports for static resource files.
 * Caller: TypeScript modules importing JSON data.
 * Dependencies: Localization translation resource type.
 * Main Functions: module "*.json".
 * Side Effects: None.
 */

declare module "*.json" {
  const value: import("@/modules/localization/types").TranslationResources
  export default value
}
