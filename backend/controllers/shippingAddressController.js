import { sequelize } from "../models/index.js";
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
                required: ["usuario_id", "address", "city", "estado_provincia", "codigo_postal", "pais"]
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
            address: direccion.trim(),
            city: ciudad.trim(),
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
                'address',
                'city',
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
        // Validate and parse pagination parameters
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
        const offset = (page - 1) * limit;

        // Optional filters
        const { ciudad, estado_provincia, pais } = req.query;
        const whereClause = {};

        if (ciudad) whereClause.city = ciudad.trim();
        if (estado_provincia) whereClause.estado_provincia = estado_provincia.trim();
        if (pais) whereClause.pais = pais.trim();

        // Get total count with filters
        const totalCount = await ShippingAddress.count({
            where: whereClause
        });

        if (totalCount === 0) {
            return res.status(404).json({
                message: "No shipping addresses found",
                filters: { ciudad: city, estado_provincia, pais }
            });
        }

        // Get addresses with pagination and eager loading
        const shippingAddresses = await ShippingAddress.findAll({
            where: whereClause,
            limit,
            offset,
            order: [['created_at', 'DESC']],
            attributes: [
                'id',
                'address',
                'city',
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
                required: true
            }],
            distinct: true
        });

        // Calculate pagination metadata
        const totalPages = Math.ceil(totalCount / limit);

        // Set cache headers
        res.set('Cache-Control', 'private, max-age=300');

        return res.status(200).json({
            message: "Shipping addresses retrieved successfully",
            data: {
                addresses: shippingAddresses,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalItems: totalCount,
                    itemsPerPage: limit
                },
                filters: {
                    ciudad: city,
                    estado_provincia,
                    pais
                }
            }
        });

    } catch (error) {
        console.error('Error fetching all shipping addresses:', {
            error: error.message,
            stack: error.stack
        });

        return res.status(500).json({
            error: "Error retrieving shipping addresses",
            details: error.message
        });
    }
};

export const deleteShippingAddress = async (req, res) => {
    try {
        const { id_ShippingAddress } = req.params;

        // Validate ID
        if (!id_ShippingAddress) {
            return res.status(400).json({
                error: "Shipping address ID is required"
            });
        }

        // Check if address exists and get minimal data
        const address = await ShippingAddress.findByPk(id_ShippingAddress, {
            include: [{
                model: User,
                attributes: ['id', 'firstName'],
                required: true
            }],
            attributes: ['id', 'usuario_id']
        });

        // Handle not found
        if (!address) {
            return res.status(404).json({
                error: "Shipping address not found",
                addressId: id_ShippingAddress
            });
        }

        // Verify ownership (additional security)
        if (address.usuario_id !== req.userId && !req.isAdmin) {
            return res.status(403).json({
                error: "Not authorized to delete this address"
            });
        }

        // Delete with transaction to ensure data consistency
        await sequelize.transaction(async (t) => {
            await address.destroy({ transaction: t });
        });

        // Return success response
        return res.status(200).json({
            message: "Shipping address deleted successfully",
            data: {
                id: id_ShippingAddress,
                userId: address.usuario_id,
                deletedBy: {
                    userId: req.userId,
                    isAdmin: req.isAdmin
                }
            }
        });

    } catch (error) {
        console.error('Error deleting shipping address:', {
            error: error.message,
            stack: error.stack,
            addressId: req.params.id_ShippingAddress
        });

        return res.status(500).json({
            error: "Error deleting shipping address",
            details: error.message
        });
    }
};

export const updateShippingAddress = async (req, res) => {
    try {
        const { id_ShippingAddress } = req.params;
        const {
            direccion,
            ciudad,
            estado_provincia: estadoProvincia,
            codigo_postal: codigoPostal,
            pais
        } = req.body;

        // Validate ID
        if (!id_ShippingAddress) {
            return res.status(400).json({
                error: "Shipping address ID is required"
            });
        }

        // Check if address exists with user info
        const address = await ShippingAddress.findByPk(id_ShippingAddress, {
            include: [{
                model: User,
                attributes: ['id', 'firstName'],
                required: true
            }]
        });

        if (!address) {
            return res.status(404).json({
                error: "Shipping address not found",
                addressId: id_ShippingAddress
            });
        }

        // Verify ownership
        if (address.usuario_id !== req.userId && !req.isAdmin) {
            return res.status(403).json({
                error: "Not authorized to update this address"
            });
        }

        // Validate postal code if provided
        if (codigoPostal) {
            const postalCodeRegex = /^\d{5}(-\d{4})?$/;
            if (!postalCodeRegex.test(codigoPostal.trim())) {
                return res.status(400).json({
                    error: "Invalid postal code format"
                });
            }
        }

        // Prepare update data
        const updates = {
            updated_at: new Date()
        };

        if (direccion) updates.address = direccion.trim();
        if (ciudad) updates.city = ciudad.trim();
        if (estadoProvincia) updates.estado_provincia = estadoProvincia.trim();
        if (codigoPostal) updates.codigo_postal = codigoPostal.trim();
        if (pais) updates.pais = pais.trim();

        // Update with transaction
        const updatedAddress = await sequelize.transaction(async (t) => {
            await address.update(updates, { transaction: t });
            return address.reload({
                include: [{
                    model: User,
                    attributes: ['id', 'firstName', 'lastName_father']
                }],
                transaction: t
            });
        });

        return res.status(200).json({
            message: "Shipping address updated successfully",
            data: updatedAddress
        });

    } catch (error) {
        console.error('Error updating shipping address:', {
            error: error.message,
            stack: error.stack,
            addressId: req.params.id_ShippingAddress
        });

        return res.status(500).json({
            error: "Error updating shipping address",
            details: error.message
        });
    }
};

export const getShippingAddressById = async (req, res) => {
    try {
        const { id_ShippingAddress } = req.params;

        // Validate ID
        if (!id_ShippingAddress) {
            return res.status(400).json({
                error: "Shipping address ID is required"
            });
        }

        // Get address with user info and selected attributes
        const address = await ShippingAddress.findByPk(id_ShippingAddress, {
            attributes: [
                'id',
                'address',
                'city',
                'estado_provincia',
                'codigo_postal',
                'pais',
                'usuario_id',
                'created_at',
                'updated_at'
            ],
            include: [{
                model: User,
                attributes: ['id', 'firstName', 'lastName_father'],
                required: true
            }]
        });

        // Handle not found
        if (!address) {
            return res.status(404).json({
                error: "Shipping address not found",
                addressId: id_ShippingAddress
            });
        }

        // Verify ownership (additional security)
        if (address.usuario_id !== req.userId && !req.isAdmin) {
            return res.status(403).json({
                error: "Not authorized to view this address"
            });
        }

        // Set cache headers for better performance
        res.set('Cache-Control', 'private, max-age=300');

        // Format response
        const formattedAddress = {
            ...address.toJSON(),
            user: {
                id: address.User.id,
                name: `${address.User.firstName} ${address.User.lastName_father}`
            }
        };
        delete formattedAddress.User;

        return res.status(200).json({
            message: "Shipping address retrieved successfully",
            data: formattedAddress
        });

    } catch (error) {
        console.error('Error getting shipping address:', {
            error: error.message,
            stack: error.stack,
            addressId: req.params.id_ShippingAddress
        });

        return res.status(500).json({
            error: "Error retrieving shipping address",
            details: error.message
        });
    }
};

export const validateShippingAddress = async (req, res) => {
    try {
        // Destructure and validate required fields
        const {
            codigo_postal: codigoPostal,
            ciudad,
            pais,
            estado_provincia: estadoProvincia
        } = req.body;

        // Input validation
        if (!codigoPostal || !ciudad || !pais) {
            return res.status(400).json({
                error: "Missing required fields",
                required: ["codigo_postal", "city", "pais"]
            });
        }

        // Clean input data
        const cleanedData = {
            codigoPostal: codigoPostal.trim(),
            city: ciudad.trim(),
            pais: pais.trim(),
            estadoProvincia: estadoProvincia?.trim()
        };

        // Validate postal code format
        const postalCodeRegex = /^\d{5}(-\d{4})?$/;
        if (!postalCodeRegex.test(cleanedData.codigoPostal)) {
            return res.status(400).json({
                error: "Invalid postal code format",
                details: "Postal code must be in format: 12345 or 12345-6789"
            });
        }

        // Validate city name (alphanumeric with spaces)
        const cityRegex = /^[a-zA-Z\s]{2,50}$/;
        if (!cityRegex.test(cleanedData.city)) {
            return res.status(400).json({
                error: "Invalid city format",
                details: "City must contain only letters and spaces, length between 2-50 characters"
            });
        }

        // Set cache headers for better performance
        res.set('Cache-Control', 'private, max-age=300');

        // Return validation result
        return res.status(200).json({
            message: "Address validation completed",
            data: {
                isValid: true,
                validatedAddress: {
                    codigoPostal: cleanedData.codigoPostal,
                    city: cleanedData.city,
                    pais: cleanedData.pais,
                    estadoProvincia: cleanedData.estadoProvincia
                }
            }
        });

    } catch (error) {
        console.error('Error validating address:', {
            error: error.message,
            stack: error.stack,
            requestBody: req.body
        });

        return res.status(500).json({
            error: "Error validating address",
            details: error.message
        });
    }
};

export const setDefaultAddress = async (req, res) => {
    try {
        const { id_ShippingAddress } = req.params;
        const { usuario_id: usuarioId } = req.body;

        // Validate inputs
        if (!id_ShippingAddress || !usuarioId) {
            return res.status(400).json({
                error: "Missing required fields",
                required: ["id_ShippingAddress", "usuario_id"]
            });
        }

        // Verify address exists and belongs to user
        const address = await ShippingAddress.findOne({
            where: {
                id: id_ShippingAddress,
                usuario_id: usuarioId
            },
            attributes: ['id', 'usuario_id']
        });

        if (!address) {
            return res.status(404).json({
                error: "Shipping address not found or not authorized",
                addressId: id_ShippingAddress
            });
        }

        // Verify ownership
        if (address.usuario_id !== req.userId && !req.isAdmin) {
            return res.status(403).json({
                error: "Not authorized to modify this address"
            });
        }

        // Update addresses with transaction
        await sequelize.transaction(async (t) => {
            // Remove default from all user addresses
            await ShippingAddress.update(
                {
                    is_default: false,
                    updated_at: new Date()
                },
                {
                    where: { usuario_id: usuarioId },
                    transaction: t
                }
            );

            // Set new default address
            await address.update(
                {
                    is_default: true,
                    updated_at: new Date()
                },
                { transaction: t }
            );
        });

        // Get updated address with user info
        const updatedAddress = await ShippingAddress.findByPk(id_ShippingAddress, {
            include: [{
                model: User,
                attributes: ['id', 'firstName', 'lastName_father']
            }],
            attributes: [
                'id',
                'address',
                'city',
                'estado_provincia',
                'codigo_postal',
                'pais',
                'is_default',
                'updated_at'
            ]
        });

        return res.status(200).json({
            message: "Default address updated successfully",
            data: updatedAddress
        });

    } catch (error) {
        console.error('Error setting default address:', {
            error: error.message,
            stack: error.stack,
            addressId: req.params.id_ShippingAddress,
            userId: req.body.usuario_id
        });

        return res.status(500).json({
            error: "Error setting default address",
            details: error.message
        });
    }
};

export const bulkDeleteAddresses = async (req, res) => {
    try {
        const { addressIds } = req.body;

        // Validate input
        if (!addressIds || !Array.isArray(addressIds) || addressIds.length === 0) {
            return res.status(400).json({
                error: "Valid address IDs array is required",
                details: "Must provide an array of address IDs"
            });
        }

        // Validate maximum number of addresses to delete at once
        if (addressIds.length > 10) {
            return res.status(400).json({
                error: "Too many addresses",
                details: "Can only delete up to 10 addresses at once"
            });
        }

        // Verify addresses exist and belong to user
        const addresses = await ShippingAddress.findAll({
            where: {
                id: addressIds,
                usuario_id: req.userId
            },
            attributes: ['id', 'usuario_id']
        });

        // Check if all addresses were found
        if (addresses.length !== addressIds.length) {
            const foundIds = addresses.map(addr => addr.id);
            const notFound = addressIds.filter(id => !foundIds.includes(id));

            return res.status(404).json({
                error: "Some addresses not found or not authorized",
                details: {
                    requestedIds: addressIds,
                    notFoundIds: notFound
                }
            });
        }

        // Delete addresses with transaction
        const deletedCount = await sequelize.transaction(async (t) => {
            const result = await ShippingAddress.destroy({
                where: {
                    id: addressIds,
                    usuario_id: req.userId
                },
                transaction: t
            });

            return result;
        });

        // Return success response
        return res.status(200).json({
            message: "Addresses deleted successfully",
            data: {
                deletedCount,
                deletedIds: addressIds,
                deletedBy: {
                    userId: req.userId,
                    isAdmin: req.isAdmin
                }
            }
        });

    } catch (error) {
        console.error('Error bulk deleting addresses:', {
            error: error.message,
            stack: error.stack,
            addressIds: req.body.addressIds,
            userId: req.userId
        });

        return res.status(500).json({
            error: "Error deleting addresses",
            details: error.message
        });
    }
};