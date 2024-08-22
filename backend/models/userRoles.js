import User from "./user.js";
import Roles from "./roles.js";

// Relación muchos a muchos entre User y Roles
User.belongsToMany(Roles, {through: 'UserRoles'});
Roles.belongsToMany(User, {through: 'UserRoles'});

export {User, Roles};