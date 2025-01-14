import User from "./user.js";
import Roles from "./roles.js";

// Relation many to many
User.belongsToMany(Roles, { through: "UserRoles" });
Roles.belongsToMany(User, { through: "UserRoles" });

export { User, Roles };