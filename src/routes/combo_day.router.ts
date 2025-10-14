import { Router } from "express";
import { verifyToken } from "../middlewares/AuthToken";
import { ComboDayController } from "../controllers/combo_day.controller";

const ComboDayRoute = Router();

ComboDayRoute.post("/combo/day/create", verifyToken, ComboDayController.createComboDay);
ComboDayRoute.get("/combo/day/all", verifyToken, ComboDayController.getAllComboDays);

export default ComboDayRoute;