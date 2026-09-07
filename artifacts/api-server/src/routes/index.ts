import { Router, type IRouter } from "express";
import healthRouter from "./health";
import staffPanelRouter from "./staff-panel";

const router: IRouter = Router();

router.use(healthRouter);
router.use(staffPanelRouter);

export default router;
