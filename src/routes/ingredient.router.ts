import { Router } from "express";
import { verifyToken } from "../middlewares/AuthToken";
import { IngredientController } from "../controllers/ingredient.controller";

const IngredientRoute = Router();

IngredientRoute.post("/ingredient/create", verifyToken, IngredientController.createIngredient);
IngredientRoute.get("/ingredients", verifyToken, IngredientController.getAllIngredients);

export default IngredientRoute;