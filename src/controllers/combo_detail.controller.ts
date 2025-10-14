import prisma from "../lib/prisma";
import { v4 as uuidv4 } from "uuid";
import { bufferToUuid, uuidToBuffer } from "../utils/common";

export const ComboDetailController = {
    async createComboDetail(req: any, res: any) {
        const { amount, combo_id, type_product_id } = req.body;
        try {
            const existingComboDetail = await prisma.combo_detail.findFirst({
                where: {
                    combo_id: uuidToBuffer(combo_id),
                    type_product_id: uuidToBuffer(type_product_id),
                },
            });

            if (existingComboDetail) {
                return res
                    .status(409)
                    .json({ message: "El detalle del combo ya se encuentra registrado" });
            }

            const uuid = uuidv4();
            const uuidBuffer = uuidToBuffer(uuid);
            const newComboDetail = await prisma.combo_detail.create({
                data: {
                    id: uuidBuffer,
                    created_at: new Date(),
                    updated_at: new Date(),
                    amount: amount,
                    combo_id: uuidToBuffer(combo_id),
                    type_product_id: uuidToBuffer(type_product_id),
                },
                select: {
                    id: true,
                    updated_at: true,
                    amount: true,
                    combo_id: true,
                    type_product_id: true,
                },
            });
            
            if (!newComboDetail) {
                return res.status(400).json({ message: "Error al insertar detalle del combo" });
            }

            const formattedComboDetail = {
                ...newComboDetail,
                id: bufferToUuid(Buffer.from(newComboDetail.id)),
                combo_id: bufferToUuid(Buffer.from(newComboDetail.combo_id)),
                type_product_id: bufferToUuid(Buffer.from(newComboDetail.type_product_id)),
            };

            res.status(200).json(formattedComboDetail);         
        } catch (error) {
            return res.status(500).json({ message: "Error de servidor" + error });
        }
    },
    async getAllComboDetails(req: any, res: any) {
        try {
            const comboDetails = await prisma.combo_detail.findMany({
                select: {
                    id: true,
                    updated_at: true,
                    combo_id: true,
                    type_product:{
                        select: {
                            name: true,
                            description: true,
                        }
                    }
                },
            });

            const formattedComboDetails = comboDetails.map((detail) => ({
                ...detail,
                id: bufferToUuid(Buffer.from(detail.id)),
                combo_id: bufferToUuid(Buffer.from(detail.combo_id)),
            }));

            res.status(200).json(formattedComboDetails);
        } catch (error) {
            return res.status(500).json({ message: "Error de servidor" + error });
        }
    },
};