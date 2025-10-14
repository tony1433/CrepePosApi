"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AuthToken_1 = require("../middlewares/AuthToken");
const combo_detail_controller_1 = require("../controllers/combo_detail.controller");
const ComboDetailRoute = (0, express_1.Router)();
ComboDetailRoute.post("/combo/detail/create", AuthToken_1.verifyToken, combo_detail_controller_1.ComboDetailController.createComboDetail);
ComboDetailRoute.get("/combo/detail/all", AuthToken_1.verifyToken, combo_detail_controller_1.ComboDetailController.getAllComboDetails);
exports.default = ComboDetailRoute;
