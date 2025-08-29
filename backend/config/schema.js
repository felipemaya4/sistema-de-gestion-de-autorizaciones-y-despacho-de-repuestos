import db from './db.js';
import crypto from 'crypto' // Módulo nativo de Node.js para generar IDs

async function inicializarSchema() {
  try {
    // Usamos db.batch() para ejecutar múltiples sentencias en una sola transacción.
    // O ambas se completan con éxito, o ninguna lo hace.
    await db.batch([
      `
            CREATE TABLE IF NOT EXISTS usuarios (
                cin INTEGER PRIMARY KEY,
                nombre TEXT NOT NULL,
                rol TEXT NOT NULL CHECK(rol IN ('Técnico', 'Jefe', 'Almacenista')),
                contrasena TEXT NOT NULL
            )
            `,
      `
            CREATE TABLE IF NOT EXISTS solicitudes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                uuid TEXT NOT NULL,
                numeroOM INTEGER NOT NULL,
                tecnicoCIN INTEGER NOT NULL,
                nombreTecnico TEXT NOT NULL,
                monto REAL NOT NULL,
                descripcion TEXT NOT NULL,
                estado TEXT NOT NULL DEFAULT 'Pendiente',
                jefeAsignado TEXT,
                jefeAprobador TEXT,
                fechaCreacion TEXT NOT NULL,
                fechaDecision TEXT,
                fechaDespacho TEXT,
                motivoRechazo TEXT,
                observacionDespacho TEXT,
                FOREIGN KEY(tecnicoCIN) REFERENCES usuarios(cin)
            )
            `
    ], 'write'); // El modo 'write' es necesario para sentencias que modifican la DB

    console.log("Esquema de la base de datos (usuarios y solicitudes) verificado/creado exitosamente.");
  } catch (error) {
    console.error("Error al inicializar el esquema de la base de datos:", error);
    process.exit(1);
  }
}

export default inicializarSchema;
