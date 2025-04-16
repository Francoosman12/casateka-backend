const Total = require('../models/Total'); // Modelo de totales
const Movement = require('../models/Movement'); // Modelo de movimientos

// Obtener todos los totales
exports.getAllTotals = async (req, res) => {
  try {
    const totals = await Total.find();
    res.status(200).json(totals);
  } catch (error) {
    console.error('Error al obtener los totales:', error.message);
    res.status(500).json({ message: 'Error al obtener los totales', error: error.message });
  }
};

// Calcular y guardar totales basados en movimientos
exports.calculateAndSaveTotals = async () => {
  try {
    // Obtén todos los movimientos registrados en la base de datos
    const movements = await Movement.find();

    if (!movements || movements.length === 0) {
      console.log('No hay movimientos registrados.');
      return; // Termina si no hay movimientos
    }

    // Calcular totales por tipo de ingreso
    const efectivoMXN = movements.reduce((sum, mov) => sum + (mov.ingresos?.efectivo?.pesos || 0), 0);
    const efectivoUSD = movements.reduce((sum, mov) => sum + (mov.ingresos?.efectivo?.dolares || 0), 0);
    const efectivoEUR = movements.reduce((sum, mov) => sum + (mov.ingresos?.efectivo?.euros || 0), 0);
    const tarjetasDebitoCredito = movements.reduce((sum, mov) => sum + (mov.ingresos?.tarjeta?.debitoCredito || 0), 0);
    const tarjetasVirtuales = movements.reduce((sum, mov) => sum + (mov.ingresos?.tarjeta?.virtual || 0), 0);
    const transferencias = movements.reduce((sum, mov) => sum + (mov.ingresos?.tarjeta?.transferencias || 0), 0);

    // Calcular totales por OTA
    const totalBooking = movements.filter(mov => mov.ota === 'Booking').reduce((sum, mov) => sum + (mov.ingresos?.efectivo?.pesos || 0), 0);
    const totalExpedia = movements.filter(mov => mov.ota === 'Expedia').reduce((sum, mov) => sum + (mov.ingresos?.efectivo?.pesos || 0), 0);
    const totalDirecta = movements.filter(mov => mov.ota === 'Directa').reduce((sum, mov) => sum + (mov.ingresos?.efectivo?.pesos || 0), 0);

    // Calcular totales por concepto
    const totalAmenidades = movements.filter(mov => mov.concepto === 'Amenidades').reduce((sum, mov) => sum + (mov.ingresos?.efectivo?.pesos || 0), 0);
    const totalEstancia = movements.filter(mov => mov.concepto === 'Estancia').reduce((sum, mov) => sum + (mov.ingresos?.efectivo?.pesos || 0), 0);

    // Preparar datos para guardar en la base de datos
    const totals = [
      { categoria: 'Efectivo MXN', total: efectivoMXN },
      { categoria: 'Efectivo USD', total: efectivoUSD },
      { categoria: 'Efectivo EUR', total: efectivoEUR },
      { categoria: 'Tarjetas Débito/Crédito', total: tarjetasDebitoCredito },
      { categoria: 'Tarjetas Virtuales', total: tarjetasVirtuales },
      { categoria: 'Transferencias', total: transferencias },
      { categoria: 'Booking', total: totalBooking },
      { categoria: 'Expedia', total: totalExpedia },
      { categoria: 'Directa', total: totalDirecta },
      { categoria: 'Amenidades', total: totalAmenidades },
      { categoria: 'Estancia', total: totalEstancia },
    ];

    // Eliminar totales antiguos y guardar los nuevos
    await Total.deleteMany(); // Limpia la colección de totales antiguos
    await Total.insertMany(totals); // Guarda los nuevos totales calculados

    console.log('Totales calculados y guardados correctamente.');
    return totals; // Devuelve los totales calculados si es necesario
  } catch (error) {
    console.error('Error al calcular y guardar los totales:', error.message);
    throw error; // Lanza el error para manejarlo externamente si es necesario
  }
};

// Eliminar un total específico por ID
exports.deleteTotal = async (req, res) => {
  const { id } = req.params;
  try {
    const totalToDelete = await Total.findById(id);
    if (!totalToDelete) {
      return res.status(404).json({ message: 'Total no encontrado' });
    }

    await totalToDelete.deleteOne();
    res.status(200).json({ message: 'Total eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar el total:', error.message);
    res.status(500).json({ message: 'Error al eliminar el total', error: error.message });
  }
};