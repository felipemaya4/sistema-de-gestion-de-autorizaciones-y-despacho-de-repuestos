// 1. Importaciones con sintaxis de Módulos ES
import db from '../config/db.js';
import crypto from 'crypto';

/**
 * Servicio para crear una nueva solicitud en la base de datos.
 * (Esta es la función que ya creamos, ahora con la exportación al final)
 */
const crearNuevaSolicitud = async (datosSolicitud) => {
   // 2. Extraemos los datos que necesitamos del objeto que nos pasa el controlador
    const {
        numeroOM,
        tecnicoCIN,
        nombreTecnico,
        monto,
        descripcion,
        jefeAsignado
    } = datosSolicitud;

    // 3. Preparamos los datos que la base de datos necesita
    const uuid = crypto.randomUUID(); // Generamos un ID único para uso interno
    const estado = 'Pendiente'; // El estado inicial es siempre 'Pendiente'
    const fechaCreacion = new Date().toISOString(); // Usamos el formato de fecha ISO 8601

    // 4. Construimos la consulta SQL y los argumentos
    const sql = `
        INSERT INTO solicitudes (
            uuid, numeroOM, tecnicoCIN, nombreTecnico, monto, descripcion, 
            estado, jefeAsignado, fechaCreacion
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const args = [
        uuid, numeroOM, tecnicoCIN, nombreTecnico, monto, descripcion, 
        estado, jefeAsignado, fechaCreacion
    ];

    try {
        // 5. Ejecutamos la consulta INSERT
        const result = await db.execute({ sql, args });

        // Verificamos si la inserción fue exitosa
        if (result.rowsAffected === 0) {
            throw new Error('No se pudo crear la solicitud.');
        }

        // 6. Obtenemos el ID autoincremental que se acaba de generar
        const nuevoId = result.lastInsertRowid;

        // 7. Hacemos una segunda consulta para obtener y devolver el registro completo que acabamos de crear
        const selectResult = await db.execute({
            sql: 'SELECT * FROM solicitudes WHERE id = ?',
            args: [nuevoId]
        });

        return selectResult.rows[0];

    } catch (error) {
        console.error("Error en el servicio al crear la solicitud:", error);
        // Relanzamos el error para que el controlador lo capture y envíe una respuesta 500
        throw new Error('Error al interactuar con la base de datos.');
    }
};

/**
 * Servicio para obtener una lista de solicitudes según diferentes filtros.
 */
const obtenerSolicitudesPorFiltro = async (filtros) => {
    // 1. Empezamos con la base de la consulta
    let sql = 'SELECT * FROM solicitudes';
    const whereClauses = [];
    const args = [];

    // 2. Construimos la cláusula WHERE de forma dinámica y segura

    // Filtro para un técnico específico
    if (filtros.rol === 'tecnico') {
        if (!filtros.id) {
            throw new Error('Se requiere el ID del técnico para la consulta.');
        }
        whereClauses.push('tecnicoCIN = ?');
        args.push(filtros.id);
    }
    
    // Filtro por estado (puede venir del almacenista o de un jefe viendo el historial)
    if (filtros.estado) {
        whereClauses.push('estado = ?');
        args.push(filtros.estado);
    } 
    // Si no viene un estado específico, aplicamos las reglas por defecto para los roles
    else {
        if (filtros.rol === 'jefe') {
            whereClauses.push('estado = ?');
            args.push('Pendiente');
        } else if (filtros.rol === 'almacenista') {
            whereClauses.push('estado = ?');
            args.push('Aprobada');
        }
    }
    
    // 3. Si se añadió alguna cláusula WHERE, la unimos a la consulta principal
    if (whereClauses.length > 0) {
        sql += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    // 4. Añadimos el ordenamiento para que las más nuevas aparezcan primero
    sql += ' ORDER BY fechaCreacion DESC';

    try {
        // 5. Ejecutamos la consulta final
        const result = await db.execute({ sql, args });
        return result.rows;
    } catch (error) {
        console.error("Error en el servicio al obtener solicitudes:", error);
        throw new Error('Error al leer de la base de datos.');
    }
};

/**
 * Aprueba una solicitud pendiente.
 */
const aprobarUnaSolicitud = async (idSolicitud, idJefe) => {
    // 1. Leer: Buscamos la solicitud actual
    const solicitudActual = await db.execute({ sql: 'SELECT estado FROM solicitudes WHERE id = ?', args: [idSolicitud] });
    if (solicitudActual.rows.length === 0) {
        throw new Error('Solicitud no encontrada.');
    }

    // 2. Validar: Aplicamos la regla de negocio
    if (solicitudActual.rows[0].estado !== 'Pendiente') {
        throw new Error('Solo se pueden aprobar solicitudes que están en estado "Pendiente".');
    }

    // 3. Actualizar: Preparamos y ejecutamos la consulta UPDATE
    const sql = `
        UPDATE solicitudes 
        SET estado = ?, fechaDecision = ?, jefeAprobador = ? 
        WHERE id = ?
    `;
    const args = ['Aprobada', new Date().toISOString(), idJefe, idSolicitud];
    
    await db.execute({ sql, args });

    // 4. Devolver: Retornamos la solicitud actualizada para enviarla al frontend
    const resultadoFinal = await db.execute({ sql: 'SELECT * FROM solicitudes WHERE id = ?', args: [idSolicitud] });
    return resultadoFinal.rows[0];
};

/**
 * Rechaza una solicitud pendiente.
 */
const rechazarUnaSolicitud = async (idSolicitud, datosRechazo) => {
    const solicitudActual = await db.execute({ sql: 'SELECT estado FROM solicitudes WHERE id = ?', args: [idSolicitud] });
    if (solicitudActual.rows.length === 0) throw new Error('Solicitud no encontrada.');

    if (solicitudActual.rows[0].estado !== 'Pendiente') {
        throw new Error('Solo se pueden rechazar solicitudes que están en estado "Pendiente".');
    }

    const sql = `
        UPDATE solicitudes 
        SET estado = ?, fechaDecision = ?, jefeAprobador = ?, motivoRechazo = ?
        WHERE id = ?
    `;
    const args = ['Rechazada', new Date().toISOString(), datosRechazo.idJefe, datosRechazo.motivoRechazo, idSolicitud];
    
    await db.execute({ sql, args });
    
    const resultadoFinal = await db.execute({ sql: 'SELECT * FROM solicitudes WHERE id = ?', args: [idSolicitud] });
    return resultadoFinal.rows[0];
};

/**
 * Despacha una solicitud aprobada.
 */
const despacharUnaSolicitud = async (idSolicitud, datosDespacho) => {
    const solicitudActual = await db.execute({ sql: 'SELECT estado FROM solicitudes WHERE id = ?', args: [idSolicitud] });
    if (solicitudActual.rows.length === 0) throw new Error('Solicitud no encontrada.');

    // Regla de negocio diferente: solo se despacha si está 'Aprobada'
    if (solicitudActual.rows[0].estado !== 'Aprobada') {
        throw new Error('Solo se pueden despachar solicitudes que están en estado "Aprobada".');
    }

    const sql = `
        UPDATE solicitudes 
        SET estado = ?, fechaDespacho = ?, observacionDespacho = ?
        WHERE id = ?
    `;
    const args = ['Despachado', new Date().toISOString(), datosDespacho.observacionDespacho, idSolicitud];
    
    await db.execute({ sql, args });
    
    const resultadoFinal = await db.execute({ sql: 'SELECT * FROM solicitudes WHERE id = ?', args: [idSolicitud] });
    return resultadoFinal.rows[0];
};

// --- EXPORTACIÓN DE FUNCIONES ---
// Exportamos todas las funciones al final del archivo, como solicitaste.
export {
    crearNuevaSolicitud,
    obtenerSolicitudesPorFiltro,
    aprobarUnaSolicitud,
    rechazarUnaSolicitud,
    despacharUnaSolicitud
};