import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { meetingsTable } from '../db/schema';
import { getProcessingStatus } from '../handlers/get_processing_status';

describe('getProcessingStatus', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return pending status for new meeting with no processing', async () => {
    // Create a basic meeting with no processing data
    const meeting = await db.insert(meetingsTable)
      .values({
        title: 'Test Meeting',
        description: 'A test meeting',
        audio_file_path: null,
        transcript: null,
        summary: null,
        tone_analysis: null,
        action_items: null,
        mind_map: null,
        duration: null
      })
      .returning()
      .execute();

    const result = await getProcessingStatus(meeting[0].id);

    expect(result.meeting_id).toEqual(meeting[0].id);
    expect(result.status).toEqual('pending');
    expect(result.progress).toEqual(0);
    expect(result.message).toEqual('Waiting to start processing');
  });

  it('should return processing status when audio file exists but no transcript', async () => {
    // Create meeting with audio file but no transcript
    const meeting = await db.insert(meetingsTable)
      .values({
        title: 'Test Meeting',
        description: 'A test meeting',
        audio_file_path: '/path/to/audio.mp3',
        transcript: null,
        summary: null,
        tone_analysis: null,
        action_items: null,
        mind_map: null,
        duration: null
      })
      .returning()
      .execute();

    const result = await getProcessingStatus(meeting[0].id);

    expect(result.meeting_id).toEqual(meeting[0].id);
    expect(result.status).toEqual('processing');
    expect(result.progress).toEqual(25);
    expect(result.message).toEqual('Transcribing audio file');
  });

  it('should return processing status when transcript exists but AI content is missing', async () => {
    // Create meeting with transcript but missing some AI content
    const meeting = await db.insert(meetingsTable)
      .values({
        title: 'Test Meeting',
        description: 'A test meeting',
        audio_file_path: '/path/to/audio.mp3',
        transcript: 'This is the meeting transcript',
        summary: 'Meeting summary',
        tone_analysis: null, // Missing AI content
        action_items: null, // Missing AI content
        mind_map: null, // Missing AI content
        duration: 1800
      })
      .returning()
      .execute();

    const result = await getProcessingStatus(meeting[0].id);

    expect(result.meeting_id).toEqual(meeting[0].id);
    expect(result.status).toEqual('processing');
    expect(result.progress).toEqual(60);
    expect(result.message).toEqual('Processing transcript with AI');
  });

  it('should return completed status when all processing is done', async () => {
    // Create fully processed meeting
    const meeting = await db.insert(meetingsTable)
      .values({
        title: 'Test Meeting',
        description: 'A test meeting',
        audio_file_path: '/path/to/audio.mp3',
        transcript: 'This is the meeting transcript',
        summary: 'Meeting summary',
        tone_analysis: 'Positive tone analysis',
        action_items: 'Action items list',
        mind_map: 'Mind map data',
        duration: 1800
      })
      .returning()
      .execute();

    const result = await getProcessingStatus(meeting[0].id);

    expect(result.meeting_id).toEqual(meeting[0].id);
    expect(result.status).toEqual('completed');
    expect(result.progress).toEqual(100);
    expect(result.message).toEqual('Meeting processing completed successfully');
  });

  it('should throw error for non-existent meeting', async () => {
    const nonExistentId = 99999;

    await expect(getProcessingStatus(nonExistentId))
      .rejects.toThrow(/Meeting with ID 99999 not found/i);
  });

  it('should handle meeting with partial AI processing', async () => {
    // Create meeting with some but not all AI content
    const meeting = await db.insert(meetingsTable)
      .values({
        title: 'Test Meeting',
        description: 'A test meeting',
        audio_file_path: '/path/to/audio.mp3',
        transcript: 'This is the meeting transcript',
        summary: 'Meeting summary',
        tone_analysis: 'Positive tone analysis',
        action_items: 'Action items list',
        mind_map: null, // Missing this one
        duration: 1800
      })
      .returning()
      .execute();

    const result = await getProcessingStatus(meeting[0].id);

    expect(result.meeting_id).toEqual(meeting[0].id);
    expect(result.status).toEqual('processing');
    expect(result.progress).toEqual(60);
    expect(result.message).toEqual('Processing transcript with AI');
  });

  it('should handle meeting without audio file but with transcript', async () => {
    // Create meeting with direct transcript input (no audio file)
    const meeting = await db.insert(meetingsTable)
      .values({
        title: 'Test Meeting',
        description: 'A test meeting',
        audio_file_path: null, // No audio file
        transcript: 'This is the meeting transcript',
        summary: null,
        tone_analysis: null,
        action_items: null,
        mind_map: null,
        duration: null
      })
      .returning()
      .execute();

    const result = await getProcessingStatus(meeting[0].id);

    expect(result.meeting_id).toEqual(meeting[0].id);
    expect(result.status).toEqual('processing');
    expect(result.progress).toEqual(60);
    expect(result.message).toEqual('Processing transcript with AI');
  });
});