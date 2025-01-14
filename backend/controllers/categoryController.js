import Category from "../models/category.js";

export const getAllCategories = async (req, res) => {
    try {
        const categories = await Category.findAll();
        res.status(200).json(categories);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const createCategory = async (req, res) => {
    try {
        const { nombre, descripcion } = req.body;
        const category = await Category.create({ nombre: name, descripcion });
        res.status(201).json(category);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};