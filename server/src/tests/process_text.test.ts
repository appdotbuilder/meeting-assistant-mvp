import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { meetingsTable } from '../db/schema';
import { type ProcessTextInput } from '../schema';
import { processText } from '../handlers/process_text';
import { eq } from 'drizzle-orm';

// Test data
const testMeetingData = {
  title: 'Test Meeting',
  description: 'A meeting for testing text processing',
  audio_file_path: null
};

const sampleTranscript = `Welcome to the project kickoff meeting.
We need to discuss the project timeline and deliverables.
The team will work together to achieve our goals.
John will handle the frontend development.
Sarah should review the design specifications by Friday.
We must complete the initial prototype by next month.`;

const shortTranscript = "Brief meeting discussion.";

const emptyTranscript = "";

describe('processText', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should successfully process text for existing meeting', async () => {
    // Create a test meeting
    const meetingResult = await db.insert(meetingsTable)
      .values(testMeetingData)
      .returning()
      .execute();

    const meeting = meetingResult[0];

    const input: ProcessTextInput = {
      meeting_id: meeting.id,
      transcript: sampleTranscript
    };

    const result = await processText(input);

    // Verify response structure
    expect(result.meeting_id).toEqual(meeting.id);
    expect(result.status).toEqual('completed');
    expect(result.message).toEqual('Text processing completed successfully');
    expect(result.progress).toEqual(100);
  });

  it('should update meeting with processed data', async () => {
    // Create a test meeting
    const meetingResult = await db.insert(meetingsTable)
      .values(testMeetingData)
      .returning()
      .execute();

    const meeting = meetingResult[0];

    const input: ProcessTextInput = {
      meeting_id: meeting.id,
      transcript: sampleTranscript
    };

    await processText(input);

    // Verify meeting was updated with processed data
    const updatedMeetings = await db.select()
      .from(meetingsTable)
      .where(eq(meetingsTable.id, meeting.id))
      .execute();

    const updatedMeeting = updatedMeetings[0];

    expect(updatedMeeting.transcript).toEqual(sampleTranscript);
    expect(updatedMeeting.summary).toBeDefined();
    expect(updatedMeeting.summary).not.toBeNull();
    expect(updatedMeeting.summary).toContain('Meeting Summary');
    
    expect(updatedMeeting.tone_analysis).toBeDefined();
    expect(updatedMeeting.tone_analysis).not.toBeNull();
    expect(updatedMeeting.tone_analysis).toContain('Tone Analysis');
    
    expect(updatedMeeting.action_items).toBeDefined();
    expect(updatedMeeting.action_items).not.toBeNull();
    expect(updatedMeeting.action_items).toContain('Action Items');
    
    expect(updatedMeeting.mind_map).toBeDefined();
    expect(updatedMeeting.mind_map).not.toBeNull();
    expect(updatedMeeting.mind_map).toContain('graph TD');
    
    // Verify updated_at was changed
    expect(updatedMeeting.updated_at).toBeInstanceOf(Date);
  });

  it('should handle non-existent meeting', async () => {
    const input: ProcessTextInput = {
      meeting_id: 999999, // Non-existent ID
      transcript: sampleTranscript
    };

    const result = await processText(input);

    expect(result.meeting_id).toEqual(999999);
    expect(result.status).toEqual('failed');
    expect(result.message).toEqual('Meeting not found');
    expect(result.progress).toEqual(0);
  });

  it('should handle empty transcript', async () => {
    // Create a test meeting
    const meetingResult = await db.insert(meetingsTable)
      .values(testMeetingData)
      .returning()
      .execute();

    const meeting = meetingResult[0];

    const input: ProcessTextInput = {
      meeting_id: meeting.id,
      transcript: emptyTranscript
    };

    const result = await processText(input);

    expect(result.meeting_id).toEqual(meeting.id);
    expect(result.status).toEqual('failed');
    expect(result.message).toEqual('Transcript is required for processing');
    expect(result.progress).toEqual(0);
  });

  it('should handle whitespace-only transcript', async () => {
    // Create a test meeting
    const meetingResult = await db.insert(meetingsTable)
      .values(testMeetingData)
      .returning()
      .execute();

    const meeting = meetingResult[0];

    const input: ProcessTextInput = {
      meeting_id: meeting.id,
      transcript: "   \n\t   " // Only whitespace
    };

    const result = await processText(input);

    expect(result.meeting_id).toEqual(meeting.id);
    expect(result.status).toEqual('failed');
    expect(result.message).toEqual('Transcript is required for processing');
    expect(result.progress).toEqual(0);
  });

  it('should process short transcript correctly', async () => {
    // Create a test meeting
    const meetingResult = await db.insert(meetingsTable)
      .values(testMeetingData)
      .returning()
      .execute();

    const meeting = meetingResult[0];

    const input: ProcessTextInput = {
      meeting_id: meeting.id,
      transcript: shortTranscript
    };

    const result = await processText(input);

    expect(result.status).toEqual('completed');
    expect(result.progress).toEqual(100);

    // Verify processed data was still generated
    const updatedMeetings = await db.select()
      .from(meetingsTable)
      .where(eq(meetingsTable.id, meeting.id))
      .execute();

    const updatedMeeting = updatedMeetings[0];
    
    expect(updatedMeeting.summary).toBeDefined();
    expect(updatedMeeting.tone_analysis).toBeDefined();
    expect(updatedMeeting.action_items).toBeDefined();
    expect(updatedMeeting.mind_map).toBeDefined();
  });

  it('should preserve existing meeting data when updating', async () => {
    // Create a test meeting with existing data
    const existingMeetingData = {
      ...testMeetingData,
      description: 'Original description',
      duration: 1800 // 30 minutes
    };

    const meetingResult = await db.insert(meetingsTable)
      .values(existingMeetingData)
      .returning()
      .execute();

    const meeting = meetingResult[0];

    const input: ProcessTextInput = {
      meeting_id: meeting.id,
      transcript: sampleTranscript
    };

    await processText(input);

    // Verify existing data was preserved
    const updatedMeetings = await db.select()
      .from(meetingsTable)
      .where(eq(meetingsTable.id, meeting.id))
      .execute();

    const updatedMeeting = updatedMeetings[0];

    expect(updatedMeeting.title).toEqual(existingMeetingData.title);
    expect(updatedMeeting.description).toEqual(existingMeetingData.description);
    expect(updatedMeeting.duration).toEqual(existingMeetingData.duration);
    expect(updatedMeeting.transcript).toEqual(sampleTranscript); // Should be updated
  });

  it('should generate appropriate content based on transcript content', async () => {
    // Create a test meeting
    const meetingResult = await db.insert(meetingsTable)
      .values(testMeetingData)
      .returning()
      .execute();

    const meeting = meetingResult[0];

    // Test with transcript containing specific keywords
    const problemTranscript = `We have a major problem with the current system.
    There are several issues that need immediate attention.
    The team is concerned about the timeline.`;

    const input: ProcessTextInput = {
      meeting_id: meeting.id,
      transcript: problemTranscript
    };

    await processText(input);

    // Verify processed data reflects transcript content
    const updatedMeetings = await db.select()
      .from(meetingsTable)
      .where(eq(meetingsTable.id, meeting.id))
      .execute();

    const updatedMeeting = updatedMeetings[0];
    
    // Tone analysis should reflect the concerned nature
    expect(updatedMeeting.tone_analysis).toContain('Concerned');
    
    // Summary should include key points from transcript
    expect(updatedMeeting.summary).toContain('problem');
    
    // Mind map should be valid Mermaid syntax
    expect(updatedMeeting.mind_map).toContain('graph TD');
    expect(updatedMeeting.mind_map).toContain('Meeting');
  });
});