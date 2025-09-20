import { db } from '../db';
import { meetingsTable } from '../db/schema';
import { type CreateMeetingInput, type Meeting } from '../schema';

export const createMeeting = async (input: CreateMeetingInput): Promise<Meeting> => {
  try {
    // Insert meeting record
    const result = await db.insert(meetingsTable)
      .values({
        title: input.title,
        description: input.description || null,
        audio_file_path: input.audio_file_path || null,
        transcript: null, // Will be populated after transcription
        summary: null, // Will be populated after AI processing
        tone_analysis: null, // Will be populated after AI processing
        action_items: null, // Will be populated after AI processing
        mind_map: null, // Will be populated after visualization
        duration: null // Will be calculated after audio processing
        // created_at and updated_at have default values in schema
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Meeting creation failed:', error);
    throw error;
  }
};