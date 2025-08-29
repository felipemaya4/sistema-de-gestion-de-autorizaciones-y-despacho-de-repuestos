import jwt from 'jsonwebtoken';
import db from '../config/db.js';

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // 1. Obtener el token del header
            token = req.headers.authorization.split(' ')[1];

            // 2. Verificar el token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // 3. Obtener los datos del usuario desde la DB (sin la contraseña) y adjuntarlos a la petición
            const result = await db.execute({ sql: 'SELECT cin, nombre, rol FROM usuarios WHERE cin = ?', args: [decoded.cin] });
            if (result.rows.length === 0) {
                return res.status(401).json({ message: 'No autorizado, usuario no encontrado' });
            }
            req.user = result.rows[0];

            next(); // Continuar a la siguiente función (el controlador)
        } catch (error) {
            return res.status(401).json({ message: 'No autorizado, token inválido' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'No autorizado, no hay token' });
    }
};

// Middleware para restringir por roles
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.rol)) {
            return res.status(403).json({ message: `El rol '${req.user.rol}' no tiene permiso para esta acción` });
        }
        next();
    };
};

export { protect, authorize };