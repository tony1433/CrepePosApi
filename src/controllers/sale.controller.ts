import prisma from "../lib/prisma";
import { v4 as uuidv4 } from "uuid";
import { bufferToUuid, uuidToBuffer } from "../utils/common";

export const SaleController = {
    async createSale(req: any, res: any) {
        const {total, payment_method, user_id} = req.body;
        try {
            const uuid = uuidv4();
            const saleBufferId = uuidToBuffer(uuid);
            const newSale = await prisma.sale.create({
                data: {
                    id: saleBufferId,
                    created_at: new Date(),
                    updated_at: new Date(),
                    total: total,
                    payment_method: payment_method,
                    user_id: uuidToBuffer(user_id),
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

            const formattedSale = {
                ...newSale,
                id: bufferToUuid(Buffer.from(newSale.id)),
                user_id: bufferToUuid(Buffer.from(newSale.user_id)),
            };

            res.status(200).json(formattedSale);
        } catch (error) {
            return res.status(500).json({ message: "Error de servidor" + error });
        }
    },
    async getAllSales(req: any, res: any) {
        try {
            const sales = await prisma.sale.findMany({
                select: {
                    id: true,
                    created_at: true,
                    updated_at: true,
                    total: true,
                    payment_method: true,
                    user_id: true,
                },
            });
            
            const formattedSales = sales.map((sale) => ({
                ...sale,
                id: bufferToUuid(Buffer.from(sale.id)),
                user_id: bufferToUuid(Buffer.from(sale.user_id)),
            }));

            res.status(200).json(formattedSales);
        } catch (error) {
            return res.status(500).json({ message: "Error de servidor" + error });
        }
    },
    async updateSale(req: any, res: any) {
        const {id, total, payment_method, user_id } = req.body;
        
        try {
            const updatedSale = await prisma.sale.update({
                where: {
                    id: uuidToBuffer(id)
                },
                data: {
                    updated_at: new Date(),
                    total: total,
                    payment_method: payment_method,
                    user_id: user_id ? uuidToBuffer(user_id) : undefined,
                },
                select: {
                    id: true,
                    created_at: true,
                    updated_at: true,
                    total: true,
                    payment_method: true,
                    user_id: true,
                }
            });

            if (!updatedSale) {
                return res.status(404).json({ message: "Venta no encontrada" });
            }

            const formattedSale = {
                ...updatedSale,
                id: bufferToUuid(Buffer.from(updatedSale.id)),
                user_id: bufferToUuid(Buffer.from(updatedSale.user_id)),
            };

            res.status(200).json(formattedSale);
        } catch (error) {
            return res.status(500).json({ message: "Error de servidor: " + error });
        }
    },
    async deleteSale(req: any, res: any) {
        const { id } = req.body;
        
        try {
            const deletedSale = await prisma.sale.delete({
                where: {
                    id: uuidToBuffer(id)
                }
            });

            if (!deletedSale) {
                return res.status(404).json({ message: "Venta no encontrada" });
            }

            res.status(200).json({ message: "Venta eliminada correctamente" });
        } catch (error) {
            return res.status(500).json({ message: "Error de servidor: " + error });
        }
    }
};