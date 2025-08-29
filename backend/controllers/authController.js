import * as authService from '../services/authService.js';

const register = async (req, res) => {
    try {
        const nuevoUsuario = await authService.registrarUsuario(req.body);
        res.status(201).json({ message: 'Usuario registrado con éxito', usuario: nuevoUsuario });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { token, usuario } = await authService.iniciarSesion(req.body);
        res.status(200).json({ message: 'Login exitoso', token, usuario });
    } catch (error) {
        res.status(401).json({ message: error.message });
    }
};

export default { register, login };