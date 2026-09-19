import { Router, type IRouter } from "express";
import healthRouter from "./health";
import staffPanelRouter from "./staff-panel";
import orgChartRouter from "./org-chart";
import customPagesRouter from "./custom-pages";

const router: IRouter = Router();

router.use(healthRouter);
router.use(staffPanelRouter);
router.use(orgChartRouter);
router.use(customPagesRouter);

export default router;
