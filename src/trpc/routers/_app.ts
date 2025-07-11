import { createTRPCRouter } from '../init';
import { messageRouter } from '@/modules/messages/server/procedures';
import { projectRouter } from '@/modules/projects/server/procedure';

export const appRouter = createTRPCRouter({
    projects : projectRouter,
    messages : messageRouter,
});

export type AppRouter = typeof appRouter;