import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import { UserModel } from "../user/user.model";
import { PaymentModel } from "../payment/payment.model";
import { UserInsuranceModel } from "../userInsurance/userInsurance.model";
import { NotaryModel } from "../notary/notary.model";
import { InsuranceListModel } from "../insuranceList/insuranceList.model";

const getDashboardStats = catchAsync(async (req: Request, res: Response) => {
  const period = (req.query.period as string) || "daily";

  // --- Stats cards ---
  const [totalRevenueAgg, totalTransactions, activeUsers] = await Promise.all([
    PaymentModel.aggregate([
      { $match: { status: "paid" } },
      { $group: { _id: null, total: { $sum: "$amountTotal" } } },
    ]),
    PaymentModel.countDocuments({ status: "paid" }),
    UserModel.countDocuments({ isDeleted: false, role: { $ne: "admin" } }),
  ]);

  const totalRevenue = totalRevenueAgg[0]?.total || 0;

  // --- Previous period stats for percentage change ---
  const now = new Date();
  let currentStart: Date;
  let previousStart: Date;

  if (period === "monthly") {
    currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
    previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  } else if (period === "weekly") {
    const dayOfWeek = now.getDay();
    currentStart = new Date(now);
    currentStart.setDate(now.getDate() - dayOfWeek);
    currentStart.setHours(0, 0, 0, 0);
    previousStart = new Date(currentStart);
    previousStart.setDate(previousStart.getDate() - 7);
  } else {
    // daily - compare today vs yesterday
    currentStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    previousStart = new Date(currentStart);
    previousStart.setDate(previousStart.getDate() - 1);
  }

  const [currentRevAgg, previousRevAgg, currentTx, previousTx, currentUsers, previousUsers] =
    await Promise.all([
      PaymentModel.aggregate([
        { $match: { status: "paid", createdAt: { $gte: currentStart } } },
        { $group: { _id: null, total: { $sum: "$amountTotal" } } },
      ]),
      PaymentModel.aggregate([
        { $match: { status: "paid", createdAt: { $gte: previousStart, $lt: currentStart } } },
        { $group: { _id: null, total: { $sum: "$amountTotal" } } },
      ]),
      PaymentModel.countDocuments({ status: "paid", createdAt: { $gte: currentStart } }),
      PaymentModel.countDocuments({ status: "paid", createdAt: { $gte: previousStart, $lt: currentStart } }),
      UserModel.countDocuments({ isDeleted: false, role: { $ne: "admin" }, createdAt: { $gte: currentStart } }),
      UserModel.countDocuments({ isDeleted: false, role: { $ne: "admin" }, createdAt: { $gte: previousStart, $lt: currentStart } }),
    ]);

  const calcChange = (current: number, previous: number): string => {
    if (previous === 0) return current > 0 ? "+100%" : "0%";
    const change = ((current - previous) / previous) * 100;
    return `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`;
  };

  const revenueChange = calcChange(currentRevAgg[0]?.total || 0, previousRevAgg[0]?.total || 0);
  const txChange = calcChange(currentTx, previousTx);
  const userChange = calcChange(currentUsers, previousUsers);

  // --- Revenue chart data ---
  let chartData: { label: string; revenue: number }[] = [];

  if (period === "daily") {
    // Last 14 days
    const start = new Date(now);
    start.setDate(start.getDate() - 13);
    start.setHours(0, 0, 0, 0);

    const dailyAgg = await PaymentModel.aggregate([
      { $match: { status: "paid", createdAt: { $gte: start } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$amountTotal" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const revenueMap = new Map(dailyAgg.map((d: any) => [d._id, d.revenue]));
    for (let i = 0; i < 14; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split("T")[0];
      const label = d.toLocaleDateString("en-US", { weekday: "short" });
      chartData.push({ label, revenue: revenueMap.get(key) || 0 });
    }
  } else if (period === "weekly") {
    // Last 8 weeks
    const start = new Date(now);
    start.setDate(start.getDate() - 55);
    start.setHours(0, 0, 0, 0);

    const weeklyAgg = await PaymentModel.aggregate([
      { $match: { status: "paid", createdAt: { $gte: start } } },
      {
        $group: {
          _id: { $isoWeek: "$createdAt" },
          revenue: { $sum: "$amountTotal" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const revenueMap = new Map(weeklyAgg.map((d: any) => [d._id, d.revenue]));
    for (let i = 7; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i * 7);
      const weekNum = getISOWeek(d);
      chartData.push({
        label: `Week ${weekNum}`,
        revenue: revenueMap.get(weekNum) || 0,
      });
    }
  } else {
    // Monthly - last 12 months
    const monthlyAgg = await PaymentModel.aggregate([
      {
        $match: {
          status: "paid",
          createdAt: { $gte: new Date(now.getFullYear(), now.getMonth() - 11, 1) },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          revenue: { $sum: "$amountTotal" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const revenueMap = new Map(monthlyAgg.map((d: any) => [d._id, d.revenue]));
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("en-US", { month: "short" });
      chartData.push({ label, revenue: revenueMap.get(key) || 0 });
    }
  }

  // --- Growth report ---
  const [insuranceCount, notaryCount, funeralCount] = await Promise.all([
    UserInsuranceModel.countDocuments({ isDeleted: false }),
    NotaryModel.countDocuments({ isDeleted: false }),
    InsuranceListModel.countDocuments({ isDeleted: false }),
  ]);

  const growthTotal = Math.max(insuranceCount + notaryCount + funeralCount, 1);

  const growthReport = [
    { label: "Insurance Signups", value: Math.round((insuranceCount / growthTotal) * 100) },
    { label: "Notary Appointments", value: Math.round((notaryCount / growthTotal) * 100) },
    { label: "Funeral Plans", value: Math.round((funeralCount / growthTotal) * 100) },
  ];

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Dashboard stats retrieved successfully",
    data: {
      stats: {
        totalRevenue,
        revenueChange,
        totalTransactions,
        txChange,
        activeUsers,
        userChange,
      },
      chartData,
      growthReport,
    },
  });
});

function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export const DashboardController = {
  getDashboardStats,
};
