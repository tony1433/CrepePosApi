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
exports.ProductIngredientController = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const common_1 = require("../utils/common");
exports.ProductIngredientController = {
    createProductIngredient(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { is_base, amount, product_id, ingredient_id } = req.body;
            try {
                const productIngredient = yield prisma_1.default.product_ingredient.create({
                    data: {
                        created_at: new Date(),
                        updated_at: new Date(),
                        is_base: is_base,
                        amount: amount,
                        product_id: (0, common_1.uuidToBuffer)(product_id),
                        ingredient_id: (0, common_1.uuidToBuffer)(ingredient_id),
                    },
                    select: {
                        updated_at: true,
                        amount: true,
                        is_base: true,
                        product_id: true,
                        ingredient_id: true,
                    },
                });
                if (!productIngredient) {
                    return res.status(400).json({ message: "Error al insertar ingrediente del producto" });
                }
                res.status(200).json(productIngredient);
            }
            catch (error) {
                return res.status(500).json({ message: "Error de servidor" + error });
            }
        });
    },
    getAllProductIngredients(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const productIngredients = yield prisma_1.default.product_ingredient.findMany({
                    select: {
                        updated_at: true,
                        is_base: true,
                        amount: true,
                        product_id: true,
                        ingredient_id: true,
                    },
                });
                const formattedProductIngredients = productIngredients.map((pi) => (Object.assign(Object.assign({}, pi), { product_id: (0, common_1.bufferToUuid)(Buffer.from(pi.product_id)), ingredient_id: (0, common_1.bufferToUuid)(Buffer.from(pi.ingredient_id)) })));
                res.status(200).json(formattedProductIngredients);
            }
            catch (error) {
                return res.status(500).json({ message: "Error de servidor" + error });
            }
        });
    },
};
