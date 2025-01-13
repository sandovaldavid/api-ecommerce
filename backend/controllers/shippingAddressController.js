import ShippingAddress from "../models/shippingAddress.js";
import User from "../models/user.js";

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

        // Check if user exists
        const userExists = await User.findByPk(usuarioId);
        if (!userExists) {
            return res.status(404).json({
                error: "User not found"
            });
        }

        // Check maximum addresses per user
        const userAddressCount = await ShippingAddress.count({
            where: { usuario_id: usuarioId }
        });

        if (userAddressCount >= 5) {
            return res.status(400).json({
                error: "Maximum number of addresses reached (5)",
                currentCount: userAddressCount
            });
        }

        // Validate postal code format (example)
        const postalCodeRegex = /^\d{5}(-\d{4})?$/;
        if (!postalCodeRegex.test(codigoPostal.trim())) {
            return res.status(400).json({
                error: "Invalid postal code format"
            });
        }

        // Create shipping address with cleaned data
        const shippingAddress = await ShippingAddress.create({
            usuario_id: usuarioId,
            direccion: direccion.trim(),
            ciudad: ciudad.trim(),
            estado_provincia: estadoProvincia.trim(),
            codigo_postal: codigoPostal.trim(),
            pais: pais.trim(),
            created_at: new Date(),
            updated_at: new Date()
        });

        // Get address with user information
        const addressWithUser = await ShippingAddress.findByPk(shippingAddress.id, {
            include: [{
                model: User,
                attributes: ['id', 'firstName', 'lastName_father']
            }]
        });

        return res.status(201).json({
            message: "Shipping address created successfully",
            data: addressWithUser
        });

    } catch (error) {
        console.error('Error creating shipping address:', {
            error: error.message,
            stack: error.stack
        });

        return res.status(500).json({
            error: "Error creating shipping address",
            details: error.message
        });
    }
};

export const getShippingAddressesByUserId = async (req, res) => {
    try {
        const { usuario_id: usuarioId } = req.params;

        // Validate user ID
        if (!usuarioId) {
            return res.status(400).json({
                error: "User ID is required"
            });
        }

        // Check if user exists
        const user = await User.findByPk(usuarioId, {
            attributes: ['id', 'firstName', 'lastName_father']
        });

        if (!user) {
            return res.status(404).json({
                error: "User not found",
                userId: usuarioId
            });
        }

        // Get addresses with pagination
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
        const offset = (page - 1) * limit;

        // Get addresses count and data in a single query
        const shippingAddresses = await ShippingAddress.findAndCountAll({
            where: { usuario_id: usuarioId },
            limit,
            offset,
            order: [['created_at', 'DESC']],
            attributes: [
                'id',
                'direccion',
                'ciudad',
                'estado_provincia',
                'codigo_postal',
                'pais',
                'created_at',
                'updated_at'
            ],
            include: [{
                model: User,
                attributes: ['id', 'firstName', 'lastName_father'],
                required: true
            }],
            distinct: true
        });

        // Handle no addresses found
        if (shippingAddresses.count === 0) {
            return res.status(404).json({
                message: "No shipping addresses found for this user",
                userId: usuarioId,
                userName: user.firstName
            });
        }

        // Calculate pagination metadata
        const totalPages = Math.ceil(shippingAddresses.count / limit);

        // Set cache headers for better performance
        res.set('Cache-Control', 'private, max-age=300');

        return res.status(200).json({
            message: "Shipping addresses retrieved successfully",
            data: {
                user: {
                    id: user.id,
                    name: `${user.firstName} ${user.lastName_father}`
                },
                addresses: shippingAddresses.rows,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalItems: shippingAddresses.count,
                    itemsPerPage: limit
                }
            }
        });

    } catch (error) {
        console.error('Error fetching shipping addresses:', {
            error: error.message,
            stack: error.stack
        });

        return res.status(500).json({
            error: "Error retrieving shipping addresses",
            details: error.message
        });
    }
};

export const getAllShippingAddresses = async (req, res) => {
    try {
        // Implement pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // Get total count for pagination
        const totalCount = await ShippingAddress.count();

        if (totalCount === 0) {
            return res.status(404).json({
                message: "No shipping addresses found"
            });
        }

        // Get addresses with pagination and specific attributes
        const shippingAddresses = await ShippingAddress.findAndCountAll({
            limit,
            offset,
            order: [['created_at', 'DESC']],
            attributes: [
                'id',
                'direccion',
                'ciudad',
                'estado_provincia',
                'codigo_postal',
                'pais',
                'usuario_id',
                'created_at',
                'updated_at'
            ],
            include: [{
                model: User,
                attributes: ['id', 'firstName', 'lastName_father', 'lastName_mother'],
            }]
        });

        // Calculate pagination metadata
        const totalPages = Math.ceil(totalCount / limit);

        return res.status(200).json({
            message: "Shipping addresses retrieved successfully",
            data: {
                addresses: shippingAddresses.rows,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalItems: totalCount,
                    itemsPerPage: limit
                }
            }
        });
    } catch (error) {
        console.error('Error fetching all shipping addresses:', error);
        return res.status(500).json({
            error: "Error retrieving shipping addresses",
            details: error.message
        });
    }
};

export const deleteShippingAddress = async (req, res) => {
    try {
        const { id_ShipingAddress } = req.params;

        // Validate ID
        if (!id_ShipingAddress) {
            return res.status(400).json({
                error: "Shipping address ID is required"
            });
        }

        // Check if address exists before deleting
        const address = await ShippingAddress.findByPk(id_ShipingAddress);

        if (!address) {
            return res.status(404).json({
                error: "Shipping address not found"
            });
        }

        // Delete the address
        await address.destroy();

        return res.status(200).json({
            message: "Shipping address deleted successfully",
            data: {
                id: id_ShipingAddress
            }
        });

    } catch (error) {
        console.error('Error deleting shipping address:', error);
        return res.status(500).json({
            error: "Error deleting shipping address",
            details: error.message
        });
    }
};

export const updateShippingAddress = async (req, res) => {
    try {
        const { id_ShipingAddress } = req.params;

        // Validate ID
        if (!id_ShipingAddress) {
            return res.status(400).json({
                error: "Shipping address ID is required"
            });
        }

        // Check if address exists before updating
        const address = await ShippingAddress.findByPk(id_ShipingAddress);

        if (!address) {
            return res.status(404).json({
                error: "Shipping address not found"
            });
        }

        // Update the address
        const updatedAddress = await address.update(req.body);

        return res.status(200).json({
            message: "Shipping address updated successfully",
            data: updatedAddress
        });

    } catch (error) {
        console.error('Error updating shipping address:', error);
        return res.status(500).json({
            error: "Error updating shipping address",
            details: error.message
        });
    }
} 