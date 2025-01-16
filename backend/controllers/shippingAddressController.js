import { sequelize } from "../models/index.js";
import ShippingAddress from "../models/shippingAddress.js";
import User from "../models/user.js";
import { Errors } from "../middlewares/errorHandler.js";
import { AuthorizationService } from "../services/authorizationService.js";

export const createShippingAddress = async (req, res, next) => {
    try {
        // Destructure and validate required fields
        const {
            userId: requestedUserId,
            address,
            city,
            stateProvince,
            zipCode,
            country
        } = req.body;

        // Input validation
        if (!address || !city || !stateProvince || !zipCode || !country) {
            throw new Errors.ValidationError("Missing required fields", {
                required: ["address", "city", "stateProvince", "zipCode", "country"]
            });
        }

        // Determine the effective userId based on role
        const effectiveUserId = req.isAdmin ? requestedUserId : req.userId;

        // If admin is creating for another user, verify that user exists
        if (req.isAdmin && requestedUserId !== req.userId) {
            const targetUser = await User.findByPk(requestedUserId);
            if (!targetUser) {
                throw new Errors.NotFoundError("Target user not found", {
                    userId: requestedUserId
                });
            }
        }

        // Check maximum addresses per user
        const userAddressCount = await ShippingAddress.count({
            where: { userId: effectiveUserId }
        });

        if (userAddressCount >= 5) {
            throw new Errors.ValidationError("Maximum addresses reached", {
                maxAddresses: 5,
                currentCount: userAddressCount
            });
        }

        // Create shipping address with cleaned data
        const shippingAddress = await ShippingAddress.create({
            userId: effectiveUserId,
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
                attributes: ["id", "firstName", "lastNameFather"]
            }]
        });

        return res.status(201).json({
            message: "Shipping address created successfully",
            data: {
                address: addressWithUser,
                createdBy: {
                    userId: req.userId,
                    isAdmin: req.isAdmin
                }
            }
        });

    } catch (error) {
        console.error("Error creating shipping address:", {
            error: error.message,
            stack: error.stack,
            requestedUserId: req.body.userId,
            actualUserId: req.userId
        });

        next(error);
    }
};

export const getShippingAddressesByUserId = async (req, res, next) => {
    try {
        const { userId } = req.params;

        // Validate user ID
        if (!userId) {
            throw new Errors.ValidationError("User ID is required");
        }

        // Check authorization
        const authResult = await AuthorizationService.verifyResourceOwnership(
            req.userId,
            "Shipping Addresses",
            {
                userIdResource: userId,
                model: ShippingAddress,
                attributes: ["id", "userId"],
                includeUser: true
            }
        );

        if (!authResult.isAuthorized) {
            throw new Errors.AuthorizationError(authResult.error, {
                userId,
                requestedBy: req.userId
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
            order: [["created_at", "DESC"]],
            attributes: [
                "id",
                "address",
                "city",
                "stateProvince",
                "zipCode",
                "country",
                "created_at",
                "updated_at"
            ],
            distinct: true
        });

        // Handle no addresses found
        if (shippingAddresses.count === 0) {
            throw new Errors.NotFoundError("No addresses found for user", {
                userId
            });
        }

        // Calculate pagination metadata
        const totalPages = Math.ceil(shippingAddresses.count / limit);

        // Set cache headers for better performance
        res.set("Cache-Control", "private, max-age=300");

        return res.status(200).json({
            message: "Shipping addresses retrieved successfully",
            data: {
                userInfo: {
                    id: userId,
                    firstName: authResult.resource.User.firstName,
                    lastName: authResult.resource.User.lastNameFather
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
        console.error("Error fetching shipping addresses:", {
            error: error.message,
            stack: error.stack,
            userId: req.params.userId
        });

        next(error);
    }
};

export const getAllShippingAddresses = async (req, res, next) => {
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
            throw new Errors.NotFoundError("No addresses found with provided filters", {
                filters: {
                    city,
                    stateProvince,
                    country
                }
            });
        }

        // Get addresses with pagination and eager loading
        const shippingAddresses = await ShippingAddress.findAll({
            where: whereClause,
            limit,
            offset,
            order: [["created_at", "DESC"]],
            attributes: [
                "id",
                "address",
                "city",
                "stateProvince",
                "zipCode",
                "country",
                "userId",
                "created_at",
                "updated_at"
            ],
            include: [{
                model: User,
                attributes: ["id", "firstName", "lastNameFather", "lastNameMother"],
                required: true
            }],
            distinct: true
        });

        // Calculate pagination metadata
        const totalPages = Math.ceil(totalCount / limit);

        // Set cache headers
        res.set("Cache-Control", "private, max-age=300");

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
        console.error("Error fetching all shipping addresses:", {
            error: error.message,
            stack: error.stack
        });

        next(error);
    }
};

export const deleteShippingAddress = async (req, res, next) => {
    try {
        const { IdShippingAddress } = req.params;

        // Validate ID
        if (!IdShippingAddress) {
            throw new Errors.ValidationError("Shipping address ID is required");
        }

        // Check authorization using AuthorizationService
        const authResult = await AuthorizationService.verifyResourceOwnership(
            req.userId,
            "shipping_address",
            {
                resourceId: IdShippingAddress,
                model: ShippingAddress,
                attributes: ["id", "userId", "is_default"],
                includeUser: true
            }
        );

        if (!authResult.isAuthorized) {
            throw new Errors.AuthorizationError(authResult.error, {
                addressId: IdShippingAddress,
                userId: req.userId
            });
        }

        // Check if address is default
        if (authResult.resource.is_default) {
            throw new Errors.ValidationError("Cannot delete default address", {
                addressId: IdShippingAddress
            });
        }

        // Delete address with transaction
        await sequelize.transaction(async (t) => {
            await authResult.resource.destroy({ transaction: t });

            // Log deletion for audit
            await sequelize.models.AuditLog?.create({
                action: 'DELETE_ADDRESS',
                userId: req.userId,
                resourceId: IdShippingAddress,
                resourceType: 'shipping_address',
                details: JSON.stringify({
                    deletedBy: {
                        userId: req.userId,
                        isAdmin: authResult.isAdmin
                    }
                })
            }, { transaction: t });
        });

        // Set cache control headers
        res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.set('Pragma', 'no-cache');

        return res.status(200).json({
            message: "Shipping address deleted successfully",
            data: {
                id: IdShippingAddress,
                user: {
                    id: authResult.resource.User.id,
                    name: `${authResult.resource.User.firstName} ${authResult.resource.User.lastNameFather}`
                },
                deletedBy: {
                    userId: req.userId,
                    isAdmin: authResult.isAdmin,
                    timestamp: new Date()
                }
            }
        });

    } catch (error) {
        console.error("Error deleting shipping address:", {
            error: error.message,
            stack: error.stack,
            addressId: req.params.IdShippingAddress,
            userId: req.userId
        });

        // Pass error to error handler middleware
        next(error);
    }
};
s
export const updateShippingAddress = async (req, res, next) => {
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
            throw new Errors.ValidationError("Shipping address ID is required");
        }

        // Check authorization using AuthorizationService
        const authResult = await AuthorizationService.verifyResourceOwnership(
            req.userId,
            "shipping_address",
            {
                resourceId: IdShippingAddress,
                model: ShippingAddress,
                attributes: ["id", "userId"],
                includeUser: true
            }
        );

        if (!authResult.isAuthorized) {
            throw new Errors.AuthorizationError(authResult.error, {
                addressId: IdShippingAddress,
                userId: req.userId
            });
        }

        // Validate updates
        if (!address && !city && !stateProvince && !zipCode && !country) {
            throw new Errors.ValidationError("At least one field to update is required", {
                updateableFields: ["address", "city", "stateProvince", "zipCode", "country"]
            });
        }

        // Validate postal code if provided
        if (zipCode) {
            const postalCodeRegex = /^\d{5}(-\d{4})?$/;
            if (!postalCodeRegex.test(zipCode.trim())) {
                throw new Errors.ValidationError("Invalid postal code format", {
                    details: "Postal code must be in format: 12345 or 12345-6789"
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
            await authResult.resource.update(updates, { transaction: t });

            // Get updated address with user info
            return ShippingAddress.findByPk(IdShippingAddress, {
                include: [{
                    model: User,
                    attributes: ["id", "firstName", "lastNameFather"],
                    required: true
                }],
                transaction: t
            });
        });

        // Set cache control headers
        res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.set('Pragma', 'no-cache');

        return res.status(200).json({
            message: "Shipping address updated successfully",
            data: {
                address: updatedAddress,
                updatedBy: {
                    userId: req.userId,
                    isAdmin: authResult.isAdmin,
                    timestamp: new Date()
                }
            }
        });

    } catch (error) {
        console.error("Error updating shipping address:", {
            error: error.message,
            stack: error.stack,
            addressId: req.params.IdShippingAddress,
            userId: req.userId
        });

        next(error);
    }
};

export const getShippingAddressById = async (req, res, next) => {
    try {
        const { IdShippingAddress } = req.params;

        // Validate ID
        if (!IdShippingAddress) {
            throw new Errors.ValidationError("Shipping address ID is required");
        }

        // Get address with user info and selected attributes
        const address = await ShippingAddress.findByPk(IdShippingAddress, {
            attributes: [
                "id",
                "address",
                "city",
                "stateProvince",
                "zipCode",
                "country",
                "userId",
                "created_at",
                "updated_at"
            ],
            include: [{
                model: User,
                attributes: ["id", "firstName", "lastNameFather"],
                required: true
            }]
        });

        // Handle not found
        if (!address) {
            throw new Errors.NotFoundError("Shipping address not found", {
                addressId: IdShippingAddress
            });
        }

        // Verify ownership (additional security)
        if (address.userId !== req.userId && !req.isAdmin) {
            throw new Errors.AuthorizationError("Not authorized to view this address");
        }

        // Set cache headers for better performance
        res.set("Cache-Control", "private, max-age=300");

        // Format response
        const formattedAddress = {
            ...address.toJSON(),
            user: {
                id: address.User.id,
                name: `${address.User.firstName} ${address.User.lastNameFather}`
            }
        };
        delete formattedAddress.User;

        return res.status(200).json({
            message: "Shipping address retrieved successfully",
            data: formattedAddress
        });

    } catch (error) {
        console.error("Error getting shipping address:", {
            error: error.message,
            stack: error.stack,
            addressId: req.params.id_ShippingAddress
        });

        next(error);
    }
};

export const validateShippingAddress = async (req, res, next) => {
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
            throw new Errors.ValidationError("Missing required fields", {
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
            throw new Errors.ValidationError("Invalid postal code format", {
                details: "Postal code must be in format: 12345 or 12345-6789"
            });
        }

        // Validate city name (alphanumeric with spaces)
        const cityRegex = /^[a-zA-Z\s]{2,50}$/;
        if (!cityRegex.test(cleanedData.city)) {
            throw new Errors.ValidationError("Invalid city name format", {
                details: "City name must be 2-50 characters long"
            });
        }

        // Set cache headers for better performance
        res.set("Cache-Control", "private, max-age=300");

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
        console.error("Error validating address:", {
            error: error.message,
            stack: error.stack,
            requestBody: req.body
        });

        next(error);
    }
};

export const setDefaultAddress = async (req, res, next) => {
    try {
        const { IdShippingAddress } = req.params;
        const { userId } = req.body;

        // Validate inputs
        if (!IdShippingAddress || !userId) {
            throw new Errors.ValidationError("Address ID and user ID are required");
        }

        // Verify address exists and belongs to user
        const address = await ShippingAddress.findOne({
            where: {
                id: IdShippingAddress,
                userId
            },
            attributes: ["id", "userId"]
        });

        if (!address) {
            throw new Errors.NotFoundError("Address not found or not authorized", {
                addressId: IdShippingAddress,
                userId
            });
        }

        // Verify ownership
        if (address.userId !== req.userId && !req.isAdmin) {
            throw new Errors.AuthorizationError("Not authorized to set default address");
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
                    where: { userId },
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
                attributes: ["id", "firstName", "lastNameFather"]
            }],
            attributes: [
                "id",
                "address",
                "city",
                "stateProvince",
                "zipCode",
                "country",
                "is_default",
                "updated_at"
            ]
        });

        return res.status(200).json({
            message: "Default address updated successfully",
            data: updatedAddress
        });

    } catch (error) {
        console.error("Error setting default address:", {
            error: error.message,
            stack: error.stack,
            addressId: req.params.id_ShippingAddress,
            userId: req.body.userId
        });

        next(error);
    }
};

export const bulkDeleteAddresses = async (req, res, next) => {
    try {
        const { addressIds } = req.body;
        console.log("addressIds", addressIds);
        const MAX_ADDRESSES = 10;

        // Input validation
        if (!addressIds || !Array.isArray(addressIds) || addressIds.length === 0) {
            throw new Errors.ValidationError("Address IDs array is required");
        }

        // Validate maximum number of addresses
        if (addressIds.length > MAX_ADDRESSES) {
            throw new Errors.ValidationError("Maximum addresses for bulk delete exceeded", {
                maxAddresses: MAX_ADDRESSES
            });
        }

        // Verify addresses exist and belong to user with single query
        const addresses = await ShippingAddress.findAll({
            where: {
                id: addressIds,
                userId: req.userId
            },
            include: [{
                model: User,
                attributes: ["id", "firstName"],
                required: true
            }],
            attributes: ["id", "userId", "is_default"]
        });

        // Check if default addresses are being deleted
        const defaultAddresses = addresses.filter(addr => addr.is_default);
        if (defaultAddresses.length > 0) {
            throw new Errors.ValidationError("Cannot delete default addresses", {
                defaultAddresses: defaultAddresses.map(addr => addr.id)
            });
        }

        // Check if all addresses were found
        if (addresses.length !== addressIds.length) {
            const foundIds = addresses.map(addr => addr.id);
            const notFound = addressIds.filter(id => !foundIds.includes(id));

            throw new Errors.NotFoundError("Some addresses not found or not authorized", {
                notFound
            });
        }

        // Delete addresses with transaction
        const deletedCount = await sequelize.transaction(async (t) => {
            const result = await ShippingAddress.destroy({
                where: {
                    id: addressIds,
                    userId: req.userId,
                    is_default: false
                },
                transaction: t
            });

            return result;
        });

        // Set cache control headers
        res.set("Cache-Control", "no-cache, no-store, must-revalidate");

        return res.status(200).json({
            message: "Addresses deleted successfully",
            data: {
                deletedCount,
                deletedIds: addressIds,
                deletedBy: {
                    userId: req.userId,
                    isAdmin: req.isAdmin,
                    timestamp: new Date()
                }
            }
        });

    } catch (error) {
        console.error("Error bulk deleting addresses:", {
            error: error.message,
            stack: error.stack,
            addressIds: req.body.addressIds,
            userId: req.userId
        });

        next(error);
    }
};