import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schema types
import { 
  createMeetingInputSchema,
  updateMeetingInputSchema,
  processAudioInputSchema,
  processTextInputSchema
} from './schema';

// Import handlers
import { createMeeting } from './handlers/create_meeting';
import { getMeetings } from './handlers/get_meetings';
import { getMeetingById } from './handlers/get_meeting_by_id';
import { updateMeeting } from './handlers/update_meeting';
import { processAudio } from './handlers/process_audio';
import { processText } from './handlers/process_text';
import { getProcessingStatus } from './handlers/get_processing_status';
import { getDashboardData } from './handlers/get_dashboard_data';
import { deleteMeeting } from './handlers/delete_meeting';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Meeting CRUD operations
  createMeeting: publicProcedure
    .input(createMeetingInputSchema)
    .mutation(({ input }) => createMeeting(input)),

  getMeetings: publicProcedure
    .query(() => getMeetings()),

  getMeetingById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getMeetingById(input.id)),

  updateMeeting: publicProcedure
    .input(updateMeetingInputSchema)
    .mutation(({ input }) => updateMeeting(input)),

  deleteMeeting: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteMeeting(input.id)),

  // AI Processing operations
  processAudio: publicProcedure
    .input(processAudioInputSchema)
    .mutation(({ input }) => processAudio(input)),

  processText: publicProcedure
    .input(processTextInputSchema)
    .mutation(({ input }) => processText(input)),

  getProcessingStatus: publicProcedure
    .input(z.object({ meetingId: z.number() }))
    .query(({ input }) => getProcessingStatus(input.meetingId)),

  // Dashboard data
  getDashboardData: publicProcedure
    .input(z.object({ meetingId: z.number() }))
    .query(({ input }) => getDashboardData(input.meetingId)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC Meeting Assistant server listening at port: ${port}`);
}

start();