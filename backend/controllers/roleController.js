import { sequelize } from "../models/index.js";
import Roles from "../models/roles.js";
import User from "../models/user.js";

export const createRole = async (req, res) => {
    try {
        const { name } = req.body;

        // Input validation
        if (!name || typeof name !== 'string') {
            return res.status(400).json({
                error: "Valid role name is required",
                details: "Name must be a non-empty string"
            });
        }

        // Clean role name
        const cleanName = name.trim().toLowerCase();

        // Validate role name format
        const nameRegex = /^[a-z0-9_]{3,20}$/;
        if (!nameRegex.test(cleanName)) {
            return res.status(400).json({
                error: "Invalid role name format",
                details: "Name must be 3-20 characters long and contain only lowercase letters, numbers and underscore"
            });
        }

        // Check if role already exists
        const existingRole = await Roles.findOne({
            where: { name: cleanName }
        });

        if (existingRole) {
            return res.status(400).json({
                error: "Role already exists",
                roleName: cleanName
            });
        }

        // Create role with transaction
        const role = await sequelize.transaction(async (t) => {
            return await Roles.create({
                name: cleanName
            }, { transaction: t });
        });

        // Return success response
        return res.status(201).json({
            message: "Role created successfully",
            data: {
                id: role.id,
                name: role.name,
                createdAt: role.created_at
            }
        });

    } catch (error) {
        console.error('Error creating role:', {
            error: error.message,
            stack: error.stack
        });

        return res.status(500).json({
            error: "Error creating role",
            details: error.message
        });
    }
};

export const getAllRoles = async (req, res) => {
    try {
        // Add pagination
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
        const offset = (page - 1) * limit;

        // Get total count
        const totalCount = await Roles.count();

        if (totalCount === 0) {
            return res.status(404).json({
                message: "No roles found"
            });
        }

        // Get roles with pagination and specific attributes
        const roles = await Roles.findAll({
            attributes: ['id', 'name'],
            order: [['name', 'ASC']],
            limit,
            offset
        });

        // Calculate pagination metadata
        const totalPages = Math.ceil(totalCount / limit);

        // Set cache headers for better performance
        res.set('Cache-Control', 'private, max-age=300');

        return res.status(200).json({
            message: "Roles retrieved successfully",
            data: {
                roles,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalItems: totalCount,
                    itemsPerPage: limit
                }
            }
        });

    } catch (error) {
        console.error('Error fetching roles:', {
            error: error.message,
            stack: error.stack
        });

        return res.status(500).json({
            error: "Error retrieving roles",
            details: error.message
        });
    }
};

export const deleteRole = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate ID
        if (!id) {
            return res.status(400).json({
                error: "Role ID is required"
            });
        }

        // First get role information
        const role = await Roles.findByPk(id);

        if (!role) {
            return res.status(404).json({
                error: "Role not found",
                roleId: id
            });
        }

        // Prevent deletion of default roles
        const defaultRoles = ['admin', 'user', 'moderator'];
        if (defaultRoles.includes(role.name)) {
            return res.status(400).json({
                error: "Cannot delete default role",
                roleName: role.name
            });
        }

        // Check if role is in use with separate query
        const userCount = await sequelize.query(
            'SELECT COUNT(DISTINCT userId) as count FROM UserRoles WHERE roleId = :roleId',
            {
                replacements: { roleId: id },
                type: sequelize.QueryTypes.SELECT
            }
        );

        if (userCount[0].count > 0) {
            return res.status(400).json({
                error: "Cannot delete role with active users",
                usersCount: userCount[0].count
            });
        }

        // Delete role with transaction
        await sequelize.transaction(async (t) => {
            await role.destroy({ transaction: t });
        });

        return res.status(200).json({
            message: "Role deleted successfully",
            data: {
                id: role.id,
                name: role.name
            }
        });

    } catch (error) {
        console.error('Error deleting role:', {
            error: error.message,
            stack: error.stack,
            roleId: req.params.id
        });

        return res.status(500).json({
            error: "Error deleting role",
            details: error.message
        });
    }
};

export const assignRole = async (req, res) => {
    try {
        const { userId, roleId } = req.body;

        // Input validation
        if (!userId || !roleId) {
            return res.status(400).json({
                error: "Missing required fields",
                required: ["userId", "roleId"]
            });
        }

        // Get user and role in parallel for better performance
        const [user, roleToAssign] = await Promise.all([
            User.findByPk(userId, {
                include: [{
                    model: Roles,
                    attributes: ['id', 'name']
                }]
            }),
            Roles.findByPk(roleId, {
                attributes: ['id', 'name']
            })
        ]);

        // Validate user exists
        if (!user) {
            return res.status(404).json({
                error: "User not found",
                userId
            });
        }

        // Validate role exists
        if (!roleToAssign) {
            return res.status(404).json({
                error: "Role not found",
                roleId
            });
        }

        // Check if user already has this role
        const alreadyHasRole = user.Roles.some(role => role.id === roleId);
        if (alreadyHasRole) {
            return res.status(400).json({
                error: "User already has this role",
                role: roleToAssign.name
            });
        }

        // Add role with transaction
        await sequelize.transaction(async (t) => {
            await user.addRole(roleToAssign, { transaction: t });
        });

        // Get updated roles for response
        const updatedUser = await User.findByPk(userId, {
            include: [{
                model: Roles,
                attributes: ['id', 'name']
            }],
            attributes: ['id', 'firstName', 'lastName_father']
        });

        return res.status(200).json({
            message: "Role assigned successfully",
            data: {
                user: {
                    id: updatedUser.id,
                    name: `${updatedUser.firstName} ${updatedUser.lastName_father}`
                },
                roles: updatedUser.Roles.map(role => ({
                    id: role.id,
                    name: role.name
                }))
            }
        });

    } catch (error) {
        console.error('Error assigning role:', {
            error: error.message,
            stack: error.stack,
            userId: req.body.userId,
            roleId: req.body.roleId
        });

        return res.status(500).json({
            error: "Error assigning role",
            details: error.message
        });
    }
};

export const removeRole = async (req, res) => {
    try {
        const { userId, roleId } = req.body;

        // Validar que se proporcionen los IDs necesarios
        if (!userId || !roleId) {
            return res.status(400).json({
                error: "userId and roleId are required"
            });
        }

        // Buscar usuario
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Buscar rol
        const role = await Roles.findByPk(roleId);
        if (!role) {
            return res.status(404).json({ error: "Role not found" });
        }

        // Obtener roles actuales del usuario
        const currentRoles = await user.getRoles();

        // Verificar si el usuario tiene el rol
        const hasRole = currentRoles.some(r => r.id === roleId);
        if (!hasRole) {
            return res.status(400).json({
                error: "User doesn't have this role"
            });
        }

        // Verificar que no sea el último rol del usuario
        if (currentRoles.length === 1) {
            return res.status(400).json({
                error: "Cannot remove the last role from user"
            });
        }

        // Remover el rol
        await user.removeRole(role);

        // Obtener roles actualizados para la respuesta
        const updatedRoles = await user.getRoles();

        res.status(200).json({
            message: "Role removed successfully",
            roles: updatedRoles.map(role => ({
                id: role.id,
                name: role.name
            }))
        });
    } catch (error) {
        console.error('Error in removeRole:', error);
        res.status(500).json({
            error: "Error removing role",
            details: error.message
        });
    }
};