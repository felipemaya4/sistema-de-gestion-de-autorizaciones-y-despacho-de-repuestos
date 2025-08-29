// Importamos todas las funciones de nuestro servicio
import * as solicitudService from '../services/solicitudService.js';

// --- Funciones del Controlador ---

const crearSolicitud = async (req, res) => {
    try {
        const datos = req.body;
        if (!datos.numeroOM || !datos.tecnicoCIN || !datos.monto || !datos.descripcion) {
            return res.status(400).json({ message: 'Faltan campos obligatorios.' });
        }
        const nuevaSolicitud = await solicitudService.crearNuevaSolicitud(datos);
        res.status(201).json(nuevaSolicitud);
    } catch (error) {
        res.status(500).json({ message: 'Error al crear la solicitud', error: error.message });
    }
};

const obtenerSolicitudes = async (req, res) => {
    try {
        const filtros = req.query;
        const solicitudes = await solicitudService.obtenerSolicitudesPorFiltro(filtros);
        res.status(200).json(solicitudes);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener las solicitudes', error: error.message });
    }
};

const aprobarSolicitud = async (req, res) => {
    try {
        const { id } = req.params;
        // NOTA: En una aplicación real con login, el ID del jefe vendría de la sesión del usuario (ej: req.user.cin)
        const idJefe = req.user.cin;
        const solicitudActualizada = await solicitudService.aprobarUnaSolicitud(id, idJefe);
        res.status(200).json(solicitudActualizada);
    } catch (error) {
        // Si el error es por no encontrar la solicitud, enviamos un 404
        if (error.message.includes('encontrada') || error.message.includes('Pendiente')) {
            return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error al aprobar la solicitud', error: error.message });
    }
};

const rechazarSolicitud = async (req, res) => {
    try {
        const { id } = req.params;
        const { motivoRechazo } = req.body;
        const idJefe = req.user.cin;
        
        const datosRechazo = { motivoRechazo, idJefe };
        const solicitudActualizada = await solicitudService.rechazarUnaSolicitud(id, datosRechazo);
        res.status(200).json(solicitudActualizada);
    } catch (error) {
         if (error.message.includes('encontrada') || error.message.includes('Pendiente')) {
            return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error al rechazar la solicitud', error: error.message });
    }
};

const despacharSolicitud = async (req, res) => {
    try {
        const { id } = req.params;
        const { observacionDespacho } = req.body;
        
        const datosDespacho = { observacionDespacho };
        const solicitudActualizada = await solicitudService.despacharUnaSolicitud(id, datosDespacho);
        res.status(200).json(solicitudActualizada);
    } catch (error) {
         if (error.message.includes('encontrada') || error.message.includes('Aprobada')) {
            return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error al despachar la solicitud', error: error.message });
    }
};


// Exportamos un objeto con todas nuestras funciones controladoras
export default {
    crearSolicitud,
    obtenerSolicitudes,
    aprobarSolicitud,
    rechazarSolicitud,
    despacharSolicitud
};