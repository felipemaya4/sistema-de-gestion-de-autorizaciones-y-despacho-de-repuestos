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
    const filterButtons = document.querySelectorAll('.filter-btn');
    const searchBar = document.getElementById('search-bar');

    // --- 2. ESTADO DE LA APLICACIÓN ---
    const user = getUserInfo();
    if (!user || user.rol !== 'Técnico') {
        logout();
    }
    userNameSpan.textContent = user.nombre;
    let todasLasSolicitudes = []; // Guardaremos las solicitudes para la búsqueda local

    // --- 3. MANEJO DE VISTAS ---
    const showMainView = () => {
        mainView.style.display = 'block';
        newRequestView.style.display = 'none';
    };

    const showNewRequestView = () => {
        mainView.style.display = 'none';
        newRequestView.style.display = 'block';
        cargarJefes();
    };

    // --- 4. RENDERIZADO Y API ---
    const cargarJefes = async () => {
        try {
            const response = await authFetch('/usuarios/jefes');
            if (!response.ok) {
                throw new Error('No se pudo cargar la lista de jefes.');
            }
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

    const renderSolicitudes = (solicitudes) => {
        solicitudesListContainer.innerHTML = '';
        if (solicitudes.length === 0) {
            solicitudesListContainer.innerHTML = '<p>No se encontraron solicitudes que coincidan con los filtros.</p>';
            return;
        }

        solicitudes.forEach(solicitud => {
            const card = document.createElement('article');
            card.className = 'solicitud-card';
            card.innerHTML = `
                <div class="card-header">
                    <h3>OM: ${solicitud.numeroOM}</h3>
                    <span class="status status-${solicitud.estado.toLowerCase()}">${solicitud.estado}</span>
                </div>
                <div class="card-body">
                    <p><strong>Monto:</strong> $${new Intl.NumberFormat('es-CO').format(solicitud.monto)}</p>
                    <p><strong>Descripción:</strong> ${solicitud.descripcion}</p>
                    <p><strong>Fecha:</strong> ${new Date(solicitud.fechaCreacion).toLocaleDateString('es-CO')}</p>
                </div>
            `;
            solicitudesListContainer.appendChild(card);
        });
    };

    const fetchSolicitudes = async (status = '') => {
        solicitudesListContainer.innerHTML = '<p>Cargando solicitudes...</p>';
        try {
            const response = await authFetch(`/solicitudes?rol=tecnico&id=${user.cin}&estado=${status}`);
            if (!response.ok) throw new Error('Error al cargar solicitudes.');
            
            todasLasSolicitudes = await response.json();
            renderSolicitudes(todasLasSolicitudes);
            
        } catch (error) {
            solicitudesListContainer.innerHTML = `<p style="color: red;">${error.message}</p>`;
        }
    };

    const handleFormSubmit = async (event) => {
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
            fetchSolicitudes(''); // Recargamos todas las solicitudes
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    };

    // --- 5. EVENT LISTENERS ---
    logoutBtn.addEventListener('click', logout);
    showNewRequestFormBtn.addEventListener('click', showNewRequestView);
    backToMainViewBtn.addEventListener('click', showMainView);
    newRequestForm.addEventListener('submit', handleFormSubmit);

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            searchBar.value = '';
            const status = button.dataset.status;
            fetchSolicitudes(status);
        });
    });

    searchBar.addEventListener('input', () => {
        const searchTerm = searchBar.value.toLowerCase();
        
        const solicitudesFiltradas = todasLasSolicitudes.filter(solicitud => {
            const textoBusqueda = `
                ${solicitud.numeroOM} 
                ${solicitud.descripcion}`.toLowerCase();
            return textoBusqueda.includes(searchTerm);
        });
        
        renderSolicitudes(solicitudesFiltradas);
    });

    // --- 6. INICIALIZACIÓN ---
    showMainView();
    fetchSolicitudes(''); // Cargamos 'Todas' las solicitudes por defecto al iniciar
});