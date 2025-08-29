document.addEventListener('DOMContentLoaded', () => {
    // --- 1. SELECCIÓN DE ELEMENTOS ---
    const mainView = document.getElementById('technician-main-view');
    const newRequestView = document.getElementById('technician-new-request-view');
    const solicitudesListContainer = document.getElementById('solicitudes-list');
    const showNewRequestFormBtn = document.getElementById('show-new-request-form-btn');
    const backToMainViewBtn = document.getElementById('back-to-main-view-btn');
    const newRequestForm = document.getElementById('new-request-form');
    const userNameSpan = document.getElementById('user-name');
    const logoutBtn = document.getElementById('logout-btn');
    const jefeAsignadoSelect = document.getElementById('jefeAsignado');

    // --- 2. CONFIGURACIÓN Y AUTENTICACIÓN ---
    const user = getUserInfo();
    if (!user || user.rol !== 'Técnico') {
        logout();
    }
    userNameSpan.textContent = user.nombre;

    // --- 3. FUNCIONES DE MANEJO DE VISTAS ---
    const showMainView = () => {
        mainView.style.display = 'block';
        newRequestView.style.display = 'none';
    };
    const showNewRequestView = () => {
        mainView.style.display = 'none';
        newRequestView.style.display = 'block';
        cargarJefes();
    };
    
    // --- 4. FUNCIONES DE API ---
    const cargarJefes = async () => {
        // ... (código para cargar jefes que ya implementamos)
        try {
            const response = await authFetch('/usuarios/jefes');
            if (!response.ok) throw new Error('No se pudo cargar la lista de jefes.');
            const jefes = await response.json();
            jefeAsignadoSelect.innerHTML = '<option value="">-- Seleccione un jefe --</option>';
            jefes.forEach(jefe => {
                const option = document.createElement('option');
                option.value = jefe.cin;
                option.textContent = jefe.nombre;
                jefeAsignadoSelect.appendChild(option);
            });
        } catch (error) {
            console.error(error);
            jefeAsignadoSelect.innerHTML = '<option value="">-- Error al cargar jefes --</option>';
        }
    };

    const fetchAndRenderSolicitudes = async () => {
        solicitudesListContainer.innerHTML = '<p>Cargando solicitudes...</p>';
        try {
            const response = await authFetch(`/solicitudes?rol=tecnico&id=${user.cin}`);
            if (!response.ok) throw new Error('Error al cargar solicitudes.');
            
            const solicitudes = await response.json();
            solicitudesListContainer.innerHTML = '';

            if (solicitudes.length === 0) {
                solicitudesListContainer.innerHTML = '<p>No tienes solicitudes registradas.</p>';
                return;
            }

            // --- INICIO DE LA CORRECCIÓN ---
            solicitudes.forEach(solicitud => {
                const card = document.createElement('article');
                card.className = 'solicitud-card';

                // Usamos un template literal (comillas invertidas ``) para construir el HTML
                // con los datos reales de cada solicitud.
                card.innerHTML = `
                    <div class="card-header">
                        <h3>OM: ${solicitud.numeroOM}</h3>
                        <span class="status status-${solicitud.estado.toLowerCase()}">${solicitud.estado}</span>
                    </div>
                    <div class="card-body">
                        <p><strong>Monto:</strong> $${new Intl.NumberFormat('es-CO').format(solicitud.monto)}</p>
                        <p><strong>Descripción:</strong> ${solicitud.descripcion}</p>
                        <p><strong>Fecha:</strong> ${new Date(solicitud.fechaCreacion).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                `;
                solicitudesListContainer.appendChild(card);
            });
            // --- FIN DE LA CORRECCIÓN ---

        } catch (error) {
            solicitudesListContainer.innerHTML = `<p style="color: red;">${error.message}</p>`;
        }
    };

    const handleFormSubmit = async (event) => {
        // ... (código de handleFormSubmit que ya implementamos)
        event.preventDefault();
        const formData = new FormData(newRequestForm);
        const data = Object.fromEntries(formData.entries());

        data.tecnicoCIN = user.cin;
        data.nombreTecnico = user.nombre;
        data.monto = parseFloat(data.monto);

        try {
            const response = await authFetch('/solicitudes', {
                method: 'POST',
                body: JSON.stringify(data),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'No se pudo crear la solicitud.');
            }
            alert('¡Solicitud creada con éxito!');
            newRequestForm.reset();
            showMainView();
            fetchAndRenderSolicitudes();
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    };

    // --- 5. EVENT LISTENERS ---
    logoutBtn.addEventListener('click', logout);
    showNewRequestFormBtn.addEventListener('click', showNewRequestView);
    backToMainViewBtn.addEventListener('click', showMainView);
    newRequestForm.addEventListener('submit', handleFormSubmit);

    // --- 6. INICIALIZACIÓN ---
    showMainView();
    fetchAndRenderSolicitudes();
});