document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');
    const API_BASE_URL = 'https://sistema-de-gestion-de-solicitud-de.onrender.com/api';
    //const API_BASE_URL = 'https://sistema-de-gestion-de-solicitud-de.onrender.com/api';
    const loadingModal = document.getElementById('loading-modal');

    function showLoading() {
        if (loadingModal) {
            loadingModal.classList.remove('hidden');
            loadingModal.setAttribute('aria-hidden', 'false');
        }
    }

    function hideLoading() {
        if (loadingModal) {
            loadingModal.classList.add('hidden');
            loadingModal.setAttribute('aria-hidden', 'true');
        }
    }

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        errorMessage.textContent = ''; // Limpiar errores previos

        const formData = new FormData(loginForm);
        const data = Object.fromEntries(formData.entries());

        showLoading();
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Error al iniciar sesión.');
            }

            // --- ¡Éxito! Guardamos los datos y redirigimos ---
            localStorage.setItem('authToken', result.token);
            localStorage.setItem('userInfo', JSON.stringify(result.usuario));

            // Redirigir según el rol del usuario
            switch (result.usuario.rol) {
                case 'Técnico':
                    window.location.href = 'tecnico.html';
                    break;
                case 'Jefe':
                    window.location.href = 'jefe.html';
                    break;
                case 'Almacenista':
                    window.location.href = 'almacenista.html';
                    break;
                default:
                    errorMessage.textContent = 'Rol de usuario no reconocido.';
            }

        } catch (error) {
            errorMessage.textContent = error.message;
        } finally {
            // Ocultamos el modal (si la página se redirige, esto no hace daño)
            hideLoading();
        }
    });
});