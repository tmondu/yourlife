import { mysqlTable, varchar, text, int, timestamp, json, boolean } from 'drizzle-orm/mysql-core';

export const users = mysqlTable('users', {
  id: int('id').autoincrement().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  pinCode: varchar('pin_code', { length: 6 }),
  pushEnabled: boolean('push_enabled').default(false),
  partnerId: varchar('partner_id', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const entries = mysqlTable('entries', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  date: varchar('date', { length: 10 }).notNull(), // YYYY-MM-DD
  title: varchar('title', { length: 500 }),
  content: text('content').notNull(),
  mood: varchar('mood', { length: 50 }).notNull().default('neutral'), // happy, neutral, sad, tired, stressed
  weather: varchar('weather', { length: 50 }),
  tags: json('tags').$type<string[]>().$defaultFn(() => []),
  images: json('images').$type<string[]>().$defaultFn(() => []),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

export const pushSubscriptions = mysqlTable('push_subscriptions', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  endpoint: text('endpoint').notNull(),
  p256dh: text('p256dh').notNull(),
  auth: text('auth').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Entry = typeof entries.$inferSelect;
export type NewEntry = typeof entries.$inferInsert;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
