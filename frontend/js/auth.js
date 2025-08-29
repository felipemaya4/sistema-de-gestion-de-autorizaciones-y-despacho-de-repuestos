const API_BASE_URL = 'http://localhost:3000/api';

// --- Funciones de Ayuda ---
const getToken = () => localStorage.getItem('authToken');
const getUserInfo = () => JSON.parse(localStorage.getItem('userInfo'));
const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userInfo');
    window.location.href = 'index.html';
};

// --- Verificación de Página ---
// Esto se ejecuta en cada página protegida. Si no hay token, redirige al login.
if (!getToken()) {
    logout();
}

/**
 * Un "wrapper" para la función fetch que automáticamente añade el token de autorización.
 * También maneja errores de autenticación (401, 403) haciendo logout.
 * @param {string} url - La URL del endpoint de la API (ej: '/solicitudes')
 * @param {object} options - Las opciones de fetch (method, headers, body)
 * @returns {Promise<Response>} La respuesta de fetch
 */
const authFetch = async (url, options = {}) => {
    const token = getToken();

    const defaultHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    const config = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers,
        },
    };

    const response = await fetch(API_BASE_URL + url, config);

    if (response.status === 401 || response.status === 403) {
        // Si el token es inválido o el usuario no tiene permisos, hacemos logout.
        logout();
    }

    return response;
};