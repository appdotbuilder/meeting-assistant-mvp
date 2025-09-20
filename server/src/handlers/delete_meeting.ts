import { db } from '../db';
import { meetingsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteMeeting = async (id: number): Promise<boolean> => {
  try {
    // Delete the meeting record from the database
    const result = await db.delete(meetingsTable)
      .where(eq(meetingsTable.id, id))
      .execute();

    // Check if any rows were affected (i.e., meeting existed and was deleted)
    return result.rowCount !== null && result.rowCount > 0;
  } catch (error) {
    console.error('Meeting deletion failed:', error);
    throw error;
  }
};