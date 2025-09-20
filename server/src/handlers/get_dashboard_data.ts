import { db } from '../db';
import { meetingsTable } from '../db/schema';
import { type DashboardData } from '../schema';
import { eq } from 'drizzle-orm';

export async function getDashboardData(meetingId: number): Promise<DashboardData | null> {
  try {
    // Query the meeting by ID
    const results = await db.select()
      .from(meetingsTable)
      .where(eq(meetingsTable.id, meetingId))
      .execute();

    // Return null if meeting not found
    if (results.length === 0) {
      return null;
    }

    const meeting = results[0];

    // Structure the response according to DashboardData schema
    return {
      meeting: {
        id: meeting.id,
        title: meeting.title,
        description: meeting.description,
        audio_file_path: meeting.audio_file_path,
        transcript: meeting.transcript,
        summary: meeting.summary,
        tone_analysis: meeting.tone_analysis,
        action_items: meeting.action_items,
        mind_map: meeting.mind_map,
        duration: meeting.duration,
        created_at: meeting.created_at,
        updated_at: meeting.updated_at
      },
      components: {
        summary: meeting.summary,
        tone_analysis: meeting.tone_analysis,
        action_items: meeting.action_items,
        mind_map: meeting.mind_map
      }
    };
  } catch (error) {
    console.error('Failed to get dashboard data:', error);
    throw error;
  }
}