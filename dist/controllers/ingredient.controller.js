"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IngredientController = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const uuid_1 = require("uuid");
const common_1 = require("../utils/common");
exports.IngredientController = {
    createIngredient(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { current_stock, min_stock, unit_measurement, cost_unit } = req.body;
            try {
                // const ingredient = await prisma.ingredient.findFirst({
                //     where: {
                //        name: name,
                //     },
                // });
                // if (ingredient) {
                //     return res
                //         .status(409)
                //         .json({ message: "El ingrediente ya se encuentra registrado" });
                // }
                const uuid = (0, uuid_1.v4)();
                const uuidBuffer = (0, common_1.uuidToBuffer)(uuid);
                const newIngredient = yield prisma_1.default.ingredient.create({
                    data: {
                        id: uuidBuffer,
                        created_at: new Date(),
                        updated_at: new Date(),
                        current_stock: current_stock,
                        min_stock: min_stock,
                        unit_measurement: unit_measurement,
                        cost_unit: cost_unit,
                    },
                    select: {
                        id: true,
                        updated_at: true,
                        current_stock: true,
                        min_stock: true,
                        unit_measurement: true,
                        cost_unit: true,
                    },
                });
                if (!newIngredient) {
                    return res.status(400).json({ message: "Error al insertar ingrediente" });
                }
                res.status(200).json(newIngredient);
            }
            catch (error) {
                return res.status(500).json({ message: "Error de servidor" + error });
            }
        });
    },
    getAllIngredients(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const ingredients = yield prisma_1.default.ingredient.findMany({
                    select: {
                        id: true,
                        updated_at: true,
                        current_stock: true,
                        min_stock: true,
                        unit_measurement: true,
                        cost_unit: true,
                    },
                });
                const formattedIngredients = ingredients.map((ingredient) => (Object.assign(Object.assign({}, ingredient), { id: (0, common_1.bufferToUuid)(Buffer.from(ingredient.id)) })));
                res.status(200).json(formattedIngredients);
            }
            catch (error) {
                return res.status(500).json({ message: "Error de servidor" + error });
            }
        });
    },
};
