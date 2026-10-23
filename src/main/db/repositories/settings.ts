import { eq } from 'drizzle-orm'
import type { Db } from '../client'
import { settings } from '../schema'

export function createSettingsRepository(db: Db) {
  return {
    get<T>(key: string, fallback: T): T {
      const row = db.select().from(settings).where(eq(settings.key, key)).get()
      if (!row) return fallback
      try {
        return JSON.parse(row.value) as T
      } catch {
        return fallback
      }
    },

    set<T>(key: string, value: T): void {
      const json = JSON.stringify(value)
      db.insert(settings)
        .values({ key, value: json })
        .onConflictDoUpdate({ target: settings.key, set: { value: json } })
        .run()
    }
  }
}

export type SettingsRepository = ReturnType<typeof createSettingsRepository>
