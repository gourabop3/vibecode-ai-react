import { getUsageStatus, getUsageTracker } from "@/lib/usage";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";

export const usageProcedure = createTRPCRouter({
    status : protectedProcedure.query(async ()=>{
        try {
            
            const result = await getUsageStatus();
            return result;

        } catch {
            return null;
        }
    })
})