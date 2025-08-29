import * as usuarioService from '../services/usuarioService.js';

const obtenerJefes = async (req, res) => {
    try {
        const jefes = await usuarioService.obtenerUsuariosPorRol('Jefe');
        res.status(200).json(jefes);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener la lista de jefes', error: error.message });
    }
};

export default {
    obtenerJefes
};