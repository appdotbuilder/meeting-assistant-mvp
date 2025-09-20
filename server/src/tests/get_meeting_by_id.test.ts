import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { meetingsTable } from '../db/schema';
import { getMeetingById } from '../handlers/get_meeting_by_id';

describe('getMeetingById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return a meeting when it exists', async () => {
    // Create test meeting
    const testMeeting = {
      title: 'Test Meeting',
      description: 'A meeting for testing',
      audio_file_path: '/path/to/audio.mp3',
      transcript: 'This is a test transcript',
      summary: 'Meeting summary',
      tone_analysis: 'Positive tone',
      action_items: 'Follow up on tasks',
      mind_map: 'Mind map data',
      duration: 1800 // 30 minutes in seconds
    };

    const insertResult = await db.insert(meetingsTable)
      .values(testMeeting)
      .returning()
      .execute();

    const createdMeeting = insertResult[0];

    // Test the handler
    const result = await getMeetingById(createdMeeting.id);

    // Verify the meeting was found and all fields are correct
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdMeeting.id);
    expect(result!.title).toEqual('Test Meeting');
    expect(result!.description).toEqual('A meeting for testing');
    expect(result!.audio_file_path).toEqual('/path/to/audio.mp3');
    expect(result!.transcript).toEqual('This is a test transcript');
    expect(result!.summary).toEqual('Meeting summary');
    expect(result!.tone_analysis).toEqual('Positive tone');
    expect(result!.action_items).toEqual('Follow up on tasks');
    expect(result!.mind_map).toEqual('Mind map data');
    expect(result!.duration).toEqual(1800);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when meeting does not exist', async () => {
    // Test with a non-existent ID
    const result = await getMeetingById(999);
    
    expect(result).toBeNull();
  });

  it('should handle meeting with null values', async () => {
    // Create minimal meeting with only required fields
    const minimalMeeting = {
      title: 'Minimal Meeting'
    };

    const insertResult = await db.insert(meetingsTable)
      .values(minimalMeeting)
      .returning()
      .execute();

    const createdMeeting = insertResult[0];

    // Test the handler
    const result = await getMeetingById(createdMeeting.id);

    // Verify the meeting was found with null values handled correctly
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdMeeting.id);
    expect(result!.title).toEqual('Minimal Meeting');
    expect(result!.description).toBeNull();
    expect(result!.audio_file_path).toBeNull();
    expect(result!.transcript).toBeNull();
    expect(result!.summary).toBeNull();
    expect(result!.tone_analysis).toBeNull();
    expect(result!.action_items).toBeNull();
    expect(result!.mind_map).toBeNull();
    expect(result!.duration).toBeNull();
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should verify meeting persists in database correctly', async () => {
    // Create a meeting with specific content
    const testMeeting = {
      title: 'Database Persistence Test',
      description: 'Testing database storage',
      transcript: 'Complete transcript of the meeting',
      duration: 3600
    };

    const insertResult = await db.insert(meetingsTable)
      .values(testMeeting)
      .returning()
      .execute();

    const meetingId = insertResult[0].id;

    // Fetch using handler
    const handlerResult = await getMeetingById(meetingId);

    // Verify handler result matches database content
    expect(handlerResult).not.toBeNull();
    expect(handlerResult!.title).toEqual('Database Persistence Test');
    expect(handlerResult!.description).toEqual('Testing database storage');
    expect(handlerResult!.transcript).toEqual('Complete transcript of the meeting');
    expect(handlerResult!.duration).toEqual(3600);
    
    // Verify types are correct
    expect(typeof handlerResult!.id).toBe('number');
    expect(typeof handlerResult!.title).toBe('string');
    expect(typeof handlerResult!.duration).toBe('number');
  });

  it('should handle concurrent access correctly', async () => {
    // Create test meeting
    const testMeeting = {
      title: 'Concurrent Access Test',
      description: 'Testing concurrent database access'
    };

    const insertResult = await db.insert(meetingsTable)
      .values(testMeeting)
      .returning()
      .execute();

    const meetingId = insertResult[0].id;

    // Make multiple concurrent requests for the same meeting
    const promises = Array.from({ length: 3 }, () => getMeetingById(meetingId));
    const results = await Promise.all(promises);

    // All requests should return the same meeting data
    results.forEach(result => {
      expect(result).not.toBeNull();
      expect(result!.id).toEqual(meetingId);
      expect(result!.title).toEqual('Concurrent Access Test');
      expect(result!.description).toEqual('Testing concurrent database access');
    });
  });
});