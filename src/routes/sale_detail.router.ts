import { Router } from "express";
import { verifyToken } from "../middlewares/AuthToken";
import { SaleDetailController } from "../controllers/sale_detail.controller";

const SaleDetailRoute = Router();

SaleDetailRoute.post("/sale/detail/create", verifyToken, SaleDetailController.createSaleDetail);
SaleDetailRoute.get("/sale/detail/all", verifyToken, SaleDetailController.getAllSaleDetails);

export default SaleDetailRoute;