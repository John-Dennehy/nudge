import { index, integer, jsonb, pgTable, primaryKey, text, timestamp } from 'drizzle-orm/pg-core'
import type { NudgeEvent } from '@/core/types'

/** One private, anonymous space per browser. No names, emails or passwords. */
export const owners = pgTable('owners', {
	id: text('id').primaryKey(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

/**
 * The journal. (owner_id, seq) is the primary key, so two devices appending at the same
 * position can't both win: the second gets a conflict and catches up first.
 */
export const events = pgTable(
	'events',
	{
		ownerId: text('owner_id')
			.notNull()
			.references(() => owners.id, { onDelete: 'cascade' }),
		seq: integer('seq').notNull(),
		event: jsonb('event').$type<NudgeEvent>().notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(t) => [primaryKey({ columns: [t.ownerId, t.seq] })],
)

/** Short-lived codes for linking a second device to the same space. */
export const pairCodes = pgTable(
	'pair_codes',
	{
		code: text('code').primaryKey(),
		ownerId: text('owner_id')
			.notNull()
			.references(() => owners.id, { onDelete: 'cascade' }),
		expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
	},
	(t) => [index('pair_codes_owner_idx').on(t.ownerId)],
)
