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
        const { nombre, descripcion, precio, stock, categoria_id: categoriaId } = req.body;
        const product = await Product.create({ nombre, descripcion, precio, stock, categoria_id: categoriaId });
        res.status(201).json(product);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};