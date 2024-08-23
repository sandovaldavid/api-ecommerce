import dotenv from "dotenv";

dotenv.config();  // Cargar las variables de entorno desde el archivo .env

const config = {
  development: {
    username: process.env.DB_USER,         // Usuario de la base de datos
    password: process.env.DB_PASS,         // Contraseña de la base de datos
    database: process.env.DB_NAME,         // Nombre de la base de datos
    host: process.env.DB_HOST,             // Host de la base de datos
    port: process.env.DB_PORT || 3306,     // Puerto de la base de datos (3306 es el predeterminado para MySQL)
    dialect: "mysql",                      // Dialecto de la base de datos (MySQL en este caso)
    secret: process.env.JWT_SECRET,        // Secreto para firmar los tokens JWT
  },
  test: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_TEST_NAME,    // Puedes usar una base de datos separada para pruebas
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: "mysql",
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: "mysql",
  },
};

export default config;