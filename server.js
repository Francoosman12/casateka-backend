const express = require('express');
const connectDB = require('./config/database'); // Conexión a la base de datos
const movementsRoutes = require('./routes/movementsRoutes'); // Rutas de movimientos
const totalsRoutes = require('./routes/totalRoutes'); // Rutas de totales

const cors = require('cors');

const app = express(); // Inicializar la aplicación Express
const PORT = 5000;

// Habilitar CORS
app.use(cors({
    origin: '*',
}));

// Conectar a la base de datos
connectDB();

// Middlewares
app.use(express.json());

// Rutas
app.use('/api/movements', movementsRoutes); // Rutas para movimientos
app.use('/api/totales', totalsRoutes); // Rutas para totales

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});