import { Sequelize } from "sequelize";
import config from "../config/config.js";

const env = process.env.NODE_ENV || "development";

const sequelize = process.env.NODE_ENV === "production"
    ? new Sequelize(config.production.url, {
        ...config.production,
        dialect: config[env].dialect,
        logging: false,
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        }
    })
    : new Sequelize(
        config[env].database,
        config[env].username,
        config[env].password,
        {
            host: config[env].host,
            port: config[env].port,
            dialect: config[env].dialect,
            logging: console.log,
            ...config[env]
        }
    );

try {
    await sequelize.authenticate();
    console.log("Connection to database has been established successfully.");
} catch (error) {
    console.error("Unable to connect to the database:", error);
}

export { sequelize };