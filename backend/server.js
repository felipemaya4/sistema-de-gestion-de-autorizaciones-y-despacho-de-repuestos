import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import authRouter from './routes/auth.js';
import usuariosRouter from './routes/usuarios.js';
import inicializarSchema from './config/schema.js';
import apiRouter from './routes/api.js'; // <-- 1. Importamos nuestro enrutador

dotenv.config();
const app = express();
inicializarSchema();

//app.use(cors());
app.use(express.json());

// Rutas de autenticación
app.use('/api/auth', authRouter);
// Rutas de usuarios 
app.use('/api/usuarios', usuariosRouter);
// 2. Le decimos a Express que use nuestro enrutador para todas las rutas que empiecen con /api

app.use('/api', apiRouter);

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto http://localhost:${PORT}/api/solicitudes`);
});