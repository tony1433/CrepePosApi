"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AuthToken_1 = require("../middlewares/AuthToken");
const sale_detail_controller_1 = require("../controllers/sale_detail.controller");
const SaleDetailRoute = (0, express_1.Router)();
SaleDetailRoute.post("/sale/detail/create", AuthToken_1.verifyToken, sale_detail_controller_1.SaleDetailController.createSaleDetail);
SaleDetailRoute.get("/sale/detail/all", AuthToken_1.verifyToken, sale_detail_controller_1.SaleDetailController.getAllSaleDetails);
exports.default = SaleDetailRoute;
