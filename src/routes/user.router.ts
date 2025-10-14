import { Router } from "express";
import { verifyToken } from "../middlewares/AuthToken";
import { UserController } from "../controllers/user.controller";

const UserRoute = Router();

UserRoute.post("/user/create", verifyToken, UserController.createUser);
UserRoute.post("/user/login", UserController.login);
UserRoute.post("/user/update", UserController.updateUser);
UserRoute.post("/user/delete", UserController.deleteUser);

export default UserRoute;