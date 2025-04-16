const Movement = require('../models/Movement'); // Modelo de movimientos
const Total = require('../models/Total'); // Modelo de totales

const createMovement = async (req, res) => {
  try {
    const { checkIn, checkOut, ingresos, ota, concepto } = req.body;

    // Validar que checkOut sea mayor que checkIn
    if (new Date(checkOut) <= new Date(checkIn)) {
      return res.status(400).json({ message: "La fecha de check-out debe ser posterior a la de check-in." });
    }

    // Calcular la cantidad de noches
    const noches = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)); // Diferencia en días

    // Validar que al menos un ingreso esté lleno
    const tieneIngreso =
      (ingresos.efectivo?.pesos || ingresos.efectivo?.dolares || ingresos.efectivo?.euros) ||
      (ingresos.tarjeta?.debitoCredito || ingresos.tarjeta?.virtual || ingresos.tarjeta?.transferencias);

    if (!tieneIngreso) {
      return res.status(400).json({ message: "Debe llenar al menos un campo en ingresos (efectivo o tarjeta)." });
    }

    // Crear el movimiento
    const newMovement = new Movement({
      ...req.body,
      noches, // Agregar el cálculo de noches al movimiento
    });
    await newMovement.save();

    // Actualizar totales acumulativos
    const updates = [];
    try {
      if (ingresos.efectivo?.pesos !== null && ingresos.efectivo?.pesos !== undefined) {
        updates.push(
          Total.findOneAndUpdate(
            { tipoIngreso: 'Efectivo MXN' },
            { $inc: { subtotal: ingresos.efectivo.pesos } },
            { upsert: true, new: true }
          )
        );
      }
      if (ingresos.efectivo?.dolares !== null && ingresos.efectivo?.dolares !== undefined) {
        updates.push(
          Total.findOneAndUpdate(
            { tipoIngreso: 'Efectivo USD' },
            { $inc: { subtotal: ingresos.efectivo.dolares } },
            { upsert: true, new: true }
          )
        );
      }
      if (ingresos.efectivo?.euros !== null && ingresos.efectivo?.euros !== undefined) {
        updates.push(
          Total.findOneAndUpdate(
            { tipoIngreso: 'Efectivo EUR' },
            { $inc: { subtotal: ingresos.efectivo.euros } },
            { upsert: true, new: true }
          )
        );
      }

      if (ota) {
        updates.push(
          Total.findOneAndUpdate(
            { categoriaOTA: ota },
            { $inc: { subtotal: ingresos.efectivo?.pesos || 0 } },
            { upsert: true, new: true }
          )
        );
      }

      await Promise.all(updates);
      console.log('Totales actualizados correctamente.');
    } catch (error) {
      console.error('Error al actualizar los totales acumulativos:', error.message);
    }

    res.status(201).json(newMovement);
  } catch (error) {
    console.error('Error al crear el movimiento:', error.message);
    res.status(500).json({ message: 'Hubo un error al crear el movimiento', error: error.message });
  }
};

// Obtener todos los movimientos
const getMovements = async (req, res) => {
  try {
    const movements = await Movement.find(); // Obtener todos los movimientos desde la base de datos
    res.status(200).json(movements);
  } catch (error) {
    console.error('Error al obtener movimientos:', error.message);
    res.status(500).json({ message: 'Error al obtener movimientos', error: error.message });
  }
};

const updateMovement = async (req, res) => {
  try {
    const { id } = req.params;
    const { checkIn, checkOut, ingresos, ota, concepto } = req.body;

    // Validar que checkOut sea mayor que checkIn
    if (checkOut && checkIn && new Date(checkOut) <= new Date(checkIn)) {
      return res.status(400).json({ message: "La fecha de check-out debe ser posterior a la de check-in." });
    }

    // Calcular la cantidad de noches (si se actualizan checkIn o checkOut)
    const noches = checkIn && checkOut
      ? Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)) // Diferencia en días
      : undefined;

    // Encontrar el movimiento previo para ajustar los totales acumulativos
    const previousMovement = await Movement.findById(id);

    if (!previousMovement) {
      return res.status(404).json({ message: "Movimiento no encontrado." });
    }

    // Actualizar el movimiento
    const updatedMovement = await Movement.findByIdAndUpdate(
      id,
      { ...req.body, ...(noches && { noches }) }, // Actualizar noches solo si se recalculan
      { new: true }
    );

    // Recalcular totales acumulativos
    const updates = [];
    try {
      // Restar los valores del movimiento previo
      if (previousMovement.ingresos?.efectivo?.pesos) {
        updates.push(
          Total.findOneAndUpdate(
            { tipoIngreso: 'Efectivo MXN' },
            { $inc: { subtotal: -previousMovement.ingresos.efectivo.pesos } },
            { new: true }
          )
        );
      }
      if (previousMovement.ingresos?.efectivo?.dolares) {
        updates.push(
          Total.findOneAndUpdate(
            { tipoIngreso: 'Efectivo USD' },
            { $inc: { subtotal: -previousMovement.ingresos.efectivo.dolares } },
            { new: true }
          )
        );
      }
      if (previousMovement.ingresos?.efectivo?.euros) {
        updates.push(
          Total.findOneAndUpdate(
            { tipoIngreso: 'Efectivo EUR' },
            { $inc: { subtotal: -previousMovement.ingresos.efectivo.euros } },
            { new: true }
          )
        );
      }

      // Sumar los valores actualizados
      if (ingresos?.efectivo?.pesos) {
        updates.push(
          Total.findOneAndUpdate(
            { tipoIngreso: 'Efectivo MXN' },
            { $inc: { subtotal: ingresos.efectivo.pesos } },
            { new: true }
          )
        );
      }
      if (ingresos?.efectivo?.dolares) {
        updates.push(
          Total.findOneAndUpdate(
            { tipoIngreso: 'Efectivo USD' },
            { $inc: { subtotal: ingresos.efectivo.dolares } },
            { new: true }
          )
        );
      }
      if (ingresos?.efectivo?.euros) {
        updates.push(
          Total.findOneAndUpdate(
            { tipoIngreso: 'Efectivo EUR' },
            { $inc: { subtotal: ingresos.efectivo.euros } },
            { new: true }
          )
        );
      }

      await Promise.all(updates);
      console.log('Totales ajustados correctamente.');
    } catch (error) {
      console.error('Error al ajustar los totales acumulativos:', error.message);
    }

    res.status(200).json(updatedMovement);
  } catch (error) {
    console.error('Error al actualizar el movimiento:', error.message);
    res.status(500).json({ message: 'Hubo un error al actualizar el movimiento', error: error.message });
  }
};

const deleteMovement = async (req, res) => {
  try {
    const { id } = req.params;

    // Encontrar el movimiento para ajustar los totales acumulativos
    const movementToDelete = await Movement.findById(id);

    if (!movementToDelete) {
      return res.status(404).json({ message: "Movimiento no encontrado." });
    }

    // Recalcular totales acumulativos
    const updates = [];
    try {
      if (movementToDelete.ingresos?.efectivo?.pesos) {
        updates.push(
          Total.findOneAndUpdate(
            { tipoIngreso: 'Efectivo MXN' },
            { $inc: { subtotal: -movementToDelete.ingresos.efectivo.pesos } },
            { new: true }
          )
        );
      }
      if (movementToDelete.ingresos?.efectivo?.dolares) {
        updates.push(
          Total.findOneAndUpdate(
            { tipoIngreso: 'Efectivo USD' },
            { $inc: { subtotal: -movementToDelete.ingresos.efectivo.dolares } },
            { new: true }
          )
        );
      }
      if (movementToDelete.ingresos?.efectivo?.euros) {
        updates.push(
          Total.findOneAndUpdate(
            { tipoIngreso: 'Efectivo EUR' },
            { $inc: { subtotal: -movementToDelete.ingresos.efectivo.euros } },
            { new: true }
          )
        );
      }

      await Promise.all(updates);
      console.log('Totales ajustados tras eliminación.');
    } catch (error) {
      console.error('Error al ajustar los totales acumulativos:', error.message);
    }

    await Movement.findByIdAndDelete(id); // Eliminar el movimiento

    res.status(200).json({ message: "Movimiento eliminado exitosamente." });
  } catch (error) {
    console.error('Error al eliminar el movimiento:', error.message);
    res.status(500).json({ message: 'Hubo un error al eliminar el movimiento', error: error.message });
  }
};

module.exports = {
  createMovement,
  getMovements,
  updateMovement, 
  deleteMovement, 
};