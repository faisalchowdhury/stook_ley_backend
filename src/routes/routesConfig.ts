import { UserRoutes } from "../modules/user/user.route";
import { TermsRoutes } from "../modules/settings/Terms/Terms.route";
import { AboutRoutes } from "../modules/settings/About/About.route";
import { PrivacyRoutes } from "../modules/settings/privacy/Privacy.route";
import { NotificationRoutes } from "../modules/notifications/notification.route";

import {
  AppInstruction,
  htmlRoute,
} from "../modules/settings/privacy/Privacy.controller";
import { AdminRoutes } from "../modules/admin/admin.route";
import { AuthorizedRoutes } from "../modules/authorized/authorized.route";
import { KeeperRoutes } from "../modules/keeper/keeper.route";
import { InsuranceListRoutes } from "../modules/insuranceList/insuranceList.route";
import { UserInsuranceRoutes } from "../modules/userInsurance/userInsurance.route";
import { BucketCategoryRoutes } from "../modules/bucketCategory/bucketCategory.route";
import { BucketPriorityRoutes } from "../modules/bucketPriority/bucketPriority.route";
import { BucketStatusRoutes } from "../modules/bucketStatus/bucketStatus.route";
import { BucketListRoutes } from "../modules/bucketList/bucketList.route";
import { PointsRoutes } from "../modules/points/points.route";
import { NotaryRoutes } from "../modules/notary/notary.route";
import { PartnerRoutes } from "../modules/partner/partner.route";
import { ChildrenRoutes } from "../modules/children/children.route";

// import { PaymentRoute } from "../modules/unused_payments/payment.route";

export const routesConfig = [
  { path: "auth", handler: UserRoutes },

  { path: "keeper", handler: KeeperRoutes },
  { path: "insurance-list", handler: InsuranceListRoutes },
  { path: "user-insurance", handler: UserInsuranceRoutes },
  { path: "bucket-category", handler: BucketCategoryRoutes },
  { path: "bucket-priority", handler: BucketPriorityRoutes },
  { path: "bucket-status", handler: BucketStatusRoutes },
  { path: "bucket-list", handler: BucketListRoutes },
  { path: "points", handler: PointsRoutes },
  { path: "notary", handler: NotaryRoutes },
  { path: "partner", handler: PartnerRoutes },
  { path: "children", handler: ChildrenRoutes },

  { path: "terms", handler: TermsRoutes },
  { path: "about", handler: AboutRoutes },
  { path: "privacy", handler: PrivacyRoutes },
  { path: "notification", handler: NotificationRoutes },

  // { path: "/api/v1/payment", handler: PaymentRoute },

  { path: "admin", handler: AdminRoutes },

  //------>publishing app <--------------
  { path: "/privacy-policy-page", handler: htmlRoute },
  { path: "/app-instruction", handler: AppInstruction },
];
