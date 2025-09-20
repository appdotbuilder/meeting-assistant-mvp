import { db } from '../db';
import { meetingsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type ProcessingStatusResponse } from '../schema';

export const getProcessingStatus = async (meetingId: number): Promise<ProcessingStatusResponse> => {
  try {
    // Query the meeting from the database
    const meetings = await db.select()
      .from(meetingsTable)
      .where(eq(meetingsTable.id, meetingId))
      .execute();

    if (meetings.length === 0) {
      throw new Error(`Meeting with ID ${meetingId} not found`);
    }

    const meeting = meetings[0];

    // Determine processing status based on available data
    let status: 'pending' | 'processing' | 'completed' | 'failed';
    let progress: number;
    let message: string | null;

    // Check if we have an audio file path but no transcript yet
    if (meeting.audio_file_path && !meeting.transcript) {
      status = 'processing';
      progress = 25; // Audio transcription in progress
      message = 'Transcribing audio file';
    }
    // Check if we have transcript but missing AI-generated content
    else if (meeting.transcript && (!meeting.summary || !meeting.tone_analysis || !meeting.action_items || !meeting.mind_map)) {
      status = 'processing';
      progress = 60; // AI processing in progress
      message = 'Processing transcript with AI';
    }
    // Check if we have all the processed content
    else if (meeting.transcript && meeting.summary && meeting.tone_analysis && meeting.action_items && meeting.mind_map) {
      status = 'completed';
      progress = 100;
      message = 'Meeting processing completed successfully';
    }
    // Default case - meeting created but no processing started
    else {
      status = 'pending';
      progress = 0;
      message = 'Waiting to start processing';
    }

    return {
      meeting_id: meetingId,
      status,
      message,
      progress
    };
  } catch (error) {
    console.error('Processing status check failed:', error);
    throw error;
  }
};