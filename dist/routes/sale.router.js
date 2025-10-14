"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AuthToken_1 = require("../middlewares/AuthToken");
const sale_controller_1 = require("../controllers/sale.controller");
const SaleRoute = (0, express_1.Router)();
SaleRoute.post("/sale/create", AuthToken_1.verifyToken, sale_controller_1.SaleController.createSale);
SaleRoute.get("/sale/all", AuthToken_1.verifyToken, sale_controller_1.SaleController.getAllSales);
exports.default = SaleRoute;
