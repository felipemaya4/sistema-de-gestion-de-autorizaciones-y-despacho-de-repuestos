import express from 'express';
import authController from '../controllers/authController.js';

const router = express.Router();

// POST /api/auth/register -> Registrar un nuevo usuario
router.post('/register', authController.register);

// POST /api/auth/login -> Iniciar sesión
router.post('/login', authController.login);

export default router;