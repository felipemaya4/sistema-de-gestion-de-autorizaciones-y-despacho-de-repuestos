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
    const searchBar = document.getElementById('search-bar');

    // --- 2. ESTADO DE LA APLICACIÓN ---
    const user = getUserInfo();
    if (!user || user.rol !== 'Almacenista') {
        logout();
    }
    userNameSpan.textContent = user.nombre;
    let currentSolicitudId = null;
    let todasLasSolicitudes = []; // Guardaremos las solicitudes para la búsqueda
    let currentStatusFilter = 'Aprobada';

    // --- 3. MANEJO DE VISTAS ---
    const showMainView = () => {
        mainView.style.display = 'block';
        dispatchView.style.display = 'none';
        currentSolicitudId = null;
    };
    const showDispatchView = () => {
        mainView.style.display = 'none';
        dispatchView.style.display = 'block';
    };

    // --- 4. RENDERIZADO Y API ---

    const renderSolicitudes = (solicitudes) => {
        solicitudesListContainer.innerHTML = '';
        if (solicitudes.length === 0) {
            solicitudesListContainer.innerHTML = `<p>No se encontraron solicitudes que coincidan con los filtros.</p>`;
            return;
        }

        solicitudes.forEach(solicitud => {
            const card = document.createElement('article');
            card.className = 'solicitud-card';
            
            if (solicitud.estado === 'Aprobada') {
                card.style.cursor = 'pointer';
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
    
    const showDetailForDispatch = (solicitud) => {
        if (!solicitud) return;
        
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
        observacionTextarea.value = '';
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
            
            todasLasSolicitudes = await response.json();
            renderSolicitudes(todasLasSolicitudes);
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
        btn.addEventListener('click', () => {
            searchBar.value = '';
            fetchSolicitudes(btn.dataset.status);
        });
    });

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
    fetchSolicitudes('Aprobada');
});