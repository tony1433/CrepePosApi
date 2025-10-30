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
                   branch_id: uuidToBuffer(branch_id),
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
            // Obtener todos los ingredientes básicos
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

            // Obtener relaciones product_ingredient para calcular consumo
            const productIngredients = await prisma.product_ingredient.findMany({
                select: {
                    ingredient_id: true,
                    product_id: true,
                    amount: true,
                    product: {
                        select: {
                            name: true,
                            branch_id: true
                        }
                    }
                }
            });

            // Obtener todas las ventas de productos con sus detalles
            const productSales = await prisma.sale_detail.findMany({
                where: {
                    product_id: { not: null }
                },
                select: {
                    amount: true,
                    product_id: true,
                    sale: {
                        select: {
                            user: {
                                select: {
                                    user_branch: {
                                        select: {
                                            branch_id: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            });

            // Obtener todas las ventas de combos
            const comboSales = await prisma.sale_detail.findMany({
                where: {
                    combo_id: { not: null }
                },
                select: {
                    amount: true,
                    note: true,
                    sale: {
                        select: {
                            user: {
                                select: {
                                    user_branch: {
                                        select: {
                                            branch_id: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            });

            // Crear mapas para optimizar búsquedas
            const productIngredientMap = new Map();
            productIngredients.forEach(pi => {
                const key = `${bufferToUuid(Buffer.from(pi.ingredient_id))}-${bufferToUuid(Buffer.from(pi.product_id))}`;
                productIngredientMap.set(key, pi);
            });

            const formattedIngredients = ingredients.map((ingredient) => {
                let totalConsumed = 0;
                const ingredientId = bufferToUuid(Buffer.from(ingredient.id));
                const ingredientBranchId = ingredient.branch_id ? bufferToUuid(Buffer.from(ingredient.branch_id)) : null;

                // Calcular consumo directo de productos
                productSales.forEach(sale => {
                    if (!sale.product_id) return;
                    
                    const productId = bufferToUuid(Buffer.from(sale.product_id));
                    const key = `${ingredientId}-${productId}`;
                    const productIngredient = productIngredientMap.get(key);
                    
                    if (productIngredient) {
                        // Verificar que la venta sea de la misma sucursal del ingrediente
                        const userBranches = sale.sale.user.user_branch;
                        const isFromSameBranch = ingredientBranchId && userBranches.some(ub => 
                            bufferToUuid(Buffer.from(ub.branch_id)) === ingredientBranchId
                        );

                        // También verificar que el producto sea de la misma sucursal
                        const productBranchId = productIngredient.product.branch_id ? 
                            bufferToUuid(Buffer.from(productIngredient.product.branch_id)) : null;
                        
                        if (isFromSameBranch && productBranchId === ingredientBranchId) {
                            console.log('Adding product consumption:', sale.amount, 'x', productIngredient.amount);
                            totalConsumed += sale.amount * productIngredient.amount;
                            console.log('total consumed', totalConsumed);
                        }
                    }
                });

                // Calcular consumo de combos
                comboSales.forEach(comboSale => {
                    if (!comboSale.note) return;
                    
                    const userBranches = comboSale.sale.user.user_branch;
                    const isFromSameBranch = ingredientBranchId && userBranches.some(ub => 
                        bufferToUuid(Buffer.from(ub.branch_id)) === ingredientBranchId
                    );

                    if (isFromSameBranch) {
                        // Buscar productos que coincidan con el nombre en la nota
                        productIngredients.forEach(pi => {
                            const productBranchId = pi.product.branch_id ? 
                                bufferToUuid(Buffer.from(pi.product.branch_id)) : null;
                            const piIngredientId = bufferToUuid(Buffer.from(pi.ingredient_id));
                            
                            // Verificar que sea el ingrediente correcto y de la misma sucursal
                            if (piIngredientId === ingredientId && 
                                productBranchId === ingredientBranchId &&
                                comboSale.note.toLowerCase().includes(pi.product.name.toLowerCase())) {
                                console.log('Adding combo consumption:', comboSale.amount, 'x', pi.amount);
                                totalConsumed += comboSale.amount * pi.amount;
                            }
                        });
                    }
                });

                // Calcular stock disponible
                const availableStock = Math.max(0, ingredient.current_stock - totalConsumed);

                return {
                    ...ingredient,
                    id: ingredientId,
                    branch_id: ingredientBranchId,
                    current_stock: availableStock,
                    consumed_stock: totalConsumed,
                    available_stock: availableStock,
                    is_low_stock: availableStock <= ingredient.min_stock
                };
            });

            res.status(200).json(formattedIngredients);
        } catch (error) {
            console.error('Error in getAllIngredients:', error);
            return res.status(500).json({ message: "Error de servidor: " + error });
        }
    },
    async getIngredientsByBranch(req: any, res: any) {
        const { branch_id } = req.params;
        
        try {
            const branchBuffer = uuidToBuffer(branch_id);
            
            // Obtener ingredientes de la sucursal específica
            const ingredients = await prisma.ingredient.findMany({
                where: {
                    branch_id: branchBuffer
                },
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
                    product_ingredient: {
                        select: {
                            amount: true,
                            product: {
                                select: {
                                    id: true,
                                    name: true,
                                    sale_detail: {
                                        select: {
                                            amount: true,
                                            sale: {
                                                select: {
                                                    user: {
                                                        select: {
                                                            user_branch: {
                                                                where: {
                                                                    branch_id: branchBuffer
                                                                },
                                                                select: {
                                                                    branch_id: true
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
            });

            // Obtener ventas de combos de usuarios de esta sucursal
            const comboSales = await prisma.sale_detail.findMany({
                where: {
                    combo_id: {
                        not: null
                    },
                    sale: {
                        user: {
                            user_branch: {
                                some: {
                                    branch_id: branchBuffer
                                }
                            }
                        }
                    }
                },
                select: {
                    amount: true,
                    note: true
                }
            });

            // Obtener productos de esta sucursal para mapear en combos
            const products = await prisma.product.findMany({
                where: {
                    branch_id: branchBuffer
                },
                select: {
                    id: true,
                    name: true,
                    product_ingredient: {
                        select: {
                            amount: true,
                            ingredient_id: true
                        }
                    }
                }
            });

            const formattedIngredients = ingredients.map((ingredient) => {
                let totalConsumed = 0;
                const ingredientId = Buffer.from(ingredient.id);

                // Calcular consumo directo de productos
                for (const productIngredient of ingredient.product_ingredient) {
                    const product = productIngredient.product;
                    
                    for (const saleDetail of product.sale_detail) {
                        // Solo considerar ventas de usuarios de esta sucursal
                        if (saleDetail.sale.user.user_branch.length > 0) {
                            totalConsumed += saleDetail.amount * productIngredient.amount;
                        }
                    }
                }

                // Calcular consumo de combos
                for (const comboSale of comboSales) {
                    if (comboSale.note) {
                        // Buscar productos que coincidan con el nombre en la nota
                        const matchingProducts = products.filter(product => 
                            comboSale.note.toLowerCase().includes(product.name.toLowerCase())
                        );

                        for (const product of matchingProducts) {
                            // Buscar si este producto usa el ingrediente actual
                            const productIngredientRelation = product.product_ingredient.find(pi => 
                                Buffer.compare(Buffer.from(pi.ingredient_id), ingredientId) === 0
                            );
                            
                            if (productIngredientRelation) {
                                totalConsumed += comboSale.amount * productIngredientRelation.amount;
                            }
                        }
                    }
                }

                // Calcular stock disponible
                const availableStock = Math.max(0, ingredient.current_stock - totalConsumed);

                return {
                    ...ingredient,
                    id: bufferToUuid(Buffer.from(ingredient.id)),
                    branch_id: bufferToUuid(Buffer.from(ingredient.branch_id)),
                    current_stock: ingredient.current_stock,
                    consumed_stock: totalConsumed,
                    available_stock: availableStock,
                    is_low_stock: availableStock <= ingredient.min_stock
                };
            });

            res.status(200).json(formattedIngredients);
        } catch (error) {
            console.error('Error in getIngredientsByBranch:', error);
            return res.status(500).json({ message: "Error de servidor: " + error });
        }
    },
    async getIngredientConsumptionReport(req: any, res: any) {
        const { ingredient_id, start_date, end_date } = req.query;
        
        try {
            const ingredientBuffer = uuidToBuffer(ingredient_id);
            
            // Validar fechas
            const startDate = start_date ? new Date(start_date as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 días atrás por defecto
            const endDate = end_date ? new Date(end_date as string) : new Date();
            
            // Obtener el ingrediente
            const ingredient = await prisma.ingredient.findUnique({
                where: { id: ingredientBuffer },
                select: {
                    id: true,
                    name: true,
                    current_stock: true,
                    unit_measurement: true,
                    branch_id: true
                }
            });
            
            if (!ingredient) {
                return res.status(404).json({ message: "Ingrediente no encontrado" });
            }
            
            const branchBuffer = ingredient.branch_id ? Buffer.from(ingredient.branch_id) : null;
            
            // Obtener consumo por productos directos
            const productConsumption = await prisma.sale_detail.findMany({
                where: {
                    product: {
                        product_ingredient: {
                            some: {
                                ingredient_id: ingredientBuffer
                            }
                        },
                        branch_id: branchBuffer
                    },
                    sale: {
                        created_at: {
                            gte: startDate,
                            lte: endDate
                        },
                        user: {
                            user_branch: branchBuffer ? {
                                some: {
                                    branch_id: branchBuffer
                                }
                            } : undefined
                        }
                    }
                },
                select: {
                    amount: true,
                    created_at: true,
                    product: {
                        select: {
                            name: true,
                            product_ingredient: {
                                where: {
                                    ingredient_id: ingredientBuffer
                                },
                                select: {
                                    amount: true
                                }
                            }
                        }
                    },
                    sale: {
                        select: {
                            created_at: true,
                            user: {
                                select: {
                                    name: true
                                }
                            }
                        }
                    }
                }
            });
            
            // Obtener consumo por combos
            const comboConsumption = await prisma.sale_detail.findMany({
                where: {
                    combo_id: { not: null },
                    sale: {
                        created_at: {
                            gte: startDate,
                            lte: endDate
                        },
                        user: {
                            user_branch: branchBuffer ? {
                                some: {
                                    branch_id: branchBuffer
                                }
                            } : undefined
                        }
                    }
                },
                select: {
                    amount: true,
                    note: true,
                    created_at: true,
                    combo: {
                        select: {
                            name: true
                        }
                    },
                    sale: {
                        select: {
                            created_at: true,
                            user: {
                                select: {
                                    name: true
                                }
                            }
                        }
                    }
                }
            });
            
            // Obtener productos para mapear en combos
            const products = await prisma.product.findMany({
                where: {
                    branch_id: branchBuffer,
                    product_ingredient: {
                        some: {
                            ingredient_id: ingredientBuffer
                        }
                    }
                },
                select: {
                    name: true,
                    product_ingredient: {
                        where: {
                            ingredient_id: ingredientBuffer
                        },
                        select: {
                            amount: true
                        }
                    }
                }
            });
            
            // Procesar consumo de productos directos
            const directConsumption = productConsumption.map(sale => {
                const consumedAmount = sale.amount * (sale.product?.product_ingredient[0]?.amount || 0);
                return {
                    date: sale.sale.created_at,
                    type: 'product',
                    item_name: sale.product?.name || 'Producto desconocido',
                    quantity_sold: sale.amount,
                    ingredient_consumed: consumedAmount,
                    user: sale.sale.user.name
                };
            });
            
            // Procesar consumo de combos
            const comboConsumptionProcessed = [];
            for (const comboSale of comboConsumption) {
                if (comboSale.note) {
                    const matchingProducts = products.filter(product => 
                        comboSale.note.toLowerCase().includes(product.name.toLowerCase())
                    );
                    
                    for (const product of matchingProducts) {
                        const consumedAmount = comboSale.amount * (product.product_ingredient[0]?.amount || 0);
                        comboConsumptionProcessed.push({
                            date: comboSale.sale.created_at,
                            type: 'combo',
                            item_name: `${comboSale.combo?.name || 'Combo'} (${product.name})`,
                            quantity_sold: comboSale.amount,
                            ingredient_consumed: consumedAmount,
                            user: comboSale.sale.user.name,
                            note: comboSale.note
                        });
                    }
                }
            }
            
            // Combinar y ordenar por fecha
            const allConsumption = [...directConsumption, ...comboConsumptionProcessed]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            
            // Calcular totales
            const totalConsumed = allConsumption.reduce((sum, item) => sum + item.ingredient_consumed, 0);
            const availableStock = Math.max(0, ingredient.current_stock - totalConsumed);
            
            const report = {
                ingredient: {
                    id: bufferToUuid(Buffer.from(ingredient.id)),
                    name: ingredient.name,
                    current_stock: ingredient.current_stock,
                    unit_measurement: ingredient.unit_measurement
                },
                period: {
                    start_date: startDate,
                    end_date: endDate
                },
                summary: {
                    total_consumed: totalConsumed,
                    available_stock: availableStock,
                    consumption_by_type: {
                        direct_products: directConsumption.reduce((sum, item) => sum + item.ingredient_consumed, 0),
                        combos: comboConsumptionProcessed.reduce((sum, item) => sum + item.ingredient_consumed, 0)
                    }
                },
                consumption_details: allConsumption
            };
            
            res.status(200).json(report);
        } catch (error) {
            console.error('Error in getIngredientConsumptionReport:', error);
            return res.status(500).json({ message: "Error de servidor: " + error });
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