import Database from 'better-sqlite3'
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import * as schema from './schema'

export type Db = BetterSQLite3Database<typeof schema>

/** Opens the database, applies pending migrations and makes sure the Inbox exists. */
export function openDatabase(file: string, migrationsFolder: string): Db {
  const sqlite = new Database(file)
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')
  const db = drizzle(sqlite, { schema })
  migrate(db, { migrationsFolder })
  ensureInbox(db)
  return db
}

export const INBOX_NAME = 'Entrada'

function ensureInbox(db: Db): void {
  const inbox = db.query.lists
    .findFirst({ where: (lists, { eq }) => eq(lists.isInbox, true) })
    .sync()
  if (!inbox) {
    db.insert(schema.lists).values({ name: INBOX_NAME, position: 0, isInbox: true }).run()
  }
}
