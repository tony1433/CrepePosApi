import { Router } from "express";
import { verifyToken } from "../middlewares/AuthToken";
import { ProductIngredientController } from "../controllers/product_ingredient.controller";

const ProductIngredientRoute = Router();

ProductIngredientRoute.post("/product/ingredient/create", verifyToken, ProductIngredientController.createProductIngredient);
ProductIngredientRoute.get("/product/ingredient/all", verifyToken, ProductIngredientController.getAllProductIngredients);

export default ProductIngredientRoute;