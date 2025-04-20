const Movement = require('../models/Movement'); // Modelo de movimientos
const Total = require('../models/Total'); // Modelo de totales

const createMovement = async (req, res) => {
  try {
    const { checkIn, checkOut, ingreso, ota, concepto } = req.body;

    // Validar que checkOut sea mayor que checkIn
    if (new Date(checkOut) <= new Date(checkIn)) {
      return res.status(400).json({
        message: "La fecha de check-out debe ser posterior a la de check-in.",
      });
    }

    // Validar ingreso
    if (!ingreso || !ingreso.tipo || !ingreso.subtipo || !ingreso.monto) {
      return res.status(400).json({
        message: "Todos los campos del ingreso son obligatorios (tipo, subtipo y monto).",
      });
    }

    // Calcular la cantidad de noches
    const noches = Math.ceil(
      (new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)
    );

    // Crear el movimiento
    const newMovement = new Movement({
      ...req.body,
      noches, // Agregar el cálculo de noches al movimiento
    });

    await newMovement.save();

    // Actualizar totales acumulativos
    try {
      await Total.findOneAndUpdate(
        { tipoIngreso: `${ingreso.tipo} - ${ingreso.subtipo}` },
        { $inc: { subtotal: ingreso.monto } },
        { upsert: true, new: true }
      );
      console.log("Totales actualizados correctamente.");
    } catch (error) {
      console.error("Error al actualizar los totales acumulativos:", error.message);
    }

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
    const { checkIn, checkOut, ingreso, ota, concepto } = req.body;

    // Validar que checkOut sea mayor que checkIn
    if (checkOut && checkIn && new Date(checkOut) <= new Date(checkIn)) {
      return res.status(400).json({
        message: "La fecha de check-out debe ser posterior a la de check-in.",
      });
    }

    // Validar ingreso
    if (!ingreso || !ingreso.tipo || !ingreso.subtipo || !ingreso.monto) {
      return res.status(400).json({
        message: "Todos los campos del ingreso son obligatorios (tipo, subtipo y monto).",
      });
    }

    const previousMovement = await Movement.findById(id);

    if (!previousMovement) {
      return res.status(404).json({ message: "Movimiento no encontrado." });
    }

    // Restar el monto anterior de los totales
    try {
      await Total.findOneAndUpdate(
        { tipoIngreso: `${previousMovement.ingreso.tipo} - ${previousMovement.ingreso.subtipo}` },
        { $inc: { subtotal: -previousMovement.ingreso.monto } },
        { new: true }
      );

      // Sumar el nuevo monto a los totales
      await Total.findOneAndUpdate(
        { tipoIngreso: `${ingreso.tipo} - ${ingreso.subtipo}` },
        { $inc: { subtotal: ingreso.monto } },
        { upsert: true, new: true }
      );
    } catch (error) {
      console.error("Error al actualizar los totales acumulativos:", error.message);
    }

    // Actualizar el movimiento
    const updatedMovement = await Movement.findByIdAndUpdate(
      id,
      { ...req.body },
      { new: true }
    );

    res.status(200).json(updatedMovement);
  } catch (error) {
    console.error("Error al actualizar el movimiento:", error.message);
    res.status(500).json({ message: "Hubo un error al actualizar el movimiento", error: error.message });
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