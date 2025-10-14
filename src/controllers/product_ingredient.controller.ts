import prisma from "../lib/prisma";
import { v4 as uuidv4 } from "uuid";
import { bufferToUuid, uuidToBuffer } from "../utils/common";

export const ProductIngredientController = {
    async createProductIngredient(req: any, res: any) {
        const {is_base, amount, product_id, ingredient_id } = req.body;
        try {
            const existingProductIngredient = await prisma.product_ingredient.findFirst({
                where: {
                    product_id: uuidToBuffer(product_id),
                    ingredient_id: uuidToBuffer(ingredient_id),
                },
            });

            if (existingProductIngredient) {
                return res.status(400).json({ message: "El ingrediente ya está asociado al producto" });
            }  
            
            const uuid = uuidv4();
            const uuidBuffer = uuidToBuffer(uuid);
            const productIngredient = await prisma.product_ingredient.create({
                data: {
                    id: uuidBuffer,
                    created_at: new Date(),
                    updated_at: new Date(),
                    is_base: is_base,
                    amount: amount,
                    product_id: uuidToBuffer(product_id),
                    ingredient_id: uuidToBuffer(ingredient_id),
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

            const formattedProductIngredient = {
                ...productIngredient,
                product_id: bufferToUuid(Buffer.from(productIngredient.product_id)),
                ingredient_id: bufferToUuid(Buffer.from(productIngredient.ingredient_id)),
            };

            res.status(200).json(formattedProductIngredient);         
        } catch (error) {
            return res.status(500).json({ message: "Error de servidor" + error });
        }
    },
    async getAllProductIngredients(req: any, res: any) {
        try {
            const productIngredients = await prisma.product_ingredient.findMany({
                select: {
                    updated_at: true,
                    is_base: true,
                    amount: true,
                    product_id: true,
                    ingredient_id: true,
                },
            });

            const formattedProductIngredients = productIngredients.map((pi) => ({
                ...pi,
                product_id: bufferToUuid(Buffer.from(pi.product_id)),
                ingredient_id: bufferToUuid(Buffer.from(pi.ingredient_id)),
            }));

            res.status(200).json(formattedProductIngredients);
        } catch (error) {
            return res.status(500).json({ message: "Error de servidor" + error });
        }
    },
    async updateProductIngredient(req: any, res: any) {
        const { id, product_id, ingredient_id, is_base, amount } = req.body;
        try {
            const existingProductIngredient = await prisma.product_ingredient.findFirst({
                where: {
                    product_id: uuidToBuffer(product_id),
                    ingredient_id: uuidToBuffer(ingredient_id),
                },
            });

            if (!existingProductIngredient) {
                return res.status(404).json({ message: "Ingrediente del producto no encontrado" });
            }

            const updatedProductIngredient = await prisma.product_ingredient.update({
                where: {
                    id: uuidToBuffer(id)
                },
                data: {
                    is_base,
                    amount,
                    updated_at: new Date(),
                },
                select: {
                    updated_at: true,
                    is_base: true,
                    amount: true,
                    product_id: true,
                    ingredient_id: true,
                },
            });

            const formattedProductIngredient = {
                ...updatedProductIngredient,
                product_id: bufferToUuid(Buffer.from(updatedProductIngredient.product_id)),
                ingredient_id: bufferToUuid(Buffer.from(updatedProductIngredient.ingredient_id)),
            };

            res.status(200).json(formattedProductIngredient);
        } catch (error) {
            return res.status(500).json({ message: "Error de servidor" + error });
        }
    },
    async deleteProductIngredient(req: any, res: any) {
        const { id, product_id, ingredient_id } = req.body;
        try {
            const existingProductIngredient = await prisma.product_ingredient.findFirst({
                where: {
                    product_id: uuidToBuffer(product_id),
                    ingredient_id: uuidToBuffer(ingredient_id),
                },
            });

            if (!existingProductIngredient) {
                return res.status(404).json({ message: "Ingrediente del producto no encontrado" });
            }

            await prisma.product_ingredient.delete({
                where: {
                    id: uuidToBuffer(id)
                },
            });

            res.status(200).json({ message: "Ingrediente del producto eliminado correctamente" });
        } catch (error) {
            return res.status(500).json({ message: "Error de servidor" + error });
        }
    },
};