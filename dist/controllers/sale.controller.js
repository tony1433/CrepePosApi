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
exports.SaleController = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const uuid_1 = require("uuid");
const common_1 = require("../utils/common");
exports.SaleController = {
    createSale(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { total, payment_method, user_id } = req.body;
            try {
                const uuid = (0, uuid_1.v4)();
                const saleBufferId = (0, common_1.uuidToBuffer)(uuid);
                const newSale = yield prisma_1.default.sale.create({
                    data: {
                        id: saleBufferId,
                        created_at: new Date(),
                        updated_at: new Date(),
                        total: total,
                        payment_method: payment_method,
                        user_id: (0, common_1.uuidToBuffer)(user_id),
                    },
                    select: {
                        id: true,
                        created_at: true,
                        updated_at: true,
                        total: true,
                        user_id: true,
                    },
                });
                if (!newSale) {
                    return res.status(400).json({ message: "Error al insertar venta" });
                }
                const formattedSale = Object.assign(Object.assign({}, newSale), { id: (0, common_1.bufferToUuid)(Buffer.from(newSale.id)), user_id: (0, common_1.bufferToUuid)(Buffer.from(newSale.user_id)) });
                res.status(200).json(formattedSale);
            }
            catch (error) {
                return res.status(500).json({ message: "Error de servidor" + error });
            }
        });
    },
    getAllSales(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const sales = yield prisma_1.default.sale.findMany({
                    select: {
                        id: true,
                        created_at: true,
                        updated_at: true,
                        total: true,
                        payment_method: true,
                        user_id: true,
                    },
                });
                const formattedSales = sales.map((sale) => (Object.assign(Object.assign({}, sale), { id: (0, common_1.bufferToUuid)(Buffer.from(sale.id)), user_id: (0, common_1.bufferToUuid)(Buffer.from(sale.user_id)) })));
                res.status(200).json(formattedSales);
            }
            catch (error) {
                return res.status(500).json({ message: "Error de servidor" + error });
            }
        });
    },
};
