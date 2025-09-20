import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { meetingsTable } from '../db/schema';
import { type CreateMeetingInput } from '../schema';
import { getMeetings } from '../handlers/get_meetings';

// Test data
const testMeeting1: CreateMeetingInput = {
  title: 'Team Standup',
  description: 'Daily team standup meeting',
  audio_file_path: '/uploads/audio/standup.mp3'
};

const testMeeting2: CreateMeetingInput = {
  title: 'Product Review',
  description: 'Quarterly product review session',
  audio_file_path: null
};

const testMeeting3: CreateMeetingInput = {
  title: 'Client Call',
  description: null,
  audio_file_path: '/uploads/audio/client.wav'
};

describe('getMeetings', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no meetings exist', async () => {
    const result = await getMeetings();

    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });

  it('should return all meetings with correct structure', async () => {
    // Create test meetings
    await db.insert(meetingsTable).values([
      {
        title: testMeeting1.title,
        description: testMeeting1.description,
        audio_file_path: testMeeting1.audio_file_path
      },
      {
        title: testMeeting2.title,
        description: testMeeting2.description,
        audio_file_path: testMeeting2.audio_file_path
      }
    ]).execute();

    const result = await getMeetings();

    expect(result).toHaveLength(2);

    // Check first meeting structure
    const meeting1 = result.find(m => m.title === 'Team Standup');
    expect(meeting1).toBeDefined();
    expect(meeting1!.title).toEqual('Team Standup');
    expect(meeting1!.description).toEqual('Daily team standup meeting');
    expect(meeting1!.audio_file_path).toEqual('/uploads/audio/standup.mp3');
    expect(meeting1!.id).toBeDefined();
    expect(meeting1!.created_at).toBeInstanceOf(Date);
    expect(meeting1!.updated_at).toBeInstanceOf(Date);

    // Check nullable fields are properly handled
    expect(meeting1!.transcript).toBeNull();
    expect(meeting1!.summary).toBeNull();
    expect(meeting1!.tone_analysis).toBeNull();
    expect(meeting1!.action_items).toBeNull();
    expect(meeting1!.mind_map).toBeNull();
    expect(meeting1!.duration).toBeNull();

    // Check second meeting
    const meeting2 = result.find(m => m.title === 'Product Review');
    expect(meeting2).toBeDefined();
    expect(meeting2!.audio_file_path).toBeNull();
  });

  it('should return meetings ordered by creation date (newest first)', async () => {
    // Create meetings with slight delay to ensure different timestamps
    await db.insert(meetingsTable).values({
      title: 'First Meeting',
      description: 'This was created first'
    }).execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(meetingsTable).values({
      title: 'Second Meeting',
      description: 'This was created second'
    }).execute();

    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(meetingsTable).values({
      title: 'Third Meeting',
      description: 'This was created third'
    }).execute();

    const result = await getMeetings();

    expect(result).toHaveLength(3);
    
    // Should be ordered by creation date, newest first
    expect(result[0].title).toEqual('Third Meeting');
    expect(result[1].title).toEqual('Second Meeting');
    expect(result[2].title).toEqual('First Meeting');

    // Verify timestamps are properly ordered
    expect(result[0].created_at >= result[1].created_at).toBe(true);
    expect(result[1].created_at >= result[2].created_at).toBe(true);
  });

  it('should handle meetings with all nullable fields as null', async () => {
    await db.insert(meetingsTable).values({
      title: 'Minimal Meeting',
      description: null,
      audio_file_path: null
    }).execute();

    const result = await getMeetings();

    expect(result).toHaveLength(1);
    const meeting = result[0];

    expect(meeting.title).toEqual('Minimal Meeting');
    expect(meeting.description).toBeNull();
    expect(meeting.audio_file_path).toBeNull();
    expect(meeting.transcript).toBeNull();
    expect(meeting.summary).toBeNull();
    expect(meeting.tone_analysis).toBeNull();
    expect(meeting.action_items).toBeNull();
    expect(meeting.mind_map).toBeNull();
    expect(meeting.duration).toBeNull();
    expect(meeting.created_at).toBeInstanceOf(Date);
    expect(meeting.updated_at).toBeInstanceOf(Date);
  });

  it('should handle meetings with processed data', async () => {
    // Create a meeting with all fields populated
    await db.insert(meetingsTable).values({
      title: 'Processed Meeting',
      description: 'Meeting with full AI processing',
      audio_file_path: '/uploads/audio/processed.mp3',
      transcript: 'This is the meeting transcript...',
      summary: 'Meeting summary with key points',
      tone_analysis: 'Positive and collaborative tone',
      action_items: '1. Follow up on project\n2. Schedule next meeting',
      mind_map: 'JSON representation of mind map',
      duration: 1800 // 30 minutes in seconds
    }).execute();

    const result = await getMeetings();

    expect(result).toHaveLength(1);
    const meeting = result[0];

    expect(meeting.title).toEqual('Processed Meeting');
    expect(meeting.transcript).toEqual('This is the meeting transcript...');
    expect(meeting.summary).toEqual('Meeting summary with key points');
    expect(meeting.tone_analysis).toEqual('Positive and collaborative tone');
    expect(meeting.action_items).toEqual('1. Follow up on project\n2. Schedule next meeting');
    expect(meeting.mind_map).toEqual('JSON representation of mind map');
    expect(meeting.duration).toEqual(1800);
  });

  it('should handle large number of meetings efficiently', async () => {
    // Create multiple meetings
    const meetings = Array.from({ length: 50 }, (_, i) => ({
      title: `Meeting ${i + 1}`,
      description: `Description for meeting ${i + 1}`,
      audio_file_path: i % 2 === 0 ? `/uploads/audio/meeting${i + 1}.mp3` : null
    }));

    await db.insert(meetingsTable).values(meetings).execute();

    const result = await getMeetings();

    expect(result).toHaveLength(50);
    
    // Verify all meetings are returned with correct structure
    result.forEach((meeting, index) => {
      expect(meeting.id).toBeDefined();
      expect(meeting.title).toMatch(/^Meeting \d+$/);
      expect(meeting.created_at).toBeInstanceOf(Date);
      expect(meeting.updated_at).toBeInstanceOf(Date);
    });

    // Verify ordering is maintained (newest first)
    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i].created_at >= result[i + 1].created_at).toBe(true);
    }
  });
});