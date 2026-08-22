import { drizzle } from "drizzle-orm/expo-sqlite"
import { openDatabaseSync } from "expo-sqlite"

import * as schema from "./schema"

const expoDb = openDatabaseSync("startune.db")

expoDb.execSync("PRAGMA journal_mode = WAL;")
expoDb.execSync("PRAGMA foreign_keys = ON;")

export const db = drizzle(expoDb, { schema })

export type Database = typeof db
