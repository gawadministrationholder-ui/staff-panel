import { Router, type IRouter } from "express";
import healthRouter from "./health";
import staffPanelRouter from "./staff-panel";
import orgChartRouter from "./org-chart";
import customPagesRouter from "./custom-pages";
import statusRouter from "./status";
import announcementsRouter from "./announcements";

const router: IRouter = Router();

router.use(healthRouter);
router.use(staffPanelRouter);
router.use(orgChartRouter);
router.use(customPagesRouter);
router.use(statusRouter);
router.use(announcementsRouter);

export default router;
