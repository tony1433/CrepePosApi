import prisma from "../lib/prisma";
import { v4 as uuidv4 } from "uuid";
import { bufferToUuid, uuidToBuffer } from "../utils/common";


export const ComboDayController = {
    async createComboDay(req: any, res: any) {
        const { combo_id, day } = req.body;
        try {
            const combo = await prisma.combo.findUnique({
                where: {
                    id: uuidToBuffer(combo_id),
                },
            });

            if (!combo) {
                return res.status(404).json({ message: "Combo no encontrado" });
            }

            const existingComboDay = await prisma.combo_day.findFirst({
                where: {
                   combo_id: uuidToBuffer(combo_id),
                   day: day,
                },
            });

            if (existingComboDay) {
                return res
                    .status(409)
                    .json({ message: "El combo ya se encuentra registrado para este día "+ day });
            }

            const uuid = uuidv4();
            const uuidBuffer = uuidToBuffer(uuid);
            const newComboDay = await prisma.combo_day.create({
                data: {
                    id: uuidBuffer,
                    combo_id: uuidToBuffer(combo_id),
                    day: day,
                },
                select: {
                    combo_id: true,
                    day: true,
                },
            });
            
            if (!newComboDay) {
                return res.status(400).json({ message: "Error al insertar combo del día" });
            }

            const formattedComboDay = {
                ...newComboDay,
                combo_id: bufferToUuid(Buffer.from(newComboDay.combo_id)),
            };

            res.status(200).json(formattedComboDay);         
        } catch (error) {
            return res.status(500).json({ message: "Error de servidor" + error });
        }
    },
    async getAllComboDays(req: any, res: any) {
        try {
            const comboDays = await prisma.combo_day.findMany({
                select: {
                    combo_id: true,
                    day: true,
                },
            });

            const formattedComboDays = comboDays.map((comboDay) => ({
                ...comboDay,
                combo_id: bufferToUuid(Buffer.from(comboDay.combo_id)),
            }));

            res.status(200).json(formattedComboDays);         
        } catch (error) {
            return res.status(500).json({ message: "Error de servidor" + error });
        }
    },
};