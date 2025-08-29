import { createClient } from '@libsql/client';
import dotenv from 'dotenv'

dotenv.config()  // funcionen las variables de entorno

// 1. Verificamos que las variables de entorno existan
if (!process.env.DB_URL) {
    throw new Error('La variable de entorno DB_URL no está definida.');
}

// 2. Creamos el objeto de configuración para el cliente
const config = {
    url: process.env.DB_URL,
    authToken: process.env.DB_TOKEN,
};

// 3. Creamos la instancia del cliente
const db = createClient(config);

// 4. Exportamos el cliente para poder usarlo en otros archivos (principalmente en los servicios)
export default db;