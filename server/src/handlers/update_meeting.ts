import { db } from '../db';
import { meetingsTable } from '../db/schema';
import { type UpdateMeetingInput, type Meeting } from '../schema';
import { eq } from 'drizzle-orm';

export const updateMeeting = async (input: UpdateMeetingInput): Promise<Meeting> => {
  try {
    // Build the update object with only the fields provided in input
    const updateData: Partial<typeof meetingsTable.$inferInsert> = {
      updated_at: new Date() // Always update the timestamp
    };

    // Only include fields that are explicitly provided in the input
    if (input.title !== undefined) {
      updateData.title = input.title;
    }
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    if (input.audio_file_path !== undefined) {
      updateData.audio_file_path = input.audio_file_path;
    }
    if (input.transcript !== undefined) {
      updateData.transcript = input.transcript;
    }
    if (input.summary !== undefined) {
      updateData.summary = input.summary;
    }
    if (input.tone_analysis !== undefined) {
      updateData.tone_analysis = input.tone_analysis;
    }
    if (input.action_items !== undefined) {
      updateData.action_items = input.action_items;
    }
    if (input.mind_map !== undefined) {
      updateData.mind_map = input.mind_map;
    }
    if (input.duration !== undefined) {
      updateData.duration = input.duration;
    }

    // Update the meeting record
    const result = await db.update(meetingsTable)
      .set(updateData)
      .where(eq(meetingsTable.id, input.id))
      .returning()
      .execute();

    // Check if the meeting was found and updated
    if (result.length === 0) {
      throw new Error(`Meeting with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Meeting update failed:', error);
    throw error;
  }
};