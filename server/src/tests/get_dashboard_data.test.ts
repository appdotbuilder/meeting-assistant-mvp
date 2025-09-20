import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { meetingsTable } from '../db/schema';
import { type CreateMeetingInput } from '../schema';
import { getDashboardData } from '../handlers/get_dashboard_data';

// Test meeting data with all fields populated
const completeMeetingInput = {
  title: 'Complete Meeting',
  description: 'A fully processed meeting with all components',
  audio_file_path: '/uploads/complete-meeting.mp3'
};

const incompleteMeetingInput = {
  title: 'Incomplete Meeting',
  description: 'A meeting still being processed',
  audio_file_path: '/uploads/incomplete-meeting.mp3'
};

describe('getDashboardData', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return dashboard data for a complete meeting', async () => {
    // Create a meeting with all AI processing complete
    const result = await db.insert(meetingsTable)
      .values({
        title: completeMeetingInput.title,
        description: completeMeetingInput.description,
        audio_file_path: completeMeetingInput.audio_file_path,
        transcript: 'This is the full transcript of the meeting...',
        summary: 'Meeting summary: Key points discussed include...',
        tone_analysis: 'Tone: Professional and collaborative',
        action_items: '1. Review project timeline\n2. Schedule follow-up meeting',
        mind_map: 'Mind map data in JSON format',
        duration: 1800 // 30 minutes
      })
      .returning()
      .execute();

    const meetingId = result[0].id;
    const dashboardData = await getDashboardData(meetingId);

    // Validate the dashboard data structure
    expect(dashboardData).not.toBeNull();
    expect(dashboardData!.meeting).toBeDefined();
    expect(dashboardData!.components).toBeDefined();

    // Validate meeting data
    const meeting = dashboardData!.meeting;
    expect(meeting.id).toBe(meetingId);
    expect(meeting.title).toBe(completeMeetingInput.title);
    expect(meeting.description).toBe(completeMeetingInput.description);
    expect(meeting.audio_file_path).toBe(completeMeetingInput.audio_file_path);
    expect(meeting.transcript).toBe('This is the full transcript of the meeting...');
    expect(meeting.summary).toBe('Meeting summary: Key points discussed include...');
    expect(meeting.tone_analysis).toBe('Tone: Professional and collaborative');
    expect(meeting.action_items).toBe('1. Review project timeline\n2. Schedule follow-up meeting');
    expect(meeting.mind_map).toBe('Mind map data in JSON format');
    expect(meeting.duration).toBe(1800);
    expect(meeting.created_at).toBeInstanceOf(Date);
    expect(meeting.updated_at).toBeInstanceOf(Date);

    // Validate components data
    const components = dashboardData!.components;
    expect(components.summary).toBe('Meeting summary: Key points discussed include...');
    expect(components.tone_analysis).toBe('Tone: Professional and collaborative');
    expect(components.action_items).toBe('1. Review project timeline\n2. Schedule follow-up meeting');
    expect(components.mind_map).toBe('Mind map data in JSON format');
  });

  it('should return dashboard data for an incomplete meeting with null components', async () => {
    // Create a meeting that's still being processed
    const result = await db.insert(meetingsTable)
      .values({
        title: incompleteMeetingInput.title,
        description: incompleteMeetingInput.description,
        audio_file_path: incompleteMeetingInput.audio_file_path,
        transcript: 'Partial transcript...',
        // summary, tone_analysis, action_items, mind_map are null
        duration: null
      })
      .returning()
      .execute();

    const meetingId = result[0].id;
    const dashboardData = await getDashboardData(meetingId);

    // Validate the dashboard data structure
    expect(dashboardData).not.toBeNull();
    expect(dashboardData!.meeting).toBeDefined();
    expect(dashboardData!.components).toBeDefined();

    // Validate meeting data
    const meeting = dashboardData!.meeting;
    expect(meeting.id).toBe(meetingId);
    expect(meeting.title).toBe(incompleteMeetingInput.title);
    expect(meeting.transcript).toBe('Partial transcript...');
    expect(meeting.summary).toBeNull();
    expect(meeting.tone_analysis).toBeNull();
    expect(meeting.action_items).toBeNull();
    expect(meeting.mind_map).toBeNull();
    expect(meeting.duration).toBeNull();

    // Validate components are null for incomplete processing
    const components = dashboardData!.components;
    expect(components.summary).toBeNull();
    expect(components.tone_analysis).toBeNull();
    expect(components.action_items).toBeNull();
    expect(components.mind_map).toBeNull();
  });

  it('should return null for non-existent meeting', async () => {
    const nonExistentMeetingId = 99999;
    const dashboardData = await getDashboardData(nonExistentMeetingId);

    expect(dashboardData).toBeNull();
  });

  it('should handle meeting with minimal data', async () => {
    // Create a meeting with only required fields
    const result = await db.insert(meetingsTable)
      .values({
        title: 'Minimal Meeting'
        // All other fields are nullable and will be null
      })
      .returning()
      .execute();

    const meetingId = result[0].id;
    const dashboardData = await getDashboardData(meetingId);

    // Validate the dashboard data structure
    expect(dashboardData).not.toBeNull();
    
    // Validate meeting data
    const meeting = dashboardData!.meeting;
    expect(meeting.id).toBe(meetingId);
    expect(meeting.title).toBe('Minimal Meeting');
    expect(meeting.description).toBeNull();
    expect(meeting.audio_file_path).toBeNull();
    expect(meeting.transcript).toBeNull();
    expect(meeting.created_at).toBeInstanceOf(Date);
    expect(meeting.updated_at).toBeInstanceOf(Date);

    // Validate all components are null
    const components = dashboardData!.components;
    expect(components.summary).toBeNull();
    expect(components.tone_analysis).toBeNull();
    expect(components.action_items).toBeNull();
    expect(components.mind_map).toBeNull();
  });

  it('should retrieve correct meeting when multiple meetings exist', async () => {
    // Create multiple meetings
    const meeting1 = await db.insert(meetingsTable)
      .values({
        title: 'First Meeting',
        summary: 'Summary for first meeting'
      })
      .returning()
      .execute();

    const meeting2 = await db.insert(meetingsTable)
      .values({
        title: 'Second Meeting',
        summary: 'Summary for second meeting'
      })
      .returning()
      .execute();

    // Get dashboard data for the second meeting
    const dashboardData = await getDashboardData(meeting2[0].id);

    expect(dashboardData).not.toBeNull();
    expect(dashboardData!.meeting.id).toBe(meeting2[0].id);
    expect(dashboardData!.meeting.title).toBe('Second Meeting');
    expect(dashboardData!.components.summary).toBe('Summary for second meeting');
  });
});