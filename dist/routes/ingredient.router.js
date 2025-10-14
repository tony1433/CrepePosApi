"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AuthToken_1 = require("../middlewares/AuthToken");
const ingredient_controller_1 = require("../controllers/ingredient.controller");
const IngredientRoute = (0, express_1.Router)();
IngredientRoute.post("/ingredient/create", AuthToken_1.verifyToken, ingredient_controller_1.IngredientController.createIngredient);
IngredientRoute.get("/ingredients", AuthToken_1.verifyToken, ingredient_controller_1.IngredientController.getAllIngredients);
exports.default = IngredientRoute;
