import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { meetingsTable } from '../db/schema';
import { type CreateMeetingInput } from '../schema';
import { deleteMeeting } from '../handlers/delete_meeting';
import { eq } from 'drizzle-orm';

// Test input for creating meetings
const testMeetingInput: CreateMeetingInput = {
  title: 'Test Meeting for Deletion',
  description: 'A meeting created for testing deletion',
  audio_file_path: '/path/to/audio.mp3'
};

describe('deleteMeeting', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing meeting and return true', async () => {
    // First, create a meeting
    const createResult = await db.insert(meetingsTable)
      .values({
        title: testMeetingInput.title,
        description: testMeetingInput.description,
        audio_file_path: testMeetingInput.audio_file_path
      })
      .returning()
      .execute();

    const createdMeeting = createResult[0];
    expect(createdMeeting.id).toBeDefined();

    // Delete the meeting
    const deleteResult = await deleteMeeting(createdMeeting.id);

    // Should return true indicating successful deletion
    expect(deleteResult).toBe(true);

    // Verify the meeting is no longer in the database
    const meetings = await db.select()
      .from(meetingsTable)
      .where(eq(meetingsTable.id, createdMeeting.id))
      .execute();

    expect(meetings).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent meeting', async () => {
    // Try to delete a meeting that doesn't exist
    const nonExistentId = 99999;
    const result = await deleteMeeting(nonExistentId);

    // Should return false since no meeting was found to delete
    expect(result).toBe(false);
  });

  it('should delete meeting with all fields populated', async () => {
    // Create a fully populated meeting
    const fullMeetingResult = await db.insert(meetingsTable)
      .values({
        title: 'Complete Meeting',
        description: 'Meeting with all fields',
        audio_file_path: '/path/to/audio.mp3',
        transcript: 'This is a test transcript',
        summary: 'Meeting summary',
        tone_analysis: 'Positive tone',
        action_items: 'Action item 1, Action item 2',
        mind_map: 'Mind map data',
        duration: 3600 // 1 hour
      })
      .returning()
      .execute();

    const meeting = fullMeetingResult[0];

    // Delete the meeting
    const result = await deleteMeeting(meeting.id);

    expect(result).toBe(true);

    // Verify deletion
    const meetings = await db.select()
      .from(meetingsTable)
      .where(eq(meetingsTable.id, meeting.id))
      .execute();

    expect(meetings).toHaveLength(0);
  });

  it('should not affect other meetings when deleting one', async () => {
    // Create multiple meetings
    const meeting1Result = await db.insert(meetingsTable)
      .values({
        title: 'Meeting 1',
        description: 'First meeting'
      })
      .returning()
      .execute();

    const meeting2Result = await db.insert(meetingsTable)
      .values({
        title: 'Meeting 2',
        description: 'Second meeting'
      })
      .returning()
      .execute();

    const meeting1 = meeting1Result[0];
    const meeting2 = meeting2Result[0];

    // Delete only the first meeting
    const result = await deleteMeeting(meeting1.id);

    expect(result).toBe(true);

    // Verify first meeting is deleted
    const deletedMeetings = await db.select()
      .from(meetingsTable)
      .where(eq(meetingsTable.id, meeting1.id))
      .execute();

    expect(deletedMeetings).toHaveLength(0);

    // Verify second meeting still exists
    const remainingMeetings = await db.select()
      .from(meetingsTable)
      .where(eq(meetingsTable.id, meeting2.id))
      .execute();

    expect(remainingMeetings).toHaveLength(1);
    expect(remainingMeetings[0].title).toBe('Meeting 2');
  });

  it('should handle deletion of meeting with nullable fields', async () => {
    // Create a meeting with minimal data (only required fields)
    const minimalMeetingResult = await db.insert(meetingsTable)
      .values({
        title: 'Minimal Meeting'
        // All other fields are nullable and will be null
      })
      .returning()
      .execute();

    const meeting = minimalMeetingResult[0];

    // Verify the meeting was created with null values
    expect(meeting.description).toBeNull();
    expect(meeting.audio_file_path).toBeNull();
    expect(meeting.transcript).toBeNull();

    // Delete the meeting
    const result = await deleteMeeting(meeting.id);

    expect(result).toBe(true);

    // Verify deletion
    const meetings = await db.select()
      .from(meetingsTable)
      .where(eq(meetingsTable.id, meeting.id))
      .execute();

    expect(meetings).toHaveLength(0);
  });
});