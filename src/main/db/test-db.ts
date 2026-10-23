import { resolve } from 'path'
import { openDatabase, type Db } from './client'

/** Fresh in-memory database with all migrations applied. For tests only. */
export function openTestDatabase(): Db {
  return openDatabase(':memory:', resolve(__dirname, '../../../resources/migrations'))
}
