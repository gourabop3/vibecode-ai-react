import { createTRPCRouter } from '../init';
import { messageRouter } from '@/modules/messages/server/procedures';
import { projectRouter } from '@/modules/projects/server/procedure';
import { usageProcedure } from '@/modules/usage/server/procedure';

export const appRouter = createTRPCRouter({
    projects : projectRouter,
    messages : messageRouter,
    usage : usageProcedure
});

export type AppRouter = typeof appRouter;