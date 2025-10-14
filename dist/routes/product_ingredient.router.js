"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AuthToken_1 = require("../middlewares/AuthToken");
const product_ingredient_controller_1 = require("../controllers/product_ingredient.controller");
const ProductIngredientRoute = (0, express_1.Router)();
ProductIngredientRoute.post("/product/ingredient/create", AuthToken_1.verifyToken, product_ingredient_controller_1.ProductIngredientController.createProductIngredient);
ProductIngredientRoute.get("/product/ingredient/all", AuthToken_1.verifyToken, product_ingredient_controller_1.ProductIngredientController.getAllProductIngredients);
exports.default = ProductIngredientRoute;
