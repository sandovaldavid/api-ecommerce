import CartItem from "../models/cartItems.js";

export const addCartItem = async (req, res) => {
    try {
        const { cart_id: cartId, product_id: productId, cantidad } = req.body;
        const cartItem = await CartItem.create({ cart_id: cartId, product_id: productId, cantidad: quantity });
        res.status(201).json(cartItem);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updateCartItem = async (req, res) => {
    try {
        const { id } = req.params;
        const { cantidad } = req.body;
        const cartItem = await CartItem.findByPk(id);
        if (!cartItem) {
            return res.status(404).json({ error: "CartItem not found" });
        }
        cartItem.quantity = cantidad;
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
        const { cart_id: cartId } = req.params;
        const cartItems = await CartItem.findAll({ where: { cart_id: cartId } });
        res.status(200).json(cartItems);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};