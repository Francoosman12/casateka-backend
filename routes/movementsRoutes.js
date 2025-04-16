const express = require('express');
const { createMovement, getMovements, updateMovement, deleteMovement } = require('../controllers/movementsController');
const router = express.Router();

router.post('/', createMovement); 
router.get('/', getMovements); 
router.put('/:id', updateMovement); 
router.delete('/:id', deleteMovement); 

module.exports = router;