import Cart from "../models/cart.js";

export const createCart = async(req, res) => {
  try {
    const { usuario_id: usuarioId } = req.body;
    const cart = await Cart.create({ usuario_id: usuarioId });
    res.status(201).json(cart);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getCartById = async(req, res) => {
  try {
    const { id } = req.params;
    const cart = await Cart.findByPk(id);
    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }
    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteCart = async(req, res) => {
  try {
    const { id } = req.params;
    const cart = await Cart.findByPk(id);
    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }
    await cart.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};