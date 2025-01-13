import ShippingAddress from "../models/shippingAddress.js";

export const createShippingAddress = async (req, res) => {
    try {
        // Destructure and validate required fields
        const {
            usuario_id: usuarioId,
            direccion,
            ciudad,
            estado_provincia: estadoProvincia,
            codigo_postal: codigoPostal,
            pais
        } = req.body;

        // Input validation
        if (!usuarioId || !direccion || !ciudad || !estadoProvincia || !codigoPostal || !pais) {
            return res.status(400).json({
                error: "All fields are required",
                required: ["usuario_id", "direccion", "ciudad", "estado_provincia", "codigo_postal", "pais"]
            });
        }

        // Check maximum addresses per user
        const userAddressCount = await ShippingAddress.count({
            where: { usuario_id: usuarioId }
        });
        if (userAddressCount >= 5) {
            return res.status(400).json({
                error: "Maximum number of addresses reached (5)"
            });
        }

        // Create shipping address
        const shippingAddress = await ShippingAddress.create({
            usuario_id: usuarioId,
            direccion: direccion.trim(),
            ciudad: ciudad.trim(),
            estado_provincia: estadoProvincia.trim(),
            codigo_postal: codigoPostal.trim(),
            pais: pais.trim()
        });

        // Return success response
        return res.status(201).json({
            message: "Shipping address created successfully",
            data: shippingAddress
        });

    } catch (error) {
        console.error('Error creating shipping address:', error);
        return res.status(500).json({
            error: "Error creating shipping address",
            details: error.message
        });
    }
};

export const getShippingAddressesByUserId = async (req, res) => {
    try {
        const { usuario_id: usuarioId } = req.params;
        const shippingAddresses = await ShippingAddress.findAll({ where: { usuario_id: usuarioId } });
        res.status(200).json(shippingAddresses);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getAllShippingAddresses = async (req, res) => {
    try {
        const shippingAddresses = await ShippingAddress.findAll();
        res.status(200).json(shippingAddresses);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteShippingAddress = async (req, res) => {
    try {
        const { id_ShipingAddress } = req.params;
        await ShippingAddress.destroy({ where: { id_ShipingAddress } });
        res.status(204).end();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}