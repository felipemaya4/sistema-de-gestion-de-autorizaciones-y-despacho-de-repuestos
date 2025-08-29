import db from '../config/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const registrarUsuario = async (datosUsuario) => {
    const { cin, nombre, rol, contrasena } = datosUsuario;

    // 1. Verificar si el usuario ya existe
    const existente = await db.execute({ sql: 'SELECT * FROM usuarios WHERE cin = ?', args: [cin] });
    if (existente.rows.length > 0) {
        throw new Error('El CIN ya está registrado.');
    }

    // 2. Hashear la contraseña
    const salt = await bcrypt.genSalt(10);
    const contrasenaHash = await bcrypt.hash(contrasena, salt);

    // 3. Guardar el nuevo usuario en la base de datos
    const sql = 'INSERT INTO usuarios (cin, nombre, rol, contrasena) VALUES (?, ?, ?, ?)';
    const args = [cin, nombre, rol, contrasenaHash];
    
    await db.execute({ sql, args });

    // No devolvemos la contraseña hasheada
    return { cin, nombre, rol };
};

const iniciarSesion = async (datosLogin) => {
    const { cin, contrasena } = datosLogin;

    // 1. Buscar al usuario por su CIN
    const result = await db.execute({ sql: 'SELECT * FROM usuarios WHERE cin = ?', args: [cin] });
    if (result.rows.length === 0) {
        throw new Error('Credenciales inválidas.'); // Mensaje genérico por seguridad
    }
    const usuario = result.rows[0];

    // 2. Comparar la contraseña enviada con el hash guardado
    const esCorrecta = await bcrypt.compare(contrasena, usuario.contrasena);
    if (!esCorrecta) {
        throw new Error('Credenciales inválidas..');
    }

    // 3. Si todo es correcto, crear el Token JWT
    const payload = {
        cin: usuario.cin,
        rol: usuario.rol,
        nombre: usuario.nombre
    };
    
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: '8h' // El token expirará en 8 horas
    });

    return { token, usuario: payload };
};

export { registrarUsuario, iniciarSesion };