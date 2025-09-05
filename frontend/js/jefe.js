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
    const filterButtons = document.querySelectorAll('.filter-btn');
    const searchBar = document.getElementById('search-bar');
    const actionFooter = document.querySelector('.action-footer');

    // --- 2. ESTADO DE LA APLICACIÓN ---
    const user = getUserInfo();
    if (!user || user.rol !== 'Jefe') {
        logout();
    }
    userNameSpan.textContent = user.nombre;
    let currentSolicitudId = null;
    let todasLasSolicitudes = []; // Guardaremos todas las solicitudes aquí para poder buscarlas

    // --- 3. MANEJO DE VISTAS ---
    const showMainView = () => {
        mainView.style.display = 'block';
        detailView.style.display = 'none';
        currentSolicitudId = null;
        rejectReasonGroup.style.display = 'none';
        motivoRechazoTextarea.value = '';
    };
    const showDetailView = () => {
        mainView.style.display = 'none';
        detailView.style.display = 'block';
    };

    // --- 4. RENDERIZADO Y API ---

    // Esta función toma una lista y la "dibuja" en el HTML.
    const renderSolicitudes = (solicitudes) => {
        solicitudesListContainer.innerHTML = '';
        
        const count = solicitudes.filter(s => s.estado === 'Pendiente').length;
        pendingCountSpan.textContent = `(${count})`;

        if (solicitudes.length === 0) {
            solicitudesListContainer.innerHTML = '<p>No se encontraron solicitudes que coincidan con los filtros.</p>';
            return;
        }

        solicitudes.forEach(solicitud => {
            const card = document.createElement('article');
            card.className = 'solicitud-card';
            card.style.cursor = 'pointer';
            card.addEventListener('click', () => showDetail(solicitud));
            
            card.innerHTML = `
                <div class="card-header">
                    <h3>Téc: ${solicitud.nombreTecnico || solicitud.tecnicoCIN}</h3>
                    <span class="status status-${solicitud.estado.toLowerCase()}">${solicitud.estado}</span>
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
    
    // Muestra los detalles de una solicitud específica
    const showDetail = (solicitud) => {
        if (!solicitud) {
            console.error('Se intentó mostrar el detalle de una solicitud inválida.');
            return;
        }
        
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
        
        // Lógica para mostrar u ocultar los botones de acción
        if (solicitud.estado === 'Pendiente') {
            actionFooter.style.display = 'block';
        } else {
            actionFooter.style.display = 'none';
        }

        showDetailView();
    };

    // Pide las solicitudes a la API según el estado
    const fetchSolicitudes = async (status = 'Pendiente') => {
        solicitudesListContainer.innerHTML = '<p>Cargando...</p>';
        try {
            const response = await authFetch(`/solicitudes?estado=${status}`);
            if (!response.ok) throw new Error('Error al obtener solicitudes.');
            
            todasLasSolicitudes = await response.json();
            renderSolicitudes(todasLasSolicitudes);
            
        } catch (error) {
            solicitudesListContainer.innerHTML = `<p style="color: red;">${error.message}</p>`;
        }
    };
    
    // Maneja las decisiones de aprobar o rechazar
    const handleDecision = async (action) => {
        try {
            const options = {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: action === 'rechazar' 
                    ? JSON.stringify({ motivoRechazo: motivoRechazoTextarea.value }) 
                    : undefined,
            };

            const response = await authFetch(`/solicitudes/${currentSolicitudId}/${action}`, options);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `No se pudo ${action} la solicitud.`);
            }
            alert(`¡Solicitud ${action === 'aprobar' ? 'aprobada' : 'rechazada'} con éxito!`);
            showMainView();
            fetchSolicitudes('Pendiente');
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    };
    
    // --- 5. EVENT LISTENERS ---
    logoutBtn.addEventListener('click', logout);
    backToMainViewBtn.addEventListener('click', showMainView);
    approveBtn.addEventListener('click', () => handleDecision('aprobar'));
    rejectBtn.addEventListener('click', () => {
        if (rejectReasonGroup.style.display === 'none') {
            rejectReasonGroup.style.display = 'block';
        } else {
            handleDecision('rechazar');
        }
    });

    // Lógica para los botones de filtro
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            searchBar.value = '';
            const status = button.dataset.status;
            fetchSolicitudes(status);
        });
    });

    // Lógica para el buscador (filtrando solo por OM)
    searchBar.addEventListener('input', () => {
        const searchTerm = searchBar.value;

        if (searchTerm === '') {
            renderSolicitudes(todasLasSolicitudes);
            return;
        }

        const solicitudesFiltradas = todasLasSolicitudes.filter(solicitud => {
            const numeroOMComoString = String(solicitud.numeroOM);
            return numeroOMComoString.includes(searchTerm);
        });
        
        renderSolicitudes(solicitudesFiltradas);
    });

    // --- 6. INICIALIZACIÓN ---
    showMainView();
    fetchSolicitudes('Pendiente'); // Cargamos las pendientes por defecto al iniciar
});