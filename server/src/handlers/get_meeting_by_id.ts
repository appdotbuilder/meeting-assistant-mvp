import { db } from '../db';
import { meetingsTable } from '../db/schema';
import { type Meeting } from '../schema';
import { eq } from 'drizzle-orm';

export const getMeetingById = async (id: number): Promise<Meeting | null> => {
  try {
    // Query the database for the meeting with the specified ID
    const results = await db.select()
      .from(meetingsTable)
      .where(eq(meetingsTable.id, id))
      .execute();

    // Return null if no meeting found
    if (results.length === 0) {
      return null;
    }

    // Return the meeting with proper type conversion
    const meeting = results[0];
    return {
      ...meeting,
      // All fields are already in correct format from the database
      // No numeric conversions needed as duration is integer type
    };
  } catch (error) {
    console.error('Failed to fetch meeting:', error);
    throw error;
  }
};