import { Op, fn, col } from "sequelize";
import { sequelize } from "../models/index.js";
import Product from "../models/product.js";
import Category from "../models/category.js";
import OrderDetails from "../models/orderDetails.js";
import Review from "../models/review.js";
import CartItems from "../models/cartItems.js";
import User from "../models/user.js";

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
        // Validate and parse parameters
        const {
            query,
            categoria_id,
            in_stock,
            sort_by = 'created_at',
            order = 'DESC'
        } = req.query;

        const min_price = parseFloat(req.query.min_price);
        const max_price = parseFloat(req.query.max_price);
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
        const offset = (page - 1) * limit;

        // Validate price range
        if (!isNaN(min_price) && !isNaN(max_price) && min_price > max_price) {
            return res.status(400).json({
                error: "min_price cannot be greater than max_price"
            });
        }

        const whereClause = {};

        // Improved text search
        if (query) {
            const searchTerms = query.trim().split(' ').filter(term => term.length > 0);
            if (searchTerms.length > 0) {
                whereClause[Op.and] = searchTerms.map(term => ({
                    [Op.or]: [
                        {
                            nombre: sequelize.where(
                                sequelize.fn('LOWER', sequelize.col('Product.nombre')),
                                'LIKE',
                                `%${term.toLowerCase()}%`
                            )
                        },
                        {
                            description: sequelize.where(
                                sequelize.fn('LOWER', sequelize.col('Product.description')),
                                'LIKE',
                                `%${term.toLowerCase()}%`
                            )
                        }
                    ]
                }));
            }
        }

        // Price filter
        if (!isNaN(min_price) || !isNaN(max_price)) {
            whereClause.precio = {};
            if (!isNaN(min_price)) whereClause.precio[Op.gte] = min_price;
            if (!isNaN(max_price)) whereClause.precio[Op.lte] = max_price;
        }

        // Category and stock filters
        if (categoria_id) whereClause.categoria_id = categoria_id;
        if (in_stock === 'true') whereClause.stock = { [Op.gt]: 0 };

        // Validate sort field
        const validSortFields = ['nombre', 'precio', 'created_at', 'stock'];
        const sortField = validSortFields.includes(sort_by) ? sort_by : 'created_at';
        const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        // Execute optimized query
        const { count, rows: products } = await Product.findAndCountAll({
            where: whereClause,
            include: [{
                model: Category,
                attributes: ['id', 'nombre'],
                required: true
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
            ],
            order: [[sortField, sortOrder]],
            limit,
            offset,
            distinct: true
        });

        // Format response
        const formattedProducts = products.map(product => ({
            ...product.toJSON(),
            precio: parseFloat(product.precio)
        }));

        // Set cache headers
        res.set('Cache-Control', 'public, max-age=300');

        return res.status(200).json({
            message: "Products found successfully",
            data: {
                products: formattedProducts,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(count / limit),
                    totalItems: count,
                    itemsPerPage: limit
                },
                filters: {
                    query,
                    min_price,
                    max_price,
                    categoria_id,
                    in_stock
                },
                sorting: {
                    field: sortField,
                    order: sortOrder
                }
            }
        });

    } catch (error) {
        console.error('Error searching products:', error);
        return res.status(500).json({
            error: "Error searching products",
            details: error.message
        });
    }
};

export const getProductReviews = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate ID
        if (!id) {
            return res.status(400).json({
                error: "Product ID is required"
            });
        }

        // Validate product exists
        const product = await Product.findByPk(id, {
            attributes: ['id', 'nombre']
        });

        if (!product) {
            return res.status(404).json({
                error: "Product not found",
                productId: id
            });
        }

        // Implement pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // Get reviews with pagination and related data
        const reviews = await Review.findAndCountAll({
            where: { producto_id: id },
            include: [{
                model: User,
                attributes: ['id', 'firstName', 'lastName_father', 'lastName_mother']
            }],
            attributes: [
                'id',
                'rating',
                'review_text',
                'created_at',
                'updated_at'
            ],
            order: [['created_at', 'DESC']],
            limit,
            offset
        });

        // Handle no reviews found
        if (reviews.count === 0) {
            return res.status(404).json({
                message: "No reviews found for this product",
                productId: id,
                productName: product.nombre
            });
        }

        // Calculate pagination metadata
        const totalPages = Math.ceil(reviews.count / limit);

        // Calculate average rating
        const averageRating = await Review.findOne({
            where: { producto_id: id },
            attributes: [
                [sequelize.fn('ROUND', sequelize.fn('AVG', sequelize.col('rating')), 1), 'avgRating'],
                [sequelize.fn('COUNT', sequelize.col('rating')), 'totalRatings']
            ],
            raw: true
        });

        return res.status(200).json({
            message: "Product reviews retrieved successfully",
            data: {
                product: {
                    id: product.id,
                    nombre: product.nombre,
                    averageRating: averageRating?.avgRating || 0,
                    totalRatings: averageRating?.totalRatings || 0
                },
                reviews: reviews.rows,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalItems: reviews.count,
                    itemsPerPage: limit
                }
            }
        });

    } catch (error) {
        console.error('Error getting product reviews:', {
            error: error.message,
            stack: error.stack
        });

        return res.status(500).json({
            error: "Error retrieving product reviews",
            details: error.message
        });
    }
};

export const updateProductStock = async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity } = req.body;

        // Validate inputs
        if (!id) {
            return res.status(400).json({
                error: "Product ID is required"
            });
        }

        if (quantity === undefined) {
            return res.status(400).json({
                error: "Quantity is required"
            });
        }

        // Parse quantity to integer
        const quantityToAdd = parseInt(quantity);
        if (isNaN(quantityToAdd)) {
            return res.status(400).json({
                error: "Quantity must be a valid number"
            });
        }

        // Get product with minimal data
        const product = await Product.findByPk(id, {
            attributes: ['id', 'nombre', 'stock']
        });

        if (!product) {
            return res.status(404).json({
                error: "Product not found",
                productId: id
            });
        }

        // Calculate new stock
        const newStock = product.stock + quantityToAdd;

        // Validate new stock
        if (newStock < 0) {
            return res.status(400).json({
                error: "Insufficient stock",
                currentStock: product.stock,
                requestedChange: quantityToAdd
            });
        }

        // Update stock with timestamp
        await product.update({
            stock: newStock,
            updated_at: new Date()
        });

        return res.status(200).json({
            message: "Stock updated successfully",
            data: {
                productId: id,
                productName: product.nombre,
                previousStock: product.stock,
                change: quantityToAdd,
                newStock: newStock,
                updatedAt: new Date()
            }
        });

    } catch (error) {
        console.error('Error updating stock:', {
            error: error.message,
            stack: error.stack
        });

        return res.status(500).json({
            error: "Error updating stock",
            details: error.message
        });
    }
};

export const getFeaturedProducts = async (req, res) => {
    try {
        // Get featured products with optimized query
        const featuredProducts = await Product.findAll({
            where: {
                stock: { [Op.gt]: 0 },
                // Optionally add more criteria for "featured" products
                precio: { [Op.gt]: 0 }
            },
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
                'created_at'
            ],
            order: [
                ['created_at', 'DESC'],
                ['precio', 'DESC']
            ],
            limit: 6
        });

        // Handle no products found
        if (!featuredProducts.length) {
            return res.status(404).json({
                message: "No featured products available"
            });
        }

        // Format response data
        const formattedProducts = featuredProducts.map(product => ({
            ...product.toJSON(),
            precio: parseFloat(product.precio)
        }));

        return res.status(200).json({
            message: "Featured products retrieved successfully",
            data: {
                products: formattedProducts,
                count: formattedProducts.length
            }
        });

    } catch (error) {
        console.error('Error getting featured products:', {
            error: error.message,
            stack: error.stack
        });

        return res.status(500).json({
            error: "Error retrieving featured products",
            details: error.message
        });
    }
};
