import express from 'express';
import usuarioController from '../controllers/usuarioController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/usuarios/jefes -> Obtener la lista de jefes.
// Esta ruta está protegida, solo un usuario logueado (como un técnico) puede ver la lista.
router.get('/jefes', protect, usuarioController.obtenerJefes);

export default router;