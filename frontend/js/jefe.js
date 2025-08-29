document.addEventListener('DOMContentLoaded', () => {
    // --- 1. SELECCIÓN DE ELEMENTOS ---
    const mainView = document.getElementById('boss-main-view');
    const detailView = document.getElementById('boss-detail-view');
    const solicitudesListContainer = document.getElementById('solicitudes-pendientes-list');
    const backToMainViewBtn = document.getElementById('back-to-main-view-btn');
    const solicitudDetailContainer = document.getElementById('solicitud-detail-content');
    const approveBtn = document.getElementById('approve-btn');
    const rejectBtn = document.getElementById('reject-btn');
    const pendingCountSpan = document.getElementById('pending-count');
    const rejectReasonGroup = document.querySelector('.reject-reason-group');
    const motivoRechazoTextarea = document.getElementById('motivoRechazo');
    const userNameSpan = document.getElementById('user-name');
    const logoutBtn = document.getElementById('logout-btn');

    // --- 2. CONFIGURACIÓN Y AUTENTICACIÓN ---
    const user = getUserInfo();
    if (!user || user.rol !== 'Jefe') {
        logout();
    }
    userNameSpan.textContent = user.nombre;
    let currentSolicitudId = null;

    // --- 3. MANEJO DE VISTAS ---
    const showMainView = () => {
        mainView.classList.remove('hidden');
        detailView.classList.add('hidden');
        currentSolicitudId = null;
        rejectReasonGroup.classList.add('hidden');
        motivoRechazoTextarea.value = '';
    };
    const showDetailView = () => {
        mainView.classList.add('hidden');
        detailView.classList.remove('hidden');
    };

    // --- 4. RENDERIZADO Y API ---

    const renderSolicitudes = (solicitudes) => {
        solicitudesListContainer.innerHTML = '';
        pendingCountSpan.textContent = `(${solicitudes.length})`;

        if (solicitudes.length === 0) {
            solicitudesListContainer.innerHTML = '<p>No hay solicitudes pendientes de aprobación.</p>';
            return;
        }

        solicitudes.forEach(solicitud => {
            const card = document.createElement('article');
            card.className = 'solicitud-card';
            card.style.cursor = 'pointer';
            
            // --- CORRECCIÓN 1: Aquí pasamos el objeto 'solicitud' COMPLETO ---
            // En lugar de solo el ID, le damos toda la información a la siguiente función.
            card.addEventListener('click', () => showDetail(solicitud));
            
            card.innerHTML = `
                <div class="card-header">
                    <h3>Téc: ${solicitud.nombreTecnico || solicitud.tecnicoCIN}</h3>
                    <span class="status status-pendiente">${solicitud.estado}</span>
                </div>
                <div class="card-body">
                    <p><strong>OM:</strong> ${solicitud.numeroOM}</p>
                    <p><strong>Monto:</strong> $${new Intl.NumberFormat('es-CO').format(solicitud.monto)}</p>
                    <p><strong>Descripción:</strong> ${solicitud.descripcion.substring(0, 100)}...</p>
                </div>
            `;
            solicitudesListContainer.appendChild(card);
        });
    };
    
    // --- CORRECCIÓN 2: Renombramos y simplificamos la función de detalle ---
    // Ya no necesita "buscar" (fetch), solo mostrar los datos que ya tenemos.
    const showDetail = (solicitud) => {
        // Si no recibimos una solicitud, no hacemos nada.
        if (!solicitud) {
            console.error('Se intentó mostrar el detalle de una solicitud inválida.');
            return;
        }
        
        // Usamos el campo correcto 'id' (no '_id')
        currentSolicitudId = solicitud.id; 
        
        solicitudDetailContainer.innerHTML = `
            <div class="detail-grid">
                <p><strong>Técnico:</strong> ${solicitud.nombreTecnico || solicitud.tecnicoCIN}</p>
                <p><strong>OM:</strong> ${solicitud.numeroOM}</p>
                <p><strong>Monto:</strong> $${new Intl.NumberFormat('es-CO').format(solicitud.monto)}</p>
                <p><strong>Fecha Solicitud:</strong> ${new Date(solicitud.fechaCreacion).toLocaleString('es-CO')}</p>
                <p><strong>ID de Solicitud:</strong> ${solicitud.id}</p>
                <p><strong>Descripción Completa:</strong></p>
                <p class="full-description">${solicitud.descripcion}</p>
            </div>
        `;
        showDetailView();
    };

    const fetchSolicitudesPendientes = async () => {
        try {
            const response = await authFetch(`/solicitudes?rol=jefe`);
            if (!response.ok) throw new Error('Error al obtener solicitudes.');
            const solicitudes = await response.json();
            renderSolicitudes(solicitudes);
        } catch (error) {
            solicitudesListContainer.innerHTML = `<p style="color: red;">${error.message}</p>`;
        }
    };
    
    const handleDecision = async (action) => {
        // ... (esta función se mantiene igual)
        try {
            const options = {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: action === 'rechazar' 
                    ? JSON.stringify({ motivoRechazo: motivoRechazoTextarea.value, idJefe: user.cin }) 
                    : JSON.stringify({ idJefe: user.cin }),
            };

            const response = await authFetch(`/solicitudes/${currentSolicitudId}/${action}`, options);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `No se pudo ${action} la solicitud.`);
            }
            alert(`¡Solicitud ${action === 'aprobar' ? 'aprobada' : 'rechazada'} con éxito!`);
            showMainView();
            fetchSolicitudesPendientes();
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    };
    
    // --- 5. EVENT LISTENERS (sin cambios) ---
    logoutBtn.addEventListener('click', logout);
    backToMainViewBtn.addEventListener('click', showMainView);
    approveBtn.addEventListener('click', () => handleDecision('aprobar'));
    rejectBtn.addEventListener('click', () => {
        if (rejectReasonGroup.classList.contains('hidden')) {
            rejectReasonGroup.classList.remove('hidden');
        } else {
            handleDecision('rechazar');
        }
    });

    // --- 6. INICIALIZACIÓN ---
    showMainView();
    fetchSolicitudesPendientes();
});