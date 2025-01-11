import Product from "../models/product.js";

export const getAllProducts = async (req, res) => {
    try {
        const products = await Product.findAll();
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
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