import Roles from "../models/roles.js";
import User from "../models/user.js";

export const createRole = async (req, res) => {
    try {
        const { name } = req.body;
        const role = await Roles.create({ name });
        res.status(201).json(role);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
export const getAllRoles = async (req, res) => {
    try {
        const roles = await Roles.findAll();
        if (!roles){
            return res.status(404).json({ error: "Roles not found" });
        }
        res.status(200).json(roles);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

export const deleteRole = async (req, res) => {
    try {
        const { id } = req.params;
        const role = await Roles.findByPk(id);
        if (!role) {
            return res.status(404).json({ error: "Role not found" });
        }
        await role.destroy();
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const assignRole = async (req, res) => {
    try {
        const { userId, roleId } = req.body;

        // Buscar usuario
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Buscar rol a asignar
        const roleToAssign = await Roles.findByPk(roleId);
        if (!roleToAssign) {
            return res.status(404).json({ error: "Role not found" });
        }

        // Obtener roles actuales del usuario
        const currentRoles = await user.getRoles();

        // Verificar si ya tiene el rol
        const alreadyHasRole = currentRoles.some(role => role.id === roleId);
        if (alreadyHasRole) {
            return res.status(400).json({
                error: "User already has this role"
            });
        }

        // Agregar el nuevo rol manteniendo los anteriores
        await user.addRole(roleToAssign);

        // Obtener roles actualizados para la respuesta
        const updatedRoles = await user.getRoles();

        res.status(200).json({
            message: "Role assigned successfully",
            roles: updatedRoles.map(role => ({
                id: role.id,
                name: role.name
            }))
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const removeRole = async (req, res) => {
    try {
        const { userId, roleId } = req.body;
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        const role = await Roles.findByPk(roleId);
        if (!role) {
            return res.status(404).json({ error: "Role not found" });
        }
        await user.removeRole(role);
        res.status(200).send();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
