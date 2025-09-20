import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { meetingsTable } from '../db/schema';
import { type UpdateMeetingInput, type CreateMeetingInput } from '../schema';
import { updateMeeting } from '../handlers/update_meeting';
import { eq } from 'drizzle-orm';

// Helper function to create a test meeting
const createTestMeeting = async (data?: Partial<typeof meetingsTable.$inferInsert>) => {
  const meetingData = {
    title: 'Test Meeting',
    description: 'A test meeting',
    audio_file_path: '/test/audio.mp3',
    ...data
  };

  const result = await db.insert(meetingsTable)
    .values(meetingData)
    .returning()
    .execute();

  return result[0];
};

describe('updateMeeting', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update meeting title', async () => {
    // Create initial meeting
    const meeting = await createTestMeeting();
    
    const updateInput: UpdateMeetingInput = {
      id: meeting.id,
      title: 'Updated Meeting Title'
    };

    const result = await updateMeeting(updateInput);

    expect(result.id).toBe(meeting.id);
    expect(result.title).toBe('Updated Meeting Title');
    expect(result.description).toBe(meeting.description);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > meeting.updated_at).toBe(true);
  });

  it('should update multiple fields at once', async () => {
    const meeting = await createTestMeeting();
    
    const updateInput: UpdateMeetingInput = {
      id: meeting.id,
      title: 'Updated Title',
      description: 'Updated description',
      transcript: 'This is the meeting transcript',
      summary: 'Meeting summary',
      duration: 3600
    };

    const result = await updateMeeting(updateInput);

    expect(result.title).toBe('Updated Title');
    expect(result.description).toBe('Updated description');
    expect(result.transcript).toBe('This is the meeting transcript');
    expect(result.summary).toBe('Meeting summary');
    expect(result.duration).toBe(3600);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update AI processing fields', async () => {
    const meeting = await createTestMeeting();
    
    const updateInput: UpdateMeetingInput = {
      id: meeting.id,
      transcript: 'Meeting transcript content',
      summary: 'AI generated summary',
      tone_analysis: 'Positive tone detected',
      action_items: 'Action item 1, Action item 2',
      mind_map: 'Mind map data in JSON format'
    };

    const result = await updateMeeting(updateInput);

    expect(result.transcript).toBe('Meeting transcript content');
    expect(result.summary).toBe('AI generated summary');
    expect(result.tone_analysis).toBe('Positive tone detected');
    expect(result.action_items).toBe('Action item 1, Action item 2');
    expect(result.mind_map).toBe('Mind map data in JSON format');
  });

  it('should handle nullable fields correctly', async () => {
    const meeting = await createTestMeeting({
      description: 'Original description'
    });
    
    const updateInput: UpdateMeetingInput = {
      id: meeting.id,
      description: null,
      audio_file_path: null
    };

    const result = await updateMeeting(updateInput);

    expect(result.description).toBeNull();
    expect(result.audio_file_path).toBeNull();
    expect(result.title).toBe(meeting.title); // Should remain unchanged
  });

  it('should preserve unchanged fields', async () => {
    const meeting = await createTestMeeting({
      title: 'Original Title',
      description: 'Original description'
    });
    
    // Only update the title
    const updateInput: UpdateMeetingInput = {
      id: meeting.id,
      title: 'New Title'
    };

    const result = await updateMeeting(updateInput);

    expect(result.title).toBe('New Title');
    expect(result.description).toBe('Original description'); // Should remain unchanged
    expect(result.audio_file_path).toBe(meeting.audio_file_path); // Should remain unchanged
  });

  it('should save changes to database', async () => {
    const meeting = await createTestMeeting();
    
    const updateInput: UpdateMeetingInput = {
      id: meeting.id,
      title: 'Database Update Test',
      summary: 'Test summary'
    };

    await updateMeeting(updateInput);

    // Verify changes were persisted to database
    const savedMeeting = await db.select()
      .from(meetingsTable)
      .where(eq(meetingsTable.id, meeting.id))
      .execute();

    expect(savedMeeting).toHaveLength(1);
    expect(savedMeeting[0].title).toBe('Database Update Test');
    expect(savedMeeting[0].summary).toBe('Test summary');
    expect(savedMeeting[0].updated_at).toBeInstanceOf(Date);
  });

  it('should update timestamp on every update', async () => {
    const meeting = await createTestMeeting();
    const originalUpdatedAt = meeting.updated_at;
    
    // Small delay to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const updateInput: UpdateMeetingInput = {
      id: meeting.id,
      title: 'Updated for timestamp test'
    };

    const result = await updateMeeting(updateInput);

    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > originalUpdatedAt).toBe(true);
  });

  it('should throw error for non-existent meeting', async () => {
    const updateInput: UpdateMeetingInput = {
      id: 99999, // Non-existent ID
      title: 'Should fail'
    };

    await expect(updateMeeting(updateInput)).rejects.toThrow(/Meeting with id 99999 not found/i);
  });

  it('should handle partial updates correctly', async () => {
    const meeting = await createTestMeeting({
      title: 'Original Title',
      description: 'Original description',
      transcript: null
    });
    
    // Update only transcript field
    const updateInput: UpdateMeetingInput = {
      id: meeting.id,
      transcript: 'New transcript content'
    };

    const result = await updateMeeting(updateInput);

    // Check that only transcript was updated
    expect(result.transcript).toBe('New transcript content');
    expect(result.title).toBe('Original Title');
    expect(result.description).toBe('Original description');
    expect(result.summary).toBeNull(); // Should remain null
  });
});