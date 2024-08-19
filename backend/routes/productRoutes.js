const express = require('express');
const router = express.Router();
const { getAllProducts, createProduct } = require('../controllers/productController');

// Definir las rutas para productos
router.get('/', async (req, res, next) => {
  try {
    await getAllProducts(req, res);
  } catch (error) {
    next(error);  // Pasar el error al manejador de errores de Express
  }
});

router.post('/', async (req, res, next) => {
  try {
    await createProduct(req, res);
  } catch (error) {
    next(error);  // Pasar el error al manejador de errores de Express
  }
});

module.exports = router;

