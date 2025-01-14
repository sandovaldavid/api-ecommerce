import { sequelize } from "../models/index.js";
import ShippingAddress from "../models/shippingAddress.js";
import User from "../models/user.js";

export const createShippingAddress = async (req, res) => {
    try {
        // Destructure and validate required fields
        const {
            userId,
            address,
            city,
            stateProvince,
            zipCode,
            country
        } = req.body;

        // Input validation
        if (!userId || !address || !city || !stateProvince || !zipCode || !country) {
            return res.status(400).json({
                error: "All fields are required",
                required: ["userId", "address", "city", "stateProvince", "zipCode", "country"]
            });
        }

        // Check if user exists
        const userExists = await User.findByPk(userId);
        if (!userExists) {
            return res.status(404).json({
                error: "User not found"
            });
        }

        // Check maximum addresses per user
        const userAddressCount = await ShippingAddress.count({
            where: { userId }
        });

        if (userAddressCount >= 5) {
            return res.status(400).json({
                error: "Maximum number of addresses reached (5)",
                currentCount: userAddressCount
            });
        }

        // Validate postal code format (example)
        const postalCodeRegex = /^\d{5}(-\d{4})?$/;
        if (!postalCodeRegex.test(zipCode.trim())) {
            return res.status(400).json({
                error: "Invalid postal code format"
            });
        }

        // Create shipping address with cleaned data
        const shippingAddress = await ShippingAddress.create({
            userId: userId,
            address: address.trim(),
            city: city.trim(),
            stateProvince: stateProvince.trim(),
            zipCode: zipCode.trim(),
            country: country.trim(),
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
        const { userId } = req.params;

        // Validate user ID
        if (!userId) {
            return res.status(400).json({
                error: "User ID is required"
            });
        }

        // Check if user exists
        const user = await User.findByPk(userId, {
            attributes: ['id', 'firstName', 'lastName_father']
        });

        if (!user) {
            return res.status(404).json({
                error: "User not found",
                userId: userId
            });
        }

        // Get addresses with pagination
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
        const offset = (page - 1) * limit;

        // Get addresses count and data in a single query
        const shippingAddresses = await ShippingAddress.findAndCountAll({
            where: { userId },
            limit,
            offset,
            order: [['created_at', 'DESC']],
            attributes: [
                'id',
                'address',
                'city',
                'stateProvince',
                'zipCode',
                'country',
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
                userId: userId,
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
        const { city, stateProvince, country } = req.query;
        const whereClause = {};

        if (city) whereClause.city = city.trim();
        if (stateProvince) whereClause.stateProvince = stateProvince.trim();
        if (country) whereClause.country = country.trim();

        // Get total count with filters
        const totalCount = await ShippingAddress.count({
            where: whereClause
        });

        if (totalCount === 0) {
            return res.status(404).json({
                message: "No shipping addresses found",
                filters: { city, stateProvince, country }
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
                'stateProvince',
                'zipCode',
                'country',
                'userId',
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
                    city,
                    stateProvince,
                    country
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
        const { IdShippingAddress } = req.params;

        // Validate ID
        if (!IdShippingAddress) {
            return res.status(400).json({
                error: "Shipping address ID is required"
            });
        }

        // Check if address exists and get minimal data
        const address = await ShippingAddress.findByPk(IdShippingAddress, {
            include: [{
                model: User,
                attributes: ['id', 'firstName'],
                required: true
            }],
            attributes: ['id', 'userId']
        });

        // Handle not found
        if (!address) {
            return res.status(404).json({
                error: "Shipping address not found",
                addressId: IdShippingAddress
            });
        }

        // Verify ownership (additional security)
        if (address.userId !== req.userId && !req.isAdmin) {
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
                id: IdShippingAddress,
                userId: address.userId,
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
        const { IdShippingAddress } = req.params;
        const {
            address,
            city,
            stateProvince,
            zipCode,
            country
        } = req.body;

        // Validate ID
        if (!IdShippingAddress) {
            return res.status(400).json({
                error: "Shipping address ID is required"
            });
        }

        // Check if address exists with user info
        const verifyAddress = await ShippingAddress.findByPk(IdShippingAddress, {
            include: [{
                model: User,
                attributes: ['id', 'firstName'],
                required: true
            }]
        });

        if (!verifyAddress) {
            return res.status(404).json({
                error: "Shipping address not found",
                addressId: IdShippingAddress
            });
        }

        // Verify ownership
        if (verifyAddress.userId !== req.userId && !req.isAdmin) {
            return res.status(403).json({
                error: "Not authorized to update this address"
            });
        }

        // Validate postal code if provided
        if (zipCode) {
            const postalCodeRegex = /^\d{5}(-\d{4})?$/;
            if (!postalCodeRegex.test(zipCode.trim())) {
                return res.status(400).json({
                    error: "Invalid postal code format"
                });
            }
        }

        // Prepare update data
        const updates = {
            updated_at: new Date()
        };

        if (address) updates.address = address.trim();
        if (city) updates.city = city.trim();
        if (stateProvince) updates.stateProvince = stateProvince.trim();
        if (zipCode) updates.zipCode = zipCode.trim();
        if (country) updates.country = country.trim();

        // Update with transaction
        const updatedAddress = await sequelize.transaction(async (t) => {
            await verifyAddress.update(updates, { transaction: t });
            return verifyAddress.reload({
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
        const { IdShippingAddress } = req.params;

        // Validate ID
        if (!IdShippingAddress) {
            return res.status(400).json({
                error: "Shipping address ID is required"
            });
        }

        // Get address with user info and selected attributes
        const address = await ShippingAddress.findByPk(IdShippingAddress, {
            attributes: [
                'id',
                'address',
                'city',
                'stateProvince',
                'zipCode',
                'country',
                'userId',
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
                addressId: IdShippingAddress
            });
        }

        // Verify ownership (additional security)
        if (address.userId !== req.userId && !req.isAdmin) {
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
            zipCode,
            city,
            country,
            stateProvince
        } = req.body;

        // Input validation
        if (!zipCode || !city || !country) {
            return res.status(400).json({
                error: "Missing required fields",
                required: ["zipCode", "city", "country"]
            });
        }

        // Clean input data
        const cleanedData = {
            zipCode: zipCode.trim(),
            city: city.trim(),
            country: country.trim(),
            stateProvince: stateProvince?.trim()
        };

        // Validate postal code format
        const postalCodeRegex = /^\d{5}(-\d{4})?$/;
        if (!postalCodeRegex.test(cleanedData.zipCode)) {
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
                    zipCode: cleanedData.zipCode,
                    city: cleanedData.city,
                    country: cleanedData.country,
                    stateProvince: cleanedData.stateProvince
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
        const { IdShippingAddress } = req.params;
        const { userId } = req.body;

        // Validate inputs
        if (!IdShippingAddress || !userId) {
            return res.status(400).json({
                error: "Missing required fields",
                required: ["IdShippingAddress", "userId"]
            });
        }

        // Verify address exists and belongs to user
        const address = await ShippingAddress.findOne({
            where: {
                id: IdShippingAddress,
                userId: userId
            },
            attributes: ['id', 'userId']
        });

        if (!address) {
            return res.status(404).json({
                error: "Shipping address not found or not authorized",
                addressId: IdShippingAddress
            });
        }

        // Verify ownership
        if (address.userId !== req.userId && !req.isAdmin) {
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
                    where: { userId: userId },
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
        const updatedAddress = await ShippingAddress.findByPk(IdShippingAddress, {
            include: [{
                model: User,
                attributes: ['id', 'firstName', 'lastName_father']
            }],
            attributes: [
                'id',
                'address',
                'city',
                'stateProvince',
                'zipCode',
                'country',
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
            userId: req.body.userId
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
                userId: req.userId
            },
            attributes: ['id', 'userId']
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
                    userId: req.userId
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