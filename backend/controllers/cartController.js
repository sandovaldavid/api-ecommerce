import Carts from '../models/carts.js';

export const createCart = async (req, res) => {
  try {
    const {usuario_id} = req.body;
    const cart = await Carts.create({usuario_id});
    res.status(201).json(cart);
  } catch (error) {
    res.status(500).json({error: error.message});
  }
};

export const getCartById = async (req, res) => {
  try {
    const {id} = req.params;
    const cart = await Carts.findByPk(id);
    if (!cart) {
      return res.status(404).json({error: 'Carts not found'});
    }
    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({error: error.message});
  }
};

export const deleteCart = async (req, res) => {
  try {
    const {id} = req.params;
    const cart = await Carts.findByPk(id);
    if (!cart) {
      return res.status(404).json({error: 'Carts not found'});
    }
    await cart.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({error: error.message});
  }
};
