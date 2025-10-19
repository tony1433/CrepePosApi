import prisma from "../lib/prisma";
import { v4 as uuidv4 } from "uuid";
import { bufferToUuid, uuidToBuffer } from "../utils/common";

export const ComboController = {
    async createCombo(req: any, res: any) {
        const { name, description, price, combo_day } = req.body;
        try {
            const existingCombo = await prisma.combo.findFirst({
                where: {
                   name: name,
                },
            });

            if (existingCombo) {
                return res
                    .status(409)
                    .json({ message: "El combo ya se encuentra registrado" });
            }

            const uuid = uuidv4();
            const uuidBuffer = uuidToBuffer(uuid);
            const newCombo = await prisma.combo.create({
                data: {
                    id: uuidBuffer,
                    created_at: new Date(),
                    updted_at: new Date(),
                    name: name,
                    description: description,
                    price: price,
                    is_active: true,
                    combo_day: combo_day,
                },
                select: {
                    id: true,
                    updted_at: true,
                    name: true,
                    description: true,
                    price: true,
                },
            });
            
            if (!newCombo) {
                return res.status(400).json({ message: "Error al insertar combo" });
            }

            const formattedCombo = {
                ...newCombo,
                id: bufferToUuid(Buffer.from(newCombo.id)),
            };

            res.status(200).json(formattedCombo);         
        } catch (error) {
            return res.status(500).json({ message: "Error de servidor" + error });
        }
    },
    async getAllCombos(req: any, res: any) {
        try {
            const combos = await prisma.combo.findMany({
                select: {
                    id: true,
                    updted_at: true,
                    name: true,
                    description: true,
                    price: true,
                    is_active: true,
                    combo_day: true,
                },
            });

            const formattedCombos = combos.map((combo) => ({
                ...combo,
                id: bufferToUuid(Buffer.from(combo.id)),
            }));

            res.status(200).json(formattedCombos);
        } catch (error) {
            return res.status(500).json({ message: "Error de servidor" + error });
        }
    },
};