import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { meetingsTable } from '../db/schema';
import { type ProcessAudioInput, type CreateMeetingInput } from '../schema';
import { processAudio } from '../handlers/process_audio';
import { eq } from 'drizzle-orm';

// Test input for audio processing
const testProcessAudioInput: ProcessAudioInput = {
  meeting_id: 1,
  audio_file_path: '/uploads/audio/test-meeting.mp3'
};

// Test input for creating a meeting first
const testCreateMeetingInput: CreateMeetingInput = {
  title: 'Test Meeting for Audio Processing',
  description: 'A meeting to test audio processing functionality',
  audio_file_path: null
};

describe('processAudio', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should process audio and update meeting with AI-generated content', async () => {
    // Create a meeting first
    const meeting = await db.insert(meetingsTable)
      .values({
        title: testCreateMeetingInput.title,
        description: testCreateMeetingInput.description,
        audio_file_path: testCreateMeetingInput.audio_file_path
      })
      .returning()
      .execute();

    const meetingId = meeting[0].id;

    // Process audio for the meeting
    const result = await processAudio({
      meeting_id: meetingId,
      audio_file_path: testProcessAudioInput.audio_file_path
    });

    // Verify response structure
    expect(result.meeting_id).toEqual(meetingId);
    expect(result.status).toEqual('completed');
    expect(result.message).toEqual('Audio processing completed successfully');
    expect(result.progress).toEqual(100);
  });

  it('should update meeting record with processed data', async () => {
    // Create a meeting first
    const meeting = await db.insert(meetingsTable)
      .values({
        title: testCreateMeetingInput.title,
        description: testCreateMeetingInput.description,
        audio_file_path: testCreateMeetingInput.audio_file_path
      })
      .returning()
      .execute();

    const meetingId = meeting[0].id;

    // Process audio
    await processAudio({
      meeting_id: meetingId,
      audio_file_path: testProcessAudioInput.audio_file_path
    });

    // Verify meeting was updated in database
    const updatedMeetings = await db.select()
      .from(meetingsTable)
      .where(eq(meetingsTable.id, meetingId))
      .execute();

    expect(updatedMeetings).toHaveLength(1);
    
    const updatedMeeting = updatedMeetings[0];
    expect(updatedMeeting.audio_file_path).toEqual(testProcessAudioInput.audio_file_path);
    expect(updatedMeeting.transcript).toBeDefined();
    expect(updatedMeeting.transcript).toContain('mock transcript');
    expect(updatedMeeting.summary).toBeDefined();
    expect(updatedMeeting.summary).toContain('Meeting summary');
    expect(updatedMeeting.tone_analysis).toBeDefined();
    expect(updatedMeeting.tone_analysis).toContain('Tone:');
    expect(updatedMeeting.action_items).toBeDefined();
    expect(updatedMeeting.action_items).toContain('Follow up');
    expect(updatedMeeting.mind_map).toBeDefined();
    expect(updatedMeeting.mind_map).toContain('graph TD');
    expect(updatedMeeting.duration).toEqual(1800);
    expect(updatedMeeting.updated_at).toBeInstanceOf(Date);
  });

  it('should return failed status for non-existent meeting', async () => {
    const result = await processAudio({
      meeting_id: 99999, // Non-existent meeting ID
      audio_file_path: testProcessAudioInput.audio_file_path
    });

    expect(result.meeting_id).toEqual(99999);
    expect(result.status).toEqual('failed');
    expect(result.message).toEqual('Meeting not found');
    expect(result.progress).toEqual(0);
  });

  it('should handle different audio file paths correctly', async () => {
    // Create a meeting first
    const meeting = await db.insert(meetingsTable)
      .values({
        title: testCreateMeetingInput.title,
        description: testCreateMeetingInput.description,
        audio_file_path: testCreateMeetingInput.audio_file_path
      })
      .returning()
      .execute();

    const meetingId = meeting[0].id;

    // Test with different file path
    const customAudioPath = '/uploads/audio/custom-meeting-recording.wav';
    const result = await processAudio({
      meeting_id: meetingId,
      audio_file_path: customAudioPath
    });

    // Verify processing succeeded
    expect(result.status).toEqual('completed');
    expect(result.progress).toEqual(100);

    // Verify audio path was updated
    const updatedMeetings = await db.select()
      .from(meetingsTable)
      .where(eq(meetingsTable.id, meetingId))
      .execute();

    expect(updatedMeetings[0].audio_file_path).toEqual(customAudioPath);
  });

  it('should update timestamps correctly', async () => {
    // Create a meeting first
    const meeting = await db.insert(meetingsTable)
      .values({
        title: testCreateMeetingInput.title,
        description: testCreateMeetingInput.description,
        audio_file_path: testCreateMeetingInput.audio_file_path
      })
      .returning()
      .execute();

    const meetingId = meeting[0].id;
    const originalUpdatedAt = meeting[0].updated_at;

    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    // Process audio
    await processAudio({
      meeting_id: meetingId,
      audio_file_path: testProcessAudioInput.audio_file_path
    });

    // Verify updated_at timestamp was changed
    const updatedMeetings = await db.select()
      .from(meetingsTable)
      .where(eq(meetingsTable.id, meetingId))
      .execute();

    expect(updatedMeetings[0].updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it('should preserve existing meeting data while adding processed content', async () => {
    const customDescription = 'Important meeting with detailed agenda';
    
    // Create a meeting with specific data
    const meeting = await db.insert(meetingsTable)
      .values({
        title: 'Strategic Planning Meeting',
        description: customDescription,
        audio_file_path: null
      })
      .returning()
      .execute();

    const meetingId = meeting[0].id;

    // Process audio
    await processAudio({
      meeting_id: meetingId,
      audio_file_path: testProcessAudioInput.audio_file_path
    });

    // Verify original data is preserved
    const updatedMeetings = await db.select()
      .from(meetingsTable)
      .where(eq(meetingsTable.id, meetingId))
      .execute();

    const updatedMeeting = updatedMeetings[0];
    expect(updatedMeeting.title).toEqual('Strategic Planning Meeting');
    expect(updatedMeeting.description).toEqual(customDescription);
    expect(updatedMeeting.created_at).toBeInstanceOf(Date);
    
    // Verify new processed data was added
    expect(updatedMeeting.audio_file_path).toEqual(testProcessAudioInput.audio_file_path);
    expect(updatedMeeting.transcript).toBeDefined();
    expect(updatedMeeting.summary).toBeDefined();
    expect(updatedMeeting.tone_analysis).toBeDefined();
    expect(updatedMeeting.action_items).toBeDefined();
    expect(updatedMeeting.mind_map).toBeDefined();
    expect(updatedMeeting.duration).toEqual(1800);
  });
});