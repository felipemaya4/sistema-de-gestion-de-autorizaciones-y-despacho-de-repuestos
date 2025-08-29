import db from '../config/db.js';

/**
 * Obtiene una lista de todos los usuarios que tienen un rol específico.
 * @param {string} rol - El rol a buscar (ej: 'Jefe').
 * @returns {Array} Una lista de usuarios.
 */
const obtenerUsuariosPorRol = async (rol) => {
    try {
        const sql = 'SELECT cin, nombre FROM usuarios WHERE rol = ? ORDER BY nombre ASC';
        const args = [rol];
        const result = await db.execute({ sql, args });
        return result.rows;
    } catch (error) {
        console.error("Error en el servicio al obtener usuarios por rol:", error);
        throw new Error('Error al leer los usuarios de la base de datos.');
    }
};

export {
    obtenerUsuariosPorRol
};