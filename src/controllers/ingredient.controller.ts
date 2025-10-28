import prisma from "../lib/prisma";
import { v4 as uuidv4 } from "uuid";
import { bufferToUuid, uuidToBuffer } from "../utils/common";

export const IngredientController = {
    async createIngredient(req: any, res: any) {
        const {name, current_stock, min_stock, unit_measurement, cost_unit, branch_id } = req.body;
        try {
            const ingredient = await prisma.ingredient.findFirst({
                where: {
                   name: name,
                },
            });

            if (ingredient) {
                return res
                    .status(409)
                    .json({ message: "El ingrediente ya se encuentra registrado" });
            }

            const uuid = uuidv4();
            const uuidBuffer = uuidToBuffer(uuid);
            const newIngredient = await prisma.ingredient.create({
                data: {
                    id: uuidBuffer,
                    created_at: new Date(),
                    updated_at: new Date(),
                    name: name,
                    current_stock: current_stock,
                    min_stock: min_stock,
                    unit_measurement: unit_measurement,
                    cost_unit: cost_unit,
                    branch_id: uuidToBuffer(branch_id),
                },
                select: {
                    id: true,
                    updated_at: true,
                    current_stock: true,
                    name: true,
                    min_stock: true,
                    unit_measurement: true,
                    cost_unit: true,
                    branch_id: true,
                },
            });
            
            if (!newIngredient) {
                return res.status(400).json({ message: "Error al insertar ingrediente" });
            }

            const formattedIngredient = {
                ...newIngredient,
                id: bufferToUuid(Buffer.from(newIngredient.id)),
                branch_id: bufferToUuid(Buffer.from(newIngredient.branch_id)),
            };

            res.status(200).json(formattedIngredient);         
        } catch (error) {
            return res.status(500).json({ message: "Error de servidor" + error });
        }
    },
    async getAllIngredients(req: any, res: any) {
        try {
            const ingredients = await prisma.ingredient.findMany({
                select: {
                    id: true,
                    created_at: true,
                    updated_at: true,
                    name: true,
                    current_stock: true,
                    min_stock: true,
                    unit_measurement: true,
                    cost_unit: true,
                    branch_id: true,
                },
            });

            const formattedIngredients = ingredients.map((ingredient) => ({
                ...ingredient,
                id: bufferToUuid(Buffer.from(ingredient.id)),
                branch_id: bufferToUuid(Buffer.from(ingredient.branch_id)),
            }));

            res.status(200).json(formattedIngredients);
        } catch (error) {
            return res.status(500).json({ message: "Error de servidor" + error });
        }
    },
    async updateIngredient(req: any, res: any) {
        const {id, name, current_stock, min_stock, unit_measurement, cost_unit } = req.body;
        
        try {
            const uuidBuffer = uuidToBuffer(id);
            
            const ingredient = await prisma.ingredient.findFirst({
                where: {
                    id: uuidBuffer,
                },
            });

            if (!ingredient) {
                return res.status(404).json({ message: "Ingrediente no encontrado" });
            }

            const updatedIngredient = await prisma.ingredient.update({
                where: {
                    id: uuidBuffer,
                },
                data: {
                    name,
                    current_stock,
                    min_stock,
                    unit_measurement,
                    cost_unit,
                    updated_at: new Date(),
                },
                select: {
                    id: true,
                    updated_at: true,
                    current_stock: true,
                    name: true,
                    min_stock: true,
                    unit_measurement: true,
                    cost_unit: true,
                },
            });

            const formattedIngredient = {
                ...updatedIngredient,
                id: bufferToUuid(Buffer.from(updatedIngredient.id)),
            };

            res.status(200).json(formattedIngredient);
        } catch (error) {
            return res.status(500).json({ message: "Error de servidor" + error });
        }
    },
    async deleteIngredient(req: any, res: any) {
        const { id } = req.body;
        
        try {
            const uuidBuffer = uuidToBuffer(id);
            
            const ingredient = await prisma.ingredient.findFirst({
                where: {
                    id: uuidBuffer,
                },
            });

            if (!ingredient) {
                return res.status(404).json({ message: "Ingrediente no encontrado" });
            }

            await prisma.$transaction([
                prisma.product_ingredient.deleteMany({
                    where: {
                        ingredient_id: uuidBuffer,
                    },
                }),
                prisma.ingredient.delete({
                    where: {
                        id: uuidBuffer,
                    },
                }),
            ]);

            res.status(200).json({ message: "Ingrediente eliminado correctamente" });
        } catch (error) {
            return res.status(500).json({ message: "Error de servidor" + error });
        }
    },
};