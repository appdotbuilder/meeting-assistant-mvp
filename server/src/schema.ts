import { z } from 'zod';

// Meeting schema
export const meetingSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  audio_file_path: z.string().nullable(),
  transcript: z.string().nullable(),
  summary: z.string().nullable(),
  tone_analysis: z.string().nullable(),
  action_items: z.string().nullable(),
  mind_map: z.string().nullable(),
  duration: z.number().nullable(), // Duration in seconds
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Meeting = z.infer<typeof meetingSchema>;

// Input schema for creating meetings
export const createMeetingInputSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().nullable().optional(),
  audio_file_path: z.string().nullable().optional()
});

export type CreateMeetingInput = z.infer<typeof createMeetingInputSchema>;

// Input schema for updating meetings
export const updateMeetingInputSchema = z.object({
  id: z.number(),
  title: z.string().optional(),
  description: z.string().nullable().optional(),
  audio_file_path: z.string().nullable().optional(),
  transcript: z.string().nullable().optional(),
  summary: z.string().nullable().optional(),
  tone_analysis: z.string().nullable().optional(),
  action_items: z.string().nullable().optional(),
  mind_map: z.string().nullable().optional(),
  duration: z.number().nullable().optional()
});

export type UpdateMeetingInput = z.infer<typeof updateMeetingInputSchema>;

// Processing status enum
export const processingStatusSchema = z.enum(['pending', 'processing', 'completed', 'failed']);
export type ProcessingStatus = z.infer<typeof processingStatusSchema>;

// Input schema for audio upload and processing
export const processAudioInputSchema = z.object({
  meeting_id: z.number(),
  audio_file_path: z.string()
});

export type ProcessAudioInput = z.infer<typeof processAudioInputSchema>;

// Input schema for text processing (when transcript is provided directly)
export const processTextInputSchema = z.object({
  meeting_id: z.number(),
  transcript: z.string()
});

export type ProcessTextInput = z.infer<typeof processTextInputSchema>;

// Response schema for processing status
export const processingStatusResponseSchema = z.object({
  meeting_id: z.number(),
  status: processingStatusSchema,
  message: z.string().nullable(),
  progress: z.number().min(0).max(100) // Progress percentage
});

export type ProcessingStatusResponse = z.infer<typeof processingStatusResponseSchema>;

// Dashboard data schema
export const dashboardDataSchema = z.object({
  meeting: meetingSchema,
  components: z.object({
    summary: z.string().nullable(),
    tone_analysis: z.string().nullable(),
    action_items: z.string().nullable(),
    mind_map: z.string().nullable()
  })
});

export type DashboardData = z.infer<typeof dashboardDataSchema>;