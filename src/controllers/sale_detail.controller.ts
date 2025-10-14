import prisma from "../lib/prisma";
import { v4 as uuidv4 } from "uuid";
import { bufferToUuid, uuidToBuffer } from "../utils/common";

export const SaleDetailController = {
    async createSaleDetail(req: any, res: any) {
        const { amount, subtotal, sale_id, product_id, combo_id} = req.body;
        try {
            const uuid = uuidv4();
            const saleDetailBufferId = uuidToBuffer(uuid);
            const newSaleDetail = await prisma.sale_detail.create({
                data: {
                    id: saleDetailBufferId,
                    created_at: new Date(),
                    updated_at: new Date(),
                    amount: amount,
                    subtotal: subtotal,
                    sale_id: uuidToBuffer(sale_id),
                    product_id: product_id ? uuidToBuffer(product_id) : null,
                    combo_id: combo_id ? uuidToBuffer(combo_id) : null,
                },
                select: {
                    id: true,
                    created_at: true,
                    updated_at: true,
                    sale_id: true,
                    product_id: true,
                    combo_id: true,
                },
            });

            if (!newSaleDetail) {
                return res.status(400).json({ message: "Error al insertar detalle de venta" });
            }

            const formattedSaleDetail = {
                ...newSaleDetail,
                id: bufferToUuid(Buffer.from(newSaleDetail.id)),
                sale_id: bufferToUuid(Buffer.from(newSaleDetail.sale_id)),
                product_id: newSaleDetail.product_id ? bufferToUuid(Buffer.from(newSaleDetail.product_id)) : null,
                combo_id: newSaleDetail.combo_id ? bufferToUuid(Buffer.from(newSaleDetail.combo_id)) : null,
            };

            res.status(200).json(formattedSaleDetail);
        } catch (error) {
            return res.status(500).json({ message: "Error de servidor" + error });
        }
    },
    async getAllSaleDetails(req: any, res: any) {
        try {
            const saleDetails = await prisma.sale_detail.findMany({
                select: {
                    id: true,
                    created_at: true,
                    updated_at: true,
                    amount: true,
                    subtotal: true,
                    sale_id: true,
                    product_id: true,
                    combo_id: true,
                },
            });
            
            const formattedSaleDetails = saleDetails.map((detail) => ({
                ...detail,
                id: bufferToUuid(Buffer.from(detail.id)),
                sale_id: bufferToUuid(Buffer.from(detail.sale_id)),
                product_id: detail.product_id ? bufferToUuid(Buffer.from(detail.product_id)) : null,
                combo_id: detail.combo_id ? bufferToUuid(Buffer.from(detail.combo_id)) : null,
            }));

            res.status(200).json(formattedSaleDetails);
        } catch (error) {
            return res.status(500).json({ message: "Error de servidor" + error });
        }
    },
    async updateSaleDetail(req: any, res: any) {
        const { id } = req.params;
        const { amount, subtotal, sale_id, product_id, combo_id } = req.body;
        
        try {
            const updatedSaleDetail = await prisma.sale_detail.update({
                where: {
                    id: uuidToBuffer(id)
                },
                data: {
                    updated_at: new Date(),
                    amount: amount,
                    subtotal: subtotal,
                    sale_id: sale_id ? uuidToBuffer(sale_id) : undefined,
                    product_id: product_id ? uuidToBuffer(product_id) : null,
                    combo_id: combo_id ? uuidToBuffer(combo_id) : null,
                },
                select: {
                    id: true,
                    created_at: true,
                    updated_at: true,
                    amount: true,
                    subtotal: true,
                    sale_id: true,
                    product_id: true,
                    combo_id: true,
                },
            });

            if (!updatedSaleDetail) {
                return res.status(404).json({ message: "Detalle de venta no encontrado" });
            }

            const formattedSaleDetail = {
                ...updatedSaleDetail,
                id: bufferToUuid(Buffer.from(updatedSaleDetail.id)),
                sale_id: bufferToUuid(Buffer.from(updatedSaleDetail.sale_id)),
                product_id: updatedSaleDetail.product_id ? bufferToUuid(Buffer.from(updatedSaleDetail.product_id)) : null,
                combo_id: updatedSaleDetail.combo_id ? bufferToUuid(Buffer.from(updatedSaleDetail.combo_id)) : null,
            };

            res.status(200).json(formattedSaleDetail);
        } catch (error) {
            return res.status(500).json({ message: "Error de servidor: " + error });
        }
    },
    async deleteSaleDetail(req: any, res: any) {
        const { id } = req.params;
        
        try {
            const deletedSaleDetail = await prisma.sale_detail.delete({
                where: {
                    id: uuidToBuffer(id)
                },
                select: {
                    id: true,
                }
            });

            if (!deletedSaleDetail) {
                return res.status(404).json({ message: "Detalle de venta no encontrado" });
            }

            res.status(200).json({ 
                message: "Detalle de venta eliminado correctamente",
                id: bufferToUuid(Buffer.from(deletedSaleDetail.id))
            });
        } catch (error) {
            return res.status(500).json({ message: "Error de servidor: " + error });
        }
    },
};