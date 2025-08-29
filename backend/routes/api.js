import express from 'express';
import solicitudController from '../controllers/solicitudController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

// Creamos una instancia del enrutador de Express
const router = express.Router();

// Aplicar el middleware de protección a todas las rutas
router.use(protect);

// --- Definición de Rutas para Solicitudes ---

// POST /api/solicitudes -> Crear una nueva solicitud
router.post('/solicitudes', authorize('Técnico'), solicitudController.crearSolicitud);

// GET /api/solicitudes -> Obtener una lista de solicitudes (con filtros)
router.get('/solicitudes', solicitudController.obtenerSolicitudes);

// PUT /api/solicitudes/:id/aprobar -> Aprobar una solicitud por su ID
router.put('/solicitudes/:id/aprobar', authorize('Jefe'), solicitudController.aprobarSolicitud);

// PUT /api/solicitudes/:id/rechazar -> Rechazar una solicitud por su ID
router.put('/solicitudes/:id/rechazar', authorize('Jefe'), solicitudController.rechazarSolicitud);

// PUT /api/solicitudes/:id/despachar -> Despachar una solicitud por su ID
router.put('/solicitudes/:id/despachar', authorize('Almacenista'), solicitudController.despacharSolicitud);

// Exportamos el enrutador para que el servidor principal lo pueda usar
export default router;