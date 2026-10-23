import { sql } from 'drizzle-orm'
import { index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import type { Priority } from '../../shared/domain'

const now = sql`(cast(unixepoch('subsec') * 1000 as integer))`

export const lists = sqliteTable('lists', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  position: real('position').notNull(),
  viewMode: text('view_mode', { enum: ['list', 'cards', 'columns'] })
    .notNull()
    .default('list'),
  isInbox: integer('is_inbox', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at').notNull().default(now)
})

export const tasks = sqliteTable(
  'tasks',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    listId: integer('list_id')
      .notNull()
      .references(() => lists.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    notes: text('notes').notNull().default(''),
    status: text('status', { enum: ['todo', 'doing', 'done'] })
      .notNull()
      .default('todo'),
    priority: integer('priority').$type<Priority>().notNull().default(0),
    dueDate: text('due_date'),
    dueTime: text('due_time'),
    position: real('position').notNull(),
    completedAt: integer('completed_at'),
    createdAt: integer('created_at').notNull().default(now),
    updatedAt: integer('updated_at').notNull().default(now)
  },
  (table) => [
    index('tasks_list_position_idx').on(table.listId, table.position),
    index('tasks_due_date_idx').on(table.dueDate)
  ]
)

/** Key-value app settings. Values are JSON. */
export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull()
})
