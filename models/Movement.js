const mongoose = require('mongoose');

const movementSchema = new mongoose.Schema({
  ingreso: {
    tipo: {
      type: String, // E.g., "Efectivo" o "Tarjeta"
      enum: ["Efectivo", "Tarjeta"], // Opciones permitidas
      required: true,
    },
    subtipo: {
      type: String, // E.g., "Pesos", "Débito/Crédito", etc.
      enum: [
        "Pesos", "Dólares", "Euros", // Subtipos para efectivo
        "Débito/Crédito", "Virtual", "Transferencias", // Subtipos para tarjeta
      ],
      required: true,
    },
    monto: {
      type: String, // Valor asociado al subtipo
      required: true,
    },
  },
  fechaPago: { type: Date, required: true }, // Fecha de pago
  nombre: { type: String, required: true }, // Nombre del cliente
  habitacion: {
    numero: { type: Number, required: true },
    tipo: {
      type: String,
      enum: ["Junior Suite Tapanko", "Master Suite", "Suite Deluxe Standard"], // Tipos disponibles
      required: true,
    },
  },
  checkIn: { type: Date, required: true },
  checkOut: { type: Date, required: true },
  noches: { type: Number, required: true },
  ota: {
    type: String,
    enum: ["Booking", "Expedia", "Directa"], // Origen de la reservación
    required: true,
  },
  autorizacion: { type: String, required: false },
  concepto: {
    type: String,
    enum: ["Cobro de estancia", "Amenidades"],
    required: true,
  },
});

module.exports = mongoose.model("Movement", movementSchema);