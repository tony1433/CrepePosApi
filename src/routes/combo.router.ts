import { Router } from "express";
import { verifyToken } from "../middlewares/AuthToken";
import { ComboController } from "../controllers/combo.controller";

const ComboRoute = Router();

ComboRoute.post("/combo/create", verifyToken, ComboController.createCombo);
ComboRoute.get("/combo/all", verifyToken, ComboController.getAllCombos);

export default ComboRoute;