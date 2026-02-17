# Expo Router and Uniwind

Use [Expo Router](https://docs.expo.dev/router/introduction/) with [Uniwind](https://docs.uniwind.dev/) styling.

## Project Structure

`src/app/`: Expo Router routes and layouts only  
`src/modules/`: feature modules (home, artists, albums, playlist, player, search, settings, etc.)  
`src/modules/*/*.api.ts`: db/data-access functions  
`src/modules/*/*.utils.ts`: non-db utilities and pure helpers  
`src/modules/*/*.queries.ts`: React Query hooks  
`src/modules/*/hooks/`: module hooks  
`src/modules/*/screens/`: module screens  
`src/components/`: reusable UI components  
`src/hooks/`: shared hooks and UI state stores  
`src/db/`: Drizzle client, schema, and migrations  
`src/lib/`: third-party integrations and setup helpers  
`src/utils/`: pure utility helpers

## Launch your own

[![Launch with Expo](https://github.com/expo/examples/blob/master/.gh-assets/launch.svg?raw=true)](https://launch.expo.dev/?github=https://github.com/expo/examples/tree/master/with-router-uniwind)

## 🚀 How to use

```sh
npx create-expo-app -e with-router-uniwind
```

## Deploy

Deploy on all platforms with Expo Application Services (EAS).

- Deploy the website: `npx eas-cli deploy` — [Learn more](https://docs.expo.dev/eas/hosting/get-started/)
- Deploy on iOS and Android using: `npx eas-cli build` — [Learn more](https://expo.dev/eas)
