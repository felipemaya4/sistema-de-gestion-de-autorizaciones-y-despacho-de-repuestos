document.addEventListener('DOMContentLoaded', () => {

    // --- 1. SELECCIÓN DE ELEMENTOS ---
    const mainView = document.getElementById('warehouse-main-view');
    const dispatchView = document.getElementById('warehouse-dispatch-view');
    const solicitudesListContainer = document.getElementById('solicitudes-list');
    const backToMainViewBtn = document.getElementById('back-to-main-view-btn');
    const solicitudDetailContainer = document.getElementById('solicitud-detail-content');
    const dispatchBtn = document.getElementById('dispatch-btn');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const observacionTextarea = document.getElementById('observacionDespacho');
    const userNameSpan = document.getElementById('user-name');
    const logoutBtn = document.getElementById('logout-btn');

    // --- 2. CONFIGURACIÓN Y AUTENTICACIÓN ---
    const user = getUserInfo();
    if (!user || user.rol !== 'Almacenista') {
        logout(); // Si no es Almacenista, se redirige al login.
    }
    userNameSpan.textContent = user.nombre;
    let currentSolicitudId = null;
    let currentStatusFilter = 'Aprobada'; // El filtro por defecto

    // --- 3. MANEJO DE VISTAS ---
    const showMainView = () => {
        mainView.classList.remove('hidden');
        dispatchView.classList.add('hidden');
        currentSolicitudId = null;
    };
    const showDispatchView = () => {
        mainView.classList.add('hidden');
        dispatchView.classList.remove('hidden');
    };

    // --- 4. RENDERIZADO Y API ---

    const renderSolicitudes = (solicitudes) => {
        solicitudesListContainer.innerHTML = '';
        if (solicitudes.length === 0) {
            solicitudesListContainer.innerHTML = `<p>No hay solicitudes con el estado '${currentStatusFilter || 'Todos'}'.</p>`;
            return;
        }

        solicitudes.forEach(solicitud => {
            const card = document.createElement('article');
            card.className = 'solicitud-card';
            
            // Hacemos que solo las tarjetas 'Aprobadas' sean interactivas para el despacho
            if (solicitud.estado === 'Aprobada') {
                card.style.cursor = 'pointer';
                // CORRECCIÓN APLICADA: Pasamos el objeto 'solicitud' completo
                card.addEventListener('click', () => showDetailForDispatch(solicitud));
            }

            card.innerHTML = `
                <div class="card-header">
                    <h3>OM: ${solicitud.numeroOM}</h3>
                    <span class="status status-${solicitud.estado.toLowerCase()}">${solicitud.estado}</span>
                </div>
                <div class="card-body">
                    <p><strong>Téc:</strong> ${solicitud.nombreTecnico || solicitud.tecnicoCIN}</p>
                    <p><strong>Fecha Aprob.:</strong> ${new Date(solicitud.fechaDecision).toLocaleDateString('es-CO')}</p>
                </div>
            `;
            solicitudesListContainer.appendChild(card);
        });
    };
    
    // CORRECCIÓN APLICADA: La función ahora recibe el objeto completo, no necesita buscarlo
    const showDetailForDispatch = (solicitud) => {
        if (!solicitud) return;
        
        // Usamos el campo 'id' correcto
        currentSolicitudId = solicitud.id;
        
        solicitudDetailContainer.innerHTML = `
            <div class="detail-grid">
                <p><strong>Técnico:</strong> ${solicitud.nombreTecnico || solicitud.tecnicoCIN}</p>
                <p><strong>OM:</strong> ${solicitud.numeroOM}</p>
                <p><strong>Monto:</strong> $${new Intl.NumberFormat('es-CO').format(solicitud.monto)}</p>
                <p><strong>Aprobado por:</strong> ${solicitud.jefeAprobador || 'N/A'}</p>
                 <p><strong>ID de Solicitud:</strong> ${solicitud.id}</p>
                <p><strong>Descripción:</strong></p>
                <p class="full-description">${solicitud.descripcion}</p>
            </div>
        `;
        observacionTextarea.value = ''; // Limpiamos el textarea para la nueva entrada
        showDispatchView();
    };

    const fetchSolicitudes = async (status = '') => {
        currentStatusFilter = status;
        solicitudesListContainer.innerHTML = '<p>Cargando...</p>';

        filterButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.status === status);
        });

        try {
            const response = await authFetch(`/solicitudes?estado=${status}`);
            if (!response.ok) throw new Error('Error al obtener solicitudes.');
            const solicitudes = await response.json();
            renderSolicitudes(solicitudes);
        } catch (error) {
            solicitudesListContainer.innerHTML = `<p style="color: red;">${error.message}</p>`;
        }
    };

    const handleDispatch = async () => {
        if (!currentSolicitudId) return;

        try {
            const response = await authFetch(`/solicitudes/${currentSolicitudId}/despachar`, {
                method: 'PUT',
                body: JSON.stringify({ observacionDespacho: observacionTextarea.value })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'No se pudo despachar la solicitud.');
            }

            alert('¡Solicitud despachada con éxito!');
            showMainView();
            fetchSolicitudes(currentStatusFilter);
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    };

    // --- 5. EVENT LISTENERS ---
    logoutBtn.addEventListener('click', logout);
    backToMainViewBtn.addEventListener('click', showMainView);
    dispatchBtn.addEventListener('click', handleDispatch);
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => fetchSolicitudes(btn.dataset.status));
    });

    // --- 6. INICIALIZACIÓN ---
    showMainView();
    fetchSolicitudes('Aprobada'); // La vista por defecto del almacenista
});