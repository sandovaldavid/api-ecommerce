import { Op } from "sequelize";
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
        const { name, categoryId,  minPrice, maxPrice } = req.query;

        // Build where clause
        const whereClause = {};
        if (name) {
            whereClause.name = {
                [Op.like]: `%${name}%`
            };
        }
        if (categoryId) whereClause.categoryId = categoryId;
        if (minPrice || maxPrice) {
            whereClause.price = {};
            if (minPrice) whereClause.price[Op.gte] = minPrice;
            if (maxPrice) whereClause.price[Op.lte] = maxPrice;
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
            order: [["created_at", "DESC"]],
            include: [{
                model: Category,
                attributes: ["id", "name"]
            }],
            attributes: [
                "id",
                "name",
                "url_img",
                "description",
                "price",
                "stock",
                "created_at",
                "updated_at"
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
        console.error("Error getting products:", error);
        return res.status(500).json({
            error: "Error retrieving products",
            details: error.message
        });
    }
};

export const createProduct = async (req, res) => {
    try {
        const {
            name,
            description,
            price,
            stock,
            categoryId,
            url_img: urlImg
        } = req.body;

        // Input validation
        if (!name || !price || !categoryId) {
            return res.status(400).json({
                error: "Missing required fields",
                required: ["name", "price", "categoryId"]
            });
        }

        // Validate price and stock
        if (price <= 0) {
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
        const categoryExists = await Category.findByPk(categoryId);
        if (!categoryExists) {
            return res.status(404).json({
                error: "Category not found"
            });
        }

        // Check if product name already exists
        const existingProduct = await Product.findOne({
            where: { name: name.trim() }
        });

        if (existingProduct) {
            return res.status(400).json({
                error: "Product name already exists"
            });
        }

        // Create product with cleaned data
        const product = await Product.create({
            name: name.trim(),
            description: description?.trim(),
            price: parseFloat(price),
            stock: parseInt(stock) || 0,
            categoryId,
            url_img: urlImg?.trim() || "https://placehold.co/400x300"
        });

        // Get product with category information
        const productWithCategory = await Product.findByPk(product.id, {
            include: [{
                model: Category,
                attributes: ["id", "name"]
            }]
        });

        return res.status(201).json({
            message: "Product created successfully",
            data: productWithCategory
        });

    } catch (error) {
        console.error("Error creating product:", error);
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
                attributes: ["id", "name", "description"]
            }],
            attributes: [
                "id",
                "name",
                "url_img",
                "description",
                "price",
                "stock",
                "categoryId",
                "created_at",
                "updated_at"
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
            price: parseFloat(product.price)
        };

        return res.status(200).json({
            message: "Product retrieved successfully",
            data: formattedProduct
        });

    } catch (error) {
        console.error("Error getting product:", {
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
            name,
            description,
            price,
            stock,
            categoryId,
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
                attributes: ["id", "name"]
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
        if (price !== undefined && price <= 0) {
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
        if (categoryId && categoryId !== product.categoryId) {
            const categoryExists = await Category.findByPk(categoryId);
            if (!categoryExists) {
                return res.status(404).json({
                    error: "Category not found"
                });
            }
        }

        // Check if new name is unique if provided
        if (name && name !== product.name) {
            const existingProduct = await Product.findOne({
                where: { name: name.trim() }
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

        if (name) updates.name = name.trim();
        if (description !== undefined) updates.description = description?.trim();
        if (price !== undefined) updates.price = parseFloat(price);
        if (stock !== undefined) updates.stock = parseInt(stock);
        if (categoryId) updates.categoria_id = categoryId;
        if (urlImg !== undefined) updates.url_img = urlImg?.trim() || "https://placehold.co/400x300";

        // Update product
        await product.update(updates);

        // Get updated product with category info
        const updatedProduct = await Product.findByPk(id, {
            include: [{
                model: Category,
                attributes: ["id", "name"]
            }],
            attributes: [
                "id",
                "name",
                "url_img",
                "description",
                "price",
                "stock",
                "categoryId",
                "created_at",
                "updated_at"
            ]
        });

        return res.status(200).json({
            message: "Product updated successfully",
            data: {
                ...updatedProduct.toJSON(),
                price: parseFloat(updatedProduct.price)
            }
        });

    } catch (error) {
        console.error("Error updating product:", error);
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
                attributes: ["id", "name"]
            }],
            attributes: ["id", "name", "stock"]
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
            where: { productId: id }
        });

        if (hasActiveOrders) {
            return res.status(400).json({
                error: "Cannot delete product with active orders"
            });
        }

        // Delete related records first
        await Review.destroy({
            where: { productId: id }
        });

        await CartItems.destroy({
            where: { productId: id }
        });

        // Delete product
        await product.destroy();

        return res.status(200).json({
            message: "Product deleted successfully",
            data: {
                productId: id,
                productName: product.name,
                category: product.Category.name
            }
        });

    } catch (error) {
        console.error("Error deleting product:", {
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
            categoryId,
            inStock,
            sortBy = "created_at",
            order = "DESC"
        } = req.query;

        const minPrice = parseFloat(req.query.minPrice);
        const maxPrice = parseFloat(req.query.maxPrice);
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
        const offset = (page - 1) * limit;

        // Validate price range
        if (!isNaN(minPrice) && !isNaN(maxPrice) && minPrice > maxPrice) {
            return res.status(400).json({
                error: "minPrice cannot be greater than maxPrice"
            });
        }

        const whereClause = {};

        // Improved text search
        if (query) {
            const searchTerms = query.trim().split(" ").filter(term => term.length > 0);
            if (searchTerms.length > 0) {
                whereClause[Op.and] = searchTerms.map(term => ({
                    [Op.or]: [
                        {
                            name: sequelize.where(
                                sequelize.fn("LOWER", sequelize.col("Product.name")),
                                "LIKE",
                                `%${term.toLowerCase()}%`
                            )
                        },
                        {
                            description: sequelize.where(
                                sequelize.fn("LOWER", sequelize.col("Product.description")),
                                "LIKE",
                                `%${term.toLowerCase()}%`
                            )
                        }
                    ]
                }));
            }
        }

        // Price filter
        if (!isNaN(minPrice) || !isNaN(maxPrice)) {
            whereClause.price = {};
            if (!isNaN(minPrice)) whereClause.price[Op.gte] = minPrice;
            if (!isNaN(maxPrice)) whereClause.price[Op.lte] = maxPrice;
        }

        // Category and stock filters
        if (categoryId) whereClause.categoria_id = categoryId;
        if (inStock === "true") whereClause.stock = { [Op.gt]: 0 };

        // Validate sort field
        const validSortFields = ["name", "price", "created_at", "stock"];
        const sortField = validSortFields.includes(sortBy) ? sortBy : "created_at";
        const sortOrder = order.toUpperCase() === "ASC" ? "ASC" : "DESC";

        // Execute optimized query
        const { count, rows: products } = await Product.findAndCountAll({
            where: whereClause,
            include: [{
                model: Category,
                attributes: ["id", "name"],
                required: true
            }],
            attributes: [
                "id",
                "name",
                "url_img",
                "description",
                "price",
                "stock",
                "created_at",
                "updated_at"
            ],
            order: [[sortField, sortOrder]],
            limit,
            offset,
            distinct: true
        });

        // Format response
        const formattedProducts = products.map(product => ({
            ...product.toJSON(),
            price: parseFloat(product.price)
        }));

        // Set cache headers
        res.set("Cache-Control", "public, max-age=300");

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
                    minPrice,
                    maxPrice,
                    categoryId,
                    inStock
                },
                sorting: {
                    field: sortField,
                    order: sortOrder
                }
            }
        });

    } catch (error) {
        console.error("Error searching products:", error);
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
            attributes: ["id", "name"]
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
            where: { productId: id },
            include: [{
                model: User,
                attributes: ["id", "firstName", "lastNameFather", "lastNameMother"]
            }],
            attributes: [
                "id",
                "rating",
                "review_text",
                "created_at",
                "updated_at"
            ],
            order: [["created_at", "DESC"]],
            limit,
            offset
        });

        // Handle no reviews found
        if (reviews.count === 0) {
            return res.status(404).json({
                message: "No reviews found for this product",
                productId: id,
                productName: product.name
            });
        }

        // Calculate pagination metadata
        const totalPages = Math.ceil(reviews.count / limit);

        // Calculate average rating
        const averageRating = await Review.findOne({
            where: { productId: id },
            attributes: [
                [sequelize.fn("ROUND", sequelize.fn("AVG", sequelize.col("rating")), 1), "avgRating"],
                [sequelize.fn("COUNT", sequelize.col("rating")), "totalRatings"]
            ],
            raw: true
        });

        return res.status(200).json({
            message: "Product reviews retrieved successfully",
            data: {
                product: {
                    id: product.id,
                    name: product.name,
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
        console.error("Error getting product reviews:", {
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
            attributes: ["id", "name", "stock"]
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
                productName: product.name,
                previousStock: product.stock,
                change: quantityToAdd,
                newStock,
                updatedAt: new Date()
            }
        });

    } catch (error) {
        console.error("Error updating stock:", {
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
                price: { [Op.gt]: 0 }
            },
            include: [{
                model: Category,
                attributes: ["id", "name", "description"]
            }],
            attributes: [
                "id",
                "name",
                "url_img",
                "description",
                "price",
                "stock",
                "created_at"
            ],
            order: [
                ["created_at", "DESC"],
                ["price", "DESC"]
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
            price: parseFloat(product.price)
        }));

        return res.status(200).json({
            message: "Featured products retrieved successfully",
            data: {
                products: formattedProducts,
                count: formattedProducts.length
            }
        });

    } catch (error) {
        console.error("Error getting featured products:", {
            error: error.message,
            stack: error.stack
        });

        return res.status(500).json({
            error: "Error retrieving featured products",
            details: error.message
        });
    }
};