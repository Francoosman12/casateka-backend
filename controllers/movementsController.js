const Movement = require('../models/Movement'); // Modelo de movimientos
const Total = require('../models/Total'); // Modelo de totales

const createMovement = async (req, res) => {
  try {
    const { checkIn, checkOut, ingreso, fechaPago, nombre, habitacion, ota, concepto } = req.body;

    if (new Date(checkOut) <= new Date(checkIn)) {
      return res.status(400).json({ message: "La fecha de check-out debe ser posterior a la de check-in." });
    }

    if (!ingreso || !ingreso.tipo || !ingreso.subtipo || !ingreso.montoTotal) {
      return res.status(400).json({ message: "Todos los campos del ingreso son obligatorios." });
    }

    const noches = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));

    if (ingreso.tipo === "Tarjeta") {
      ingreso.montoTotal = ingreso.autorizaciones.reduce((total, autorizacion) => {
        return total + parseFloat(autorizacion.monto.replace(/\./g, "").replace(",", "."));
      }, 0);
    } else {
      // ✅ **Tomar `montoTotal` tal cual viene del frontend, sin modificarlo**
      ingreso.montoTotal = req.body.ingreso.montoTotal;
    }

    

    const newMovement = new Movement({
      ingreso,
      fechaPago,
      nombre,
      habitacion,
      checkIn,
      checkOut,
      noches,
      ota,
      concepto
    });

    await newMovement.save();

    res.status(201).json(newMovement);
  } catch (error) {
    console.error("Error al crear el movimiento:", error.message);
    res.status(500).json({ message: "Hubo un error al crear el movimiento", error: error.message });
  }
};

// Obtener todos los movimientos
const getMovements = async (req, res) => {
  try {
    const movements = await Movement.find().sort({ fechaPago: -1 }); // Ordenar por fecha de pago
    res.status(200).json(movements);
  } catch (error) {
    console.error("Error al obtener movimientos:", error.message);
    res.status(500).json({ message: "Error al obtener movimientos", error: error.message });
  }
};

const updateMovement = async (req, res) => {
  try {
    const { id } = req.params;
    let { checkIn, checkOut, ingreso, ota, concepto, nombre } = req.body;

    console.log("Datos recibidos para actualizar:", req.body);

    if (!ingreso || !ingreso.tipo || !ingreso.subtipo) {
      return res.status(400).json({
        message: "Todos los campos del ingreso son obligatorios.",
      });
    }

    // ✅ Obtener el movimiento existente para mantener su formato de monto
    const existingMovement = await Movement.findById(id);
    if (!existingMovement) {
      return res.status(404).json({ message: "El movimiento no existe." });
    }

    // ✅ Si el ingreso es Tarjeta, recalcular `montoTotal`
    if (ingreso.tipo === "Tarjeta") {
      ingreso.montoTotal = ingreso.autorizaciones.reduce((total, autorizacion) => {
        return total + parseFloat(autorizacion.monto.replace(/\./g, "").replace(",", "."));
      }, 0);
    } else {
      // ✅ **Mantener el formato original al actualizar**
      ingreso.montoTotal = parseFloat(ingreso.montoTotal.toString().replace(/[^\d.-]/g, ""));
    }

    // ✅ Si el subtipo es "Dólares", mantener el monto original
    if (ingreso.subtipo === "Dólares") {
      ingreso.montoTotal = existingMovement.ingreso.montoTotal; // ✅ Mantener monto sin modificación
    }

    console.log("MontoTotal corregido antes de actualizar:", ingreso.montoTotal);

    if (isNaN(parseFloat(ingreso.montoTotal))) {
      console.error("🚨 Error: `montoTotal` no es válido después de la conversión:", ingreso.montoTotal);
      return res.status(400).json({
        message: "Error en la conversión de montoTotal. Verifica el formato de entrada.",
      });
    }

    const updatedMovement = await Movement.findByIdAndUpdate(
      id,
      { 
        $set: {
          checkIn,
          checkOut,
          ota,
          concepto,
          nombre, 
          "ingreso.tipo": ingreso.tipo,
          "ingreso.subtipo": ingreso.subtipo,
          "ingreso.montoTotal": ingreso.montoTotal,
          "ingreso.autorizaciones": ingreso.autorizaciones || [],
        }
      },
      { new: true, runValidators: true }
    );

    console.log("Movimiento actualizado correctamente:", updatedMovement);

    res.status(200).json(updatedMovement);
  } catch (error) {
    console.error("🚨 Error crítico al actualizar el movimiento:", error.message);
    res.status(500).json({
      message: "Hubo un error al actualizar el movimiento",
      error: error.message,
    });
  }
};

const deleteMovement = async (req, res) => {
  try {
    const { id } = req.params;

    const movementToDelete = await Movement.findById(id);

    if (!movementToDelete) {
      return res.status(404).json({ message: "Movimiento no encontrado." });
    }

    // Restar el monto del ingreso de los totales
    try {
      await Total.findOneAndUpdate(
        { tipoIngreso: `${movementToDelete.ingreso.tipo} - ${movementToDelete.ingreso.subtipo}` },
        { $inc: { subtotal: -movementToDelete.ingreso.monto } },
        { new: true }
      );
    } catch (error) {
      console.error("Error al ajustar los totales tras eliminación:", error.message);
    }

    await Movement.findByIdAndDelete(id); // Eliminar el movimiento

    res.status(200).json({ message: "Movimiento eliminado exitosamente." });
  } catch (error) {
    console.error("Error al eliminar el movimiento:", error.message);
    res.status(500).json({ message: "Hubo un error al eliminar el movimiento", error: error.message });
  }
};

module.exports = {
  createMovement,
  getMovements,
  updateMovement, 
  deleteMovement, 
};