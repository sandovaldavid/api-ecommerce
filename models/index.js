import { Sequelize } from "sequelize";
import config from "../config/config.js";

export const sequelize = new Sequelize(
    config.development.database,
    config.development.username,
    config.development.password,
    {
        host: config.development.host,
        port: config.development.port,
        dialect: config.development.dialect,
    }
);