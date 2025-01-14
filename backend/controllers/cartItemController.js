import CartItem from "../models/cartItems.js";

export const addCartItem = async (req, res) => {
    try {
        const { cartId, productId, quantity } = req.body;
        const cartItem = await CartItem.create({ cartId, productId, quantity });
        res.status(201).json(cartItem);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updateCartItem = async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity } = req.body;
        const cartItem = await CartItem.findByPk(id);
        if (!cartItem) {
            return res.status(404).json({ error: "CartItem not found" });
        }
        cartItem.quantity = quantity;
        await cartItem.save();
        res.status(200).json(cartItem);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteCartItem = async (req, res) => {
    try {
        const { id } = req.params;
        const cartItem = await CartItem.findByPk(id);
        if (!cartItem) {
            return res.status(404).json({ error: "CartItem not found" });
        }
        await cartItem.destroy();
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getCartItemsByCartId = async (req, res) => {
    try {
        const { cartId } = req.params;
        const cartItems = await CartItem.findAll({ where: { cartId } });
        res.status(200).json(cartItems);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};