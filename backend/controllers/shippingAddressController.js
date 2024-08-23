import ShippingAddress from "../models/shippingAddress.js";

export const createShippingAddress = async(req, res) => {
  try {
    const { usuario_id: usuarioId, direccion, ciudad, estado_provincia: estadoProvincia, codigo_postal: codigoPostal, pais } = req.body;
    const shippingAddress = await ShippingAddress.create({
      usuario_id: usuarioId,
      direccion,
      ciudad,
      estado_provincia: estadoProvincia,
      codigo_postal: codigoPostal,
      pais
    });
    res.status(201).json(shippingAddress);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getShippingAddressesByUserId = async(req, res) => {
  try {
    const { usuario_id: usuarioId } = req.params;
    const shippingAddresses = await ShippingAddress.findAll({ where: { usuario_id: usuarioId } });
    res.status(200).json(shippingAddresses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};