"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AuthToken_1 = require("../middlewares/AuthToken");
const user_controller_1 = require("../controllers/user.controller");
const UserRoute = (0, express_1.Router)();
UserRoute.post("/user/create", AuthToken_1.verifyToken, user_controller_1.UserController.createUser);
UserRoute.post("/user/login", user_controller_1.UserController.login);
exports.default = UserRoute;
