import { serial, text, pgTable, timestamp, integer } from 'drizzle-orm/pg-core';

export const meetingsTable = pgTable('meetings', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'), // Nullable by default, matches Zod schema
  audio_file_path: text('audio_file_path'), // Nullable for meetings without audio files
  transcript: text('transcript'), // Nullable until transcription is complete
  summary: text('summary'), // Nullable until AI processing is complete
  tone_analysis: text('tone_analysis'), // Nullable until AI processing is complete
  action_items: text('action_items'), // Nullable until AI processing is complete
  mind_map: text('mind_map'), // Nullable until visualization is complete
  duration: integer('duration'), // Duration in seconds, nullable
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// TypeScript types for the table schema
export type Meeting = typeof meetingsTable.$inferSelect; // For SELECT operations
export type NewMeeting = typeof meetingsTable.$inferInsert; // For INSERT operations

// Important: Export all tables and relations for proper query building
export const tables = { meetings: meetingsTable };