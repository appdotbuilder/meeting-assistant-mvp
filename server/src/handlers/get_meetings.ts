import { db } from '../db';
import { meetingsTable } from '../db/schema';
import { type Meeting } from '../schema';
import { desc } from 'drizzle-orm';

export const getMeetings = async (): Promise<Meeting[]> => {
  try {
    // Query all meetings ordered by creation date (newest first)
    const results = await db.select()
      .from(meetingsTable)
      .orderBy(desc(meetingsTable.created_at))
      .execute();

    // Transform database results to match schema types
    return results.map(meeting => ({
      ...meeting,
      // Ensure dates are Date objects
      created_at: new Date(meeting.created_at),
      updated_at: new Date(meeting.updated_at)
    }));
  } catch (error) {
    console.error('Failed to fetch meetings:', error);
    throw error;
  }
};