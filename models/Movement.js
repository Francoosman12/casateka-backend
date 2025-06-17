const mongoose = require('mongoose');

const movementSchema = new mongoose.Schema({
  ingreso: {
    tipo: {
      type: String,
      enum: ["Efectivo", "Tarjeta"],
      required: true,
    },
    subtipo: {
      type: String,
      enum: [
        "Pesos", "Dólares", "Euros",
        "Débito/Crédito", "Virtual", "Transferencias",
      ],
      required: true,
    },
    montoTotal: {
      type: String,
      required: true, // Monto total del ingreso
    },
    autorizaciones: {
      type: [{
        codigo: { type: String, required: function() { return this.tipo === "Tarjeta"; } },
        monto: { type: String, required: function() { return this.tipo === "Tarjeta"; } }
      }],
      required: function () { return this.tipo === "Tarjeta"; } // Solo requerido si es Tarjeta
    }
  },
  fechaPago: { type: Date, required: true },
  nombre: { type: String, required: true },
  habitacion: {
    numero: { type: Number, required: true },
    tipo: {
      type: String,
      enum: ["Junior Suite Tapanko", "Master Suite", "Suite Deluxe Standard"],
      required: true,
    },
  },
  checkIn: { type: Date, required: true },
  checkOut: { type: Date, required: true },
  noches: { type: Number, required: true },
  ota: {
    type: String,
    enum: ["Booking", "Expedia", "Directa"],
    required: true,
  },
  concepto: {
    type: String,
    enum: ["Cobro de estancia", "Amenidades"],
    required: true,
  },
});

movementSchema.pre("save", function (next) {
  if (this.ingreso.subtipo === "Dólares") {
    const monto = parseFloat(this.ingreso.montoTotal); // ✅ Convertir a número
    if (!isNaN(monto)) {
      this.ingreso.montoTotal = (monto * 18).toFixed(2); // ✅ Multiplicar por 18 y formatear
    }
  }
  next();
});

module.exports = mongoose.model("Movement", movementSchema);