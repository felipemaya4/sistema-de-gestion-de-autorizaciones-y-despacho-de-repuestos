document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('register-form');
    const messageContainer = document.getElementById('message');
    //const API_BASE_URL = 'http://localhost:3000/api';
    const API_BASE_URL = 'https://sistema-de-gestion-de-solicitud-de.onrender.com/api';
    

    registerForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        messageContainer.textContent = ''; // Limpiar mensajes previos
        messageContainer.style.color = 'red'; // Color por defecto para errores

        const formData = new FormData(registerForm);
        const data = Object.fromEntries(formData.entries());

        // 1. Validación en el frontend: Verificar que las contraseñas coinciden
        if (data.contrasena !== data.confirmarContrasena) {
            messageContainer.textContent = 'Las contraseñas no coinciden.';
            return;
        }

        try {
            // No necesitamos el campo de confirmación en el backend, lo eliminamos
            delete data.confirmarContrasena;

            // 2. Hacemos la llamada a la API de registro
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                // Si la API devuelve un error (ej: CIN ya existe), lo mostramos
                throw new Error(result.message || 'Error al registrar el usuario.');
            }

            // 3. Éxito en el registro
            messageContainer.textContent = '¡Registro exitoso! Serás redirigido al login en 3 segundos...';
            messageContainer.style.color = 'green'; // Color verde para mensajes de éxito
            
            // Redirigir al login después de 3 segundos
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 3000);

        } catch (error) {
            messageContainer.textContent = error.message;
        }
    });
});