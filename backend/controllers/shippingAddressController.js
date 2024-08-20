import ShippingAddress from '../models/shippingAddress.js';

export const createShippingAddress = async (req, res) => {
  try {
    const {usuario_id, direccion, ciudad, estado_provincia, codigo_postal, pais} = req.body;
    const shippingAddress = await ShippingAddress.create({
      usuario_id,
      direccion,
      ciudad,
      estado_provincia,
      codigo_postal,
      pais
    });
    res.status(201).json(shippingAddress);
  } catch (error) {
    res.status(500).json({error: error.message});
  }
};

export const getShippingAddressesByUserId = async (req, res) => {
  try {
    const {usuario_id} = req.params;
    const shippingAddresses = await ShippingAddress.findAll({where: {usuario_id}});
    res.status(200).json(shippingAddresses);
  } catch (error) {
    res.status(500).json({error: error.message});
  }
};
