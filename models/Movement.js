const mongoose = require('mongoose');

const movementSchema = new mongoose.Schema({
    ingresos: {
        efectivo: {
            pesos: Number,
            dolares: Number,
            euros: Number,
        },
        tarjeta: {
            debitoCredito: Number,
            virtual: Number,
            transferencias: Number,
        },
    },
    fechaPago: { type: Date, required: true }, // Fecha de pago
    nombre: { type: String, required: true }, // Nombre del cliente
    habitacion: {
        numero: { type: Number, required: true }, // Número de habitación
        tipo: {
            type: String,
            enum: ['Junior Suite Tapanko', 'Master Suite', 'Suite Deluxe Standard'], // Tipos disponibles
            required: true,
        },
    },
    checkIn: { type: Date, required: true }, // Fecha de entrada
    checkOut: { type: Date, required: true }, // Fecha de salida
    noches: { type: Number, required: true }, // Noches calculadas
    ota: {
        type: String,
        enum: ['Booking', 'Expedia', 'Directa'], // Origen de la reservación
        required: true,
    },
    autorizacion: { type: String, required: false }, // Número de autorización
    concepto: {
        type: String,
        enum: ['Cobro de estancia', 'Amenidades'], // Opciones para el concepto
        required: true,
    },
});

module.exports = mongoose.model('Movement', movementSchema);