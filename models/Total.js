const mongoose = require('mongoose');

const totalSchema = new mongoose.Schema({
  tipoIngreso: { type: String, required: true }, // Ejemplo: 'Efectivo MXN', 'Banco', etc.
  categoriaOTA: { type: String, required: false }, // Ejemplo: 'Booking', 'Expedia', 'Directa'
  concepto: { type: String, required: false }, // Ejemplo: 'Amenidades', 'Estancia'
  subtotal: { type: Number, required: true, default: 0 }, // Subtotal acumulativo
  fechaCalculo: { type: Date, required: true, default: Date.now }, // Última fecha de cálculo
});

module.exports = mongoose.model('Total', totalSchema);