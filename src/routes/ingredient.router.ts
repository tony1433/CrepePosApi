import { Router } from "express";
import { verifyToken } from "../middlewares/AuthToken";
import { IngredientController } from "../controllers/ingredient.controller";

const IngredientRoute = Router();

IngredientRoute.post("/ingredient/create", verifyToken, IngredientController.createIngredient);
IngredientRoute.get("/ingredients", verifyToken, IngredientController.getAllIngredients);
IngredientRoute.put("/ingredient/update", verifyToken, IngredientController.updateIngredient);
IngredientRoute.delete("/ingredient/delete", verifyToken, IngredientController.deleteIngredient);

export default IngredientRoute;