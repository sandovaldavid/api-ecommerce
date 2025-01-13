import { Op } from "sequelize";
import Product from "../models/product.js";
import Category from "../models/category.js";
import OrderDetails from "../models/orderDetails.js";
import Review from "../models/review.js";
import CartItems from "../models/cartItems.js";

export const getAllProducts = async (req, res) => {
    try {
        // Implement pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // Get filters from query params
        const { nombre, categoria_id, precio_min, precio_max } = req.query;

        // Build where clause
        const whereClause = {};
        if (nombre) {
            whereClause.nombre = {
                [Op.like]: `%${nombre}%`
            };
        }
        if (categoria_id) whereClause.categoria_id = categoria_id;
        if (precio_min || precio_max) {
            whereClause.precio = {};
            if (precio_min) whereClause.precio[Op.gte] = precio_min;
            if (precio_max) whereClause.precio[Op.lte] = precio_max;
        }

        // Get total count for pagination
        const totalCount = await Product.count({ where: whereClause });

        if (totalCount === 0) {
            return res.status(404).json({
                message: "No products found"
            });
        }

        // Get products with pagination and includes
        const products = await Product.findAll({
            where: whereClause,
            limit,
            offset,
            order: [['created_at', 'DESC']],
            include: [{
                model: Category,
                attributes: ['id', 'nombre']
            }],
            attributes: [
                'id',
                'nombre',
                'url_img',
                'description',
                'precio',
                'stock',
                'created_at',
                'updated_at'
            ]
        });

        // Calculate pagination metadata
        const totalPages = Math.ceil(totalCount / limit);

        return res.status(200).json({
            message: "Products retrieved successfully",
            data: {
                products,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalItems: totalCount,
                    itemsPerPage: limit
                }
            }
        });

    } catch (error) {
        console.error('Error getting products:', error);
        return res.status(500).json({
            error: "Error retrieving products",
            details: error.message
        });
    }
};

export const createProduct = async (req, res) => {
    try {
        const {
            nombre,
            description,
            precio,
            stock,
            categoria_id: categoriaId,
            url_img: urlImg
        } = req.body;

        // Input validation
        if (!nombre || !precio || !categoriaId) {
            return res.status(400).json({
                error: "Missing required fields",
                required: ["nombre", "precio", "categoria_id"]
            });
        }

        // Validate price and stock
        if (precio <= 0) {
            return res.status(400).json({
                error: "Price must be greater than 0"
            });
        }

        if (stock < 0) {
            return res.status(400).json({
                error: "Stock cannot be negative"
            });
        }

        // Check if category exists
        const categoryExists = await Category.findByPk(categoriaId);
        if (!categoryExists) {
            return res.status(404).json({
                error: "Category not found"
            });
        }

        // Check if product name already exists
        const existingProduct = await Product.findOne({
            where: { nombre: nombre.trim() }
        });

        if (existingProduct) {
            return res.status(400).json({
                error: "Product name already exists"
            });
        }

        // Create product with cleaned data
        const product = await Product.create({
            nombre: nombre.trim(),
            description: description?.trim(),
            precio: parseFloat(precio),
            stock: parseInt(stock) || 0,
            categoria_id: categoriaId,
            url_img: urlImg?.trim() || "https://placehold.co/400x300"
        });

        // Get product with category information
        const productWithCategory = await Product.findByPk(product.id, {
            include: [{
                model: Category,
                attributes: ['id', 'nombre']
            }]
        });

        return res.status(201).json({
            message: "Product created successfully",
            data: productWithCategory
        });

    } catch (error) {
        console.error('Error creating product:', error);
        return res.status(500).json({
            error: "Error creating product",
            details: error.message
        });
    }
};

export const getProductById = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate ID
        if (!id) {
            return res.status(400).json({
                error: "Product ID is required"
            });
        }

        // Get product with cached query
        const product = await Product.findByPk(id, {
            include: [{
                model: Category,
                attributes: ['id', 'nombre', 'description']
            }],
            attributes: [
                'id',
                'nombre',
                'url_img',
                'description',
                'precio',
                'stock',
                'categoria_id',
                'created_at',
                'updated_at'
            ]
        });

        // Handle not found
        if (!product) {
            return res.status(404).json({
                error: "Product not found",
                productId: id
            });
        }

        // Format response
        const formattedProduct = {
            ...product.toJSON(),
            precio: parseFloat(product.precio)
        };

        return res.status(200).json({
            message: "Product retrieved successfully",
            data: formattedProduct
        });

    } catch (error) {
        console.error('Error getting product:', {
            error: error.message,
            stack: error.stack
        });

        return res.status(500).json({
            error: "Error retrieving product",
            details: error.message
        });
    }
};

export const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            nombre,
            description,
            precio,
            stock,
            categoria_id: categoriaId,
            url_img: urlImg
        } = req.body;

        // Validate ID
        if (!id) {
            return res.status(400).json({
                error: "Product ID is required"
            });
        }

        // Get product with category to minimize DB queries
        const product = await Product.findByPk(id, {
            include: [{
                model: Category,
                attributes: ['id', 'nombre']
            }]
        });

        // Handle not found
        if (!product) {
            return res.status(404).json({
                error: "Product not found",
                productId: id
            });
        }

        // Validate price if provided
        if (precio !== undefined && precio <= 0) {
            return res.status(400).json({
                error: "Price must be greater than 0"
            });
        }

        // Validate stock if provided
        if (stock !== undefined && stock < 0) {
            return res.status(400).json({
                error: "Stock cannot be negative"
            });
        }

        // Check if new category exists if provided
        if (categoriaId && categoriaId !== product.categoria_id) {
            const categoryExists = await Category.findByPk(categoriaId);
            if (!categoryExists) {
                return res.status(404).json({
                    error: "Category not found"
                });
            }
        }

        // Check if new name is unique if provided
        if (nombre && nombre !== product.nombre) {
            const existingProduct = await Product.findOne({
                where: { nombre: nombre.trim() }
            });
            if (existingProduct) {
                return res.status(400).json({
                    error: "Product name already exists"
                });
            }
        }

        // Prepare update data with validation
        const updates = {
            updated_at: new Date()
        };

        if (nombre) updates.nombre = nombre.trim();
        if (description !== undefined) updates.description = description?.trim();
        if (precio !== undefined) updates.precio = parseFloat(precio);
        if (stock !== undefined) updates.stock = parseInt(stock);
        if (categoriaId) updates.categoria_id = categoriaId;
        if (urlImg !== undefined) updates.url_img = urlImg?.trim() || "https://placehold.co/400x300";

        // Update product
        await product.update(updates);

        // Get updated product with category info
        const updatedProduct = await Product.findByPk(id, {
            include: [{
                model: Category,
                attributes: ['id', 'nombre']
            }],
            attributes: [
                'id',
                'nombre',
                'url_img',
                'description',
                'precio',
                'stock',
                'categoria_id',
                'created_at',
                'updated_at'
            ]
        });

        return res.status(200).json({
            message: "Product updated successfully",
            data: {
                ...updatedProduct.toJSON(),
                precio: parseFloat(updatedProduct.precio)
            }
        });

    } catch (error) {
        console.error('Error updating product:', error);
        return res.status(500).json({
            error: "Error updating product",
            details: error.message
        });
    }
};

export const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate ID
        if (!id) {
            return res.status(400).json({
                error: "Product ID is required"
            });
        }

        // Check if product exists and get related info
        const product = await Product.findByPk(id, {
            include: [{
                model: Category,
                attributes: ['id', 'nombre']
            }],
            attributes: ['id', 'nombre', 'stock']
        });

        // Handle not found
        if (!product) {
            return res.status(404).json({
                error: "Product not found",
                productId: id
            });
        }

        // Check if product can be deleted (optional business rules)
        const hasActiveOrders = await OrderDetails.findOne({
            where: { producto_id: id }
        });

        if (hasActiveOrders) {
            return res.status(400).json({
                error: "Cannot delete product with active orders"
            });
        }

        // Delete related records first
        await Review.destroy({
            where: { producto_id: id }
        });

        await CartItems.destroy({
            where: { product_id: id }
        });

        // Delete product
        await product.destroy();

        return res.status(200).json({
            message: "Product deleted successfully",
            data: {
                productId: id,
                productName: product.nombre,
                category: product.Category.nombre
            }
        });

    } catch (error) {
        console.error('Error deleting product:', {
            error: error.message,
            stack: error.stack
        });

        return res.status(500).json({
            error: "Error deleting product",
            details: error.message
        });
    }
};

export const searchProducts = async (req, res) => {
    try {
        const {
            query,
            min_price,
            max_price,
            categoria_id,
            in_stock
        } = req.query;

        const whereClause = {};

        if (query) {
            whereClause[Op.or] = [
                { nombre: { [Op.like]: `%${query}%` } },
                { description: { [Op.like]: `%${query}%` } }
            ];
        }

        if (min_price || max_price) {
            whereClause.precio = {};
            if (min_price) whereClause.precio[Op.gte] = min_price;
            if (max_price) whereClause.precio[Op.lte] = max_price;
        }

        if (categoria_id) whereClause.categoria_id = categoria_id;
        if (in_stock === 'true') whereClause.stock = { [Op.gt]: 0 };

        const products = await Product.findAndCountAll({
            where: whereClause,
            include: [{
                model: Category,
                attributes: ['id', 'nombre']
            }]
        });

        res.status(200).json({
            message: "Products found",
            data: products
        });
    } catch (error) {
        console.error('Error searching products:', error);
        res.status(500).json({
            error: "Error searching products",
            details: error.message
        });
    }
};
