// routes/totalRoutes.js
const express = require('express');
const totalController = require('../controllers/totalController');

const router = express.Router();

// Rutas para totales
router.get('/', totalController.getAllTotals); // Obtener todos los totales
router.post('/calculate', totalController.calculateAndSaveTotals); // Calcular y guardar totales
router.delete('/:id', totalController.deleteTotal); // Eliminar un total por ID

module.exports = router;