import { Op } from "sequelize";
import Product from "../models/product.js";
import Category from "../models/category.js";

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