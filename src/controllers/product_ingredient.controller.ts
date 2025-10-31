import prisma from "../lib/prisma";
import { v4 as uuidv4 } from "uuid";
import { bufferToUuid, uuidToBuffer } from "../utils/common";

export const ProductIngredientController = {
    async createProductIngredient(req: any, res: any) {
        const {is_base, amount, product_id, ingredient_id } = req.body;
        try {
            // Verificar si es un ingrediente virtual "Mezcla de harina"
            if (ingredient_id === "virtual-mezcla-harina") {
                // Definir la receta del ingrediente virtual
                const VIRTUAL_RECIPE = [
                    { name: "Leche", amount: 12.74 },
                    { name: "Mantequilla", amount: 1.15 },
                    { name: "Harina", amount: 19.11 }
                ];

                // Obtener los ingredientes reales de la receta
                const realIngredients = await prisma.ingredient.findMany({
                    where: {
                        name: {
                            in: VIRTUAL_RECIPE.map(r => r.name)
                        }
                    },
                    select: {
                        id: true,
                        name: true
                    }
                });

                if (realIngredients.length !== VIRTUAL_RECIPE.length) {
                    return res.status(400).json({ 
                        message: "No se encontraron todos los ingredientes necesarios para la mezcla de harina" 
                    });
                }

                // Crear relaciones para cada ingrediente de la receta
                const createdRelations = [];
                for (const recipeItem of VIRTUAL_RECIPE) {
                    const realIngredient = realIngredients.find(ing => ing.name === recipeItem.name);
                    if (!realIngredient) continue;

                    // Verificar si ya existe la relación
                    const existing = await prisma.product_ingredient.findFirst({
                        where: {
                            product_id: uuidToBuffer(product_id),
                            ingredient_id: Buffer.from(realIngredient.id),
                        },
                    });

                    if (!existing) {
                        const uuid = uuidv4();
                        const uuidBuffer = uuidToBuffer(uuid);
                        const productIngredient = await prisma.product_ingredient.create({
                            data: {
                                id: uuidBuffer,
                                created_at: new Date(),
                                updated_at: new Date(),
                                is_base: is_base,
                                amount: amount * recipeItem.amount, // Multiplicar por la cantidad de la receta
                                product_id: uuidToBuffer(product_id),
                                ingredient_id: Buffer.from(realIngredient.id),
                            },
                            select: {
                                id: true,
                                updated_at: true,
                                amount: true,
                                is_base: true,
                                product_id: true,
                                ingredient_id: true,
                            },
                        });

                        createdRelations.push({
                            ...productIngredient,
                            id: bufferToUuid(Buffer.from(productIngredient.id)),
                            product_id: bufferToUuid(Buffer.from(productIngredient.product_id)),
                            ingredient_id: bufferToUuid(Buffer.from(productIngredient.ingredient_id)),
                            ingredient_name: recipeItem.name
                        });
                    }
                }

                return res.status(200).json({
                    message: "Ingredientes de la mezcla de harina agregados correctamente",
                    virtual_ingredient: "Mezcla de harina",
                    created_relations: createdRelations
                });
            }

            // Lógica normal para ingredientes no virtuales
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
                    id: true,
                    updated_at: true,
                    is_base: true,
                    amount: true,
                    product_id: true,
                    ingredient_id: true,
                },
            });

            const formattedProductIngredients = productIngredients.map((pi) => ({
                ...pi,
                id: bufferToUuid(Buffer.from(pi.id)),
                product_id: bufferToUuid(Buffer.from(pi.product_id)),
                ingredient_id: bufferToUuid(Buffer.from(pi.ingredient_id)),
            }));

            res.status(200).json(formattedProductIngredients);
        } catch (error) {
            return res.status(500).json({ message: "Error de servidor" + error });
        }
    },
    async getProductIngredients(req: any, res: any) {
        const { id } = req.params;
        try {
            const productIngredients = await prisma.product_ingredient.findMany({
                where: {
                    product_id: uuidToBuffer(id),
                },
                select: {
                    id: true,
                    updated_at: true,
                    is_base: true,
                    amount: true,
                    product_id: true,
                    ingredient_id: true,
                    ingredient: {
                        select: {
                            name: true,
                            unit_measurement: true,
                        },
                    },
                },
            });

            // Definir los ingredientes que forman la "Mezcla de harina"
            const VIRTUAL_RECIPE_NAMES = ["Leche", "Mantequilla", "Harina"];
            
            // Separar ingredientes virtuales de los normales
            const virtualIngredients = [];
            const normalIngredients = [];
            
            for (const pi of productIngredients) {
                if (VIRTUAL_RECIPE_NAMES.includes(pi.ingredient.name)) {
                    virtualIngredients.push(pi);
                } else {
                    normalIngredients.push(pi);
                }
            }

            const formattedProductIngredients = [];

            // Agregar ingredientes normales
            normalIngredients.forEach((pi) => {
                formattedProductIngredients.push({
                    ...pi,
                    id: bufferToUuid(Buffer.from(pi.id)),
                    product_id: bufferToUuid(Buffer.from(pi.product_id)),
                    ingredient_id: bufferToUuid(Buffer.from(pi.ingredient_id)),
                });
            });

            // Si encontramos los tres ingredientes de la mezcla, los agrupamos
            if (virtualIngredients.length === 3) {
                const hasAllRecipeIngredients = VIRTUAL_RECIPE_NAMES.every(name => 
                    virtualIngredients.some(vi => vi.ingredient.name === name)
                );

                if (hasAllRecipeIngredients) {
                    // Calcular la cantidad total de la mezcla (usar la cantidad del primer ingrediente como base)
                    const baseIngredient = virtualIngredients.find(vi => vi.ingredient.name === "Leche");
                    const totalAmount = baseIngredient ? baseIngredient.amount : virtualIngredients[0].amount;

                    // Crear el ingrediente virtual agrupado
                    formattedProductIngredients.push({
                        id: "virtual-group-mezcla-harina",
                        updated_at: virtualIngredients[0].updated_at,
                        is_base: virtualIngredients[0].is_base,
                        amount: totalAmount,
                        product_id: bufferToUuid(Buffer.from(virtualIngredients[0].product_id)),
                        ingredient_id: "virtual-mezcla-harina",
                        ingredient: {
                            name: "Mezcla de harina",
                            unit_measurement: "G"
                        },
                        is_virtual: true,
                        recipe_details: virtualIngredients.map(vi => ({
                            id: bufferToUuid(Buffer.from(vi.id)),
                            name: vi.ingredient.name,
                            amount: vi.amount,
                            unit_measurement: vi.ingredient.unit_measurement
                        }))
                    });
                } else {
                    // Si no están todos los ingredientes, mostrarlos por separado
                    virtualIngredients.forEach((pi) => {
                        formattedProductIngredients.push({
                            ...pi,
                            id: bufferToUuid(Buffer.from(pi.id)),
                            product_id: bufferToUuid(Buffer.from(pi.product_id)),
                            ingredient_id: bufferToUuid(Buffer.from(pi.ingredient_id)),
                        });
                    });
                }
            } else {
                // Si no están todos los ingredientes de la mezcla, mostrarlos por separado
                virtualIngredients.forEach((pi) => {
                    formattedProductIngredients.push({
                        ...pi,
                        id: bufferToUuid(Buffer.from(pi.id)),
                        product_id: bufferToUuid(Buffer.from(pi.product_id)),
                        ingredient_id: bufferToUuid(Buffer.from(pi.ingredient_id)),
                    });
                });
            }

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
        const { id, ingredient_id, product_id } = req.body;
        try {
            // Validar que se proporcionen los parámetros necesarios
            if (!id && !ingredient_id) {
                return res.status(400).json({ 
                    message: "Se requiere 'id' o 'ingredient_id' para eliminar el ingrediente" 
                });
            }

            // Verificar si se está intentando eliminar un ingrediente virtual "Mezcla de harina"
            if (ingredient_id === "virtual-mezcla-harina" || id === "virtual-group-mezcla-harina") {
                // Validar que se proporcione product_id para ingredientes virtuales
                if (!product_id) {
                    return res.status(400).json({ 
                        message: "Se requiere 'product_id' para eliminar ingredientes virtuales" 
                    });
                }

                // Definir los ingredientes que forman la mezcla
                const VIRTUAL_RECIPE_NAMES = ["Leche", "Mantequilla", "Harina"];
                
                // Obtener los ingredientes reales de la receta
                const realIngredients = await prisma.ingredient.findMany({
                    where: {
                        name: {
                            in: VIRTUAL_RECIPE_NAMES
                        }
                    },
                    select: {
                        id: true,
                        name: true
                    }
                });

                if (realIngredients.length === 0) {
                    return res.status(404).json({ 
                        message: "No se encontraron ingredientes de la mezcla para eliminar" 
                    });
                }

                // Usar transacción para garantizar integridad
                const deletedIngredients = await prisma.$transaction(async (tx) => {
                    const deleted = [];
                    
                    for (const realIngredient of realIngredients) {
                        const productIngredientToDelete = await tx.product_ingredient.findFirst({
                            where: {
                                product_id: uuidToBuffer(product_id),
                                ingredient_id: Buffer.from(realIngredient.id),
                            },
                            select: {
                                id: true,
                                amount: true
                            }
                        });

                        if (productIngredientToDelete) {
                            await tx.product_ingredient.delete({
                                where: {
                                    id: Buffer.from(productIngredientToDelete.id)
                                }
                            });

                            deleted.push({
                                id: bufferToUuid(Buffer.from(productIngredientToDelete.id)),
                                ingredient_name: realIngredient.name,
                                amount: productIngredientToDelete.amount
                            });
                        }
                    }
                    
                    return deleted;
                });

                if (deletedIngredients.length === 0) {
                    return res.status(404).json({ 
                        message: "No se encontraron relaciones de la mezcla de harina para eliminar" 
                    });
                }

                return res.status(200).json({ 
                    message: "Mezcla de harina eliminada correctamente del producto",
                    virtual_ingredient: "Mezcla de harina",
                    deleted_ingredients: deletedIngredients,
                    total_deleted: deletedIngredients.length
                });
            }

            // Lógica normal para ingredientes no virtuales
            // Validar que el ID no sea undefined o null
            if (!id || id === "undefined" || id === "null") {
                return res.status(400).json({ 
                    message: "ID de ingrediente inválido" 
                });
            }

            const existingProductIngredient = await prisma.product_ingredient.findFirst({
                where: {
                    id: uuidToBuffer(id),
                },
                include: {
                    ingredient: {
                        select: {
                            name: true
                        }
                    }
                }
            });

            if (!existingProductIngredient) {
                return res.status(404).json({ message: "Ingrediente del producto no encontrado" });
            }

            await prisma.product_ingredient.delete({
                where: {
                    id: uuidToBuffer(id)
                },
            });

            res.status(200).json({ 
                message: "Ingrediente del producto eliminado correctamente",
                deleted_ingredient: {
                    id: bufferToUuid(Buffer.from(existingProductIngredient.id)),
                    ingredient_name: existingProductIngredient.ingredient.name,
                    amount: existingProductIngredient.amount
                }
            });
        } catch (error) {
            console.error('Error in deleteProductIngredient:', error);
            return res.status(500).json({ message: "Error de servidor: " + error });
        }
    },

    // Nuevo método para eliminar ingrediente virtual específicamente
    async deleteVirtualProductIngredient(req: any, res: any) {
        const { product_id, virtual_ingredient_name } = req.body;
        try {
            if (virtual_ingredient_name !== "Mezcla de harina") {
                return res.status(400).json({ 
                    message: "Solo se puede eliminar el ingrediente virtual 'Mezcla de harina'" 
                });
            }

            // Definir los ingredientes que forman la mezcla
            const VIRTUAL_RECIPE_NAMES = ["Leche", "Mantequilla", "Harina"];
            
            // Obtener los ingredientes reales de la receta
            const realIngredients = await prisma.ingredient.findMany({
                where: {
                    name: {
                        in: VIRTUAL_RECIPE_NAMES
                    }
                },
                select: {
                    id: true,
                    name: true
                }
            });

            if (realIngredients.length === 0) {
                return res.status(404).json({ 
                    message: "No se encontraron ingredientes de la mezcla" 
                });
            }

            // Verificar que existan todas las relaciones antes de eliminar
            const existingRelations = [];
            for (const realIngredient of realIngredients) {
                const relation = await prisma.product_ingredient.findFirst({
                    where: {
                        product_id: uuidToBuffer(product_id),
                        ingredient_id: Buffer.from(realIngredient.id),
                    },
                    select: {
                        id: true,
                        amount: true,
                        ingredient: {
                            select: {
                                name: true
                            }
                        }
                    }
                });

                if (relation) {
                    existingRelations.push(relation);
                }
            }

            if (existingRelations.length === 0) {
                return res.status(404).json({ 
                    message: "No se encontró la mezcla de harina en este producto" 
                });
            }

            // Eliminar todas las relaciones de la mezcla usando una transacción
            const deletedIngredients = await prisma.$transaction(async (tx) => {
                const deleted = [];
                for (const relation of existingRelations) {
                    await tx.product_ingredient.delete({
                        where: {
                            id: Buffer.from(relation.id)
                        }
                    });

                    deleted.push({
                        id: bufferToUuid(Buffer.from(relation.id)),
                        ingredient_name: relation.ingredient.name,
                        amount: relation.amount
                    });
                }
                return deleted;
            });

            res.status(200).json({ 
                message: "Mezcla de harina eliminada completamente del producto",
                virtual_ingredient: "Mezcla de harina",
                deleted_ingredients: deletedIngredients,
                total_deleted: deletedIngredients.length
            });
        } catch (error) {
            console.error('Error in deleteVirtualProductIngredient:', error);
            return res.status(500).json({ message: "Error de servidor: " + error });
        }
    },
};