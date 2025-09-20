import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { meetingsTable } from '../db/schema';
import { type CreateMeetingInput } from '../schema';
import { createMeeting } from '../handlers/create_meeting';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInputComplete: CreateMeetingInput = {
  title: 'Weekly Team Standup',
  description: 'Weekly team standup meeting to discuss progress and blockers',
  audio_file_path: '/uploads/meetings/standup_2024_01_15.mp3'
};

// Minimal test input with only required fields
const testInputMinimal: CreateMeetingInput = {
  title: 'Quick Meeting'
};

// Test input with null optional fields explicitly set
const testInputWithNulls: CreateMeetingInput = {
  title: 'Meeting with Nulls',
  description: null,
  audio_file_path: null
};

describe('createMeeting', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a meeting with all fields provided', async () => {
    const result = await createMeeting(testInputComplete);

    // Verify basic field values
    expect(result.title).toEqual('Weekly Team Standup');
    expect(result.description).toEqual('Weekly team standup meeting to discuss progress and blockers');
    expect(result.audio_file_path).toEqual('/uploads/meetings/standup_2024_01_15.mp3');
    
    // Verify auto-generated fields
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify nullable fields are initially null
    expect(result.transcript).toBeNull();
    expect(result.summary).toBeNull();
    expect(result.tone_analysis).toBeNull();
    expect(result.action_items).toBeNull();
    expect(result.mind_map).toBeNull();
    expect(result.duration).toBeNull();
  });

  it('should create a meeting with minimal required fields', async () => {
    const result = await createMeeting(testInputMinimal);

    // Verify required fields
    expect(result.title).toEqual('Quick Meeting');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify optional fields default to null when not provided
    expect(result.description).toBeNull();
    expect(result.audio_file_path).toBeNull();
    expect(result.transcript).toBeNull();
    expect(result.summary).toBeNull();
    expect(result.tone_analysis).toBeNull();
    expect(result.action_items).toBeNull();
    expect(result.mind_map).toBeNull();
    expect(result.duration).toBeNull();
  });

  it('should create a meeting with explicit null values', async () => {
    const result = await createMeeting(testInputWithNulls);

    expect(result.title).toEqual('Meeting with Nulls');
    expect(result.description).toBeNull();
    expect(result.audio_file_path).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save meeting to database correctly', async () => {
    const result = await createMeeting(testInputComplete);

    // Query the database directly to verify persistence
    const meetings = await db.select()
      .from(meetingsTable)
      .where(eq(meetingsTable.id, result.id))
      .execute();

    expect(meetings).toHaveLength(1);
    const savedMeeting = meetings[0];
    
    expect(savedMeeting.title).toEqual('Weekly Team Standup');
    expect(savedMeeting.description).toEqual('Weekly team standup meeting to discuss progress and blockers');
    expect(savedMeeting.audio_file_path).toEqual('/uploads/meetings/standup_2024_01_15.mp3');
    expect(savedMeeting.created_at).toBeInstanceOf(Date);
    expect(savedMeeting.updated_at).toBeInstanceOf(Date);
    
    // Verify nullable fields are properly stored as null
    expect(savedMeeting.transcript).toBeNull();
    expect(savedMeeting.summary).toBeNull();
    expect(savedMeeting.tone_analysis).toBeNull();
    expect(savedMeeting.action_items).toBeNull();
    expect(savedMeeting.mind_map).toBeNull();
    expect(savedMeeting.duration).toBeNull();
  });

  it('should create multiple meetings with unique IDs', async () => {
    const result1 = await createMeeting({
      title: 'First Meeting'
    });
    
    const result2 = await createMeeting({
      title: 'Second Meeting'
    });

    expect(result1.id).not.toEqual(result2.id);
    expect(result1.title).toEqual('First Meeting');
    expect(result2.title).toEqual('Second Meeting');

    // Verify both meetings exist in database
    const allMeetings = await db.select()
      .from(meetingsTable)
      .execute();

    expect(allMeetings).toHaveLength(2);
    const titles = allMeetings.map(m => m.title).sort();
    expect(titles).toEqual(['First Meeting', 'Second Meeting']);
  });

  it('should handle timestamps correctly', async () => {
    const beforeCreation = new Date();
    const result = await createMeeting(testInputMinimal);
    const afterCreation = new Date();

    // Verify timestamps are within reasonable range
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.updated_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());

    // In a new meeting, created_at and updated_at should be very close
    const timeDiff = Math.abs(result.updated_at.getTime() - result.created_at.getTime());
    expect(timeDiff).toBeLessThan(1000); // Less than 1 second difference
  });

  it('should handle various audio file paths', async () => {
    const testCases = [
      { path: '/uploads/audio.mp3', expected: '/uploads/audio.mp3' },
      { path: 'relative/path/audio.wav', expected: 'relative/path/audio.wav' },
      { path: '/very/long/path/to/audio/file/meeting_recording_2024_01_15_team_standup.m4a', expected: '/very/long/path/to/audio/file/meeting_recording_2024_01_15_team_standup.m4a' }
    ];

    for (const testCase of testCases) {
      const result = await createMeeting({
        title: `Meeting for ${testCase.path}`,
        audio_file_path: testCase.path
      });

      expect(result.audio_file_path).toEqual(testCase.expected);
    }
  });
});