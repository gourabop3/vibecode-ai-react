import { cache } from "react";
import superjson from "superjson";
import { auth } from "@clerk/nextjs/server";
import { initTRPC, TRPCError } from "@trpc/server";

export const createTRPCContext = cache(async() => {
  return {
    auth : await auth()
  };
});

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;

export const t = initTRPC.context<Context>().create({
  transformer: superjson
});

const isAuthenticated = t.middleware(({ ctx, next }) => {
  if (!ctx.auth.userId) {
    throw new TRPCError({
      code : "UNAUTHORIZED",
      message : "You must be logged in to access this resource."
    });
  }
  return next({
    ctx: {
      ...ctx,
      userId: ctx.auth.userId
    }
  });
})

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(isAuthenticated);
