import cron from "node-cron";
import { UserService } from "../modules/user/user.service";

/**
 * Registers all scheduled background jobs. Called once at server startup.
 */
export const startScheduler = () => {
  // Every 10 minutes: finalize any death reports whose 24h window has elapsed.
  cron.schedule("*/10 * * * *", async () => {
    try {
      await UserService.sweepPendingDeathReports();
    } catch (err) {
      console.error("Death-report sweep failed:", err);
    }
  });

  console.log("⏰ Scheduler started (death-report sweep every 10 min).");
};
