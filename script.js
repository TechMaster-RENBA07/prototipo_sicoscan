let html5QrCode;
let isInventoryFlow = false;
let historialMovimientos = [];
let codigoTemporal = "";

// --- FUNCIONES DE NOTIFICACIÓN PERSONALIZADA ---

function showNotification(icon, title, message, callback) {
    document.getElementById('modal-icon').innerText = icon;
    document.getElementById('modal-title').innerText = title;
    document.getElementById('modal-message').innerText = message;
    
    const modal = document.getElementById('custom-modal');
    modal.style.display = 'flex';
    
    // Guardamos la función a ejecutar cuando cierren el modal
    modal.callback = callback;
}

function closeCustomModal() {
    const modal = document.getElementById('custom-modal');
    modal.style.display = 'none';
    if (modal.callback) modal.callback();
}

// --- LÓGICA DE INTERFAZ RESPONSIVA ---

// Función principal para ocultar/mostrar panel (Toggle)
function toggleSidebar() {
    const sidebar = document.getElementById('main-sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    
    // Detectar si estamos en móvil (< 992px)
    const isMobile = window.innerWidth <= 992;

    if (isMobile) {
        // En móvil usamos la clase .active y la superposición oscura
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
    } else {
        // En PC usamos la clase .collapsed para mover el margen del contenido
        sidebar.classList.toggle('collapsed');
    }
}

// Función auxiliar para cerrar menú al hacer clic en una opción (solo móvil)
function closeSidebarMobile() {
    if (window.innerWidth <= 992) {
        const sidebar = document.getElementById('main-sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    }
}

            function goToDashboard() {
                // 1. Apagar cámara si está encendida antes de volver (Seguridad)
                if (html5QrCode && html5QrCode.isScanning) {
                    html5QrCode.stop().then(() => {
                        console.log("Cámara apagada al volver al inicio");
                    });
                }

                // 2. Oculta el menú de opciones de la sidebar
                document.querySelector('.nav-menu').style.display = 'none';
                
                // 3. Muestra el Dashboard
                showView('view-dashboard');
                document.body.classList.remove('ajuste-mobile-mode');
            }


// --- NAVEGACIÓN Y FUNCIONES (Mantenidas) ---
// --- LOGUEO Y PASO INTERMEDIO ---
function handleLogin() {
    const user = document.getElementById('user').value;
    
    if (user.trim() === "") {
        alert("Por favor ingrese su usuario");
        return;
    }

    // 1. Guardamos el nombre del usuario (pero aún no entramos a la app)
    document.getElementById('user-display-name').innerText = user.toUpperCase();

    // 2. DISPARADOR CRÍTICO: En lugar de ir al dashboard, abrimos el modal
    openBranchModal();
    
    // Opcional: Ocultar el login para que el modal se vea sobre un fondo neutro
    document.getElementById('screen-login').style.display = 'none';
}

// --- SELECCIÓN DE SUCURSAL (EL VERDADERO ACCESO) ---
function selectBranch(branchName) {
    // 1. Inyectamos la sucursal seleccionada en la cabecera
    document.getElementById('current-branch-name').innerText = branchName;

    // 2. Cerramos el modal de sucursales
    closeBranchModal();

    // 3. AHORA SÍ: Mostramos el contenedor principal de la App
    document.getElementById('app-main').style.display = 'flex';
    
    // 4. Cargamos el Dashboard inicial
    goToDashboard(); 

    // 5. Ajuste móvil si es necesario
    if(window.innerWidth <= 992) {
        document.getElementById('main-sidebar').classList.add('collapsed');
    }
}


// Función para abrir el módulo desde el Dashboard o Sidebar
function showConsultarStockView() {
    // 1. Mostrar la vista primero
    showView('view-scan-init');
    
    // 2. Iniciar cámara automática (RF01)
    setTimeout(() => {
        iniciarCamaraConsulta();
    }, 150);
}

function iniciarCamaraConsulta() {
    // Si ya existe una instancia, la detenemos antes de crear otra
    if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().then(() => iniciarLectorConsulta());
    } else {
        iniciarLectorConsulta();
    }
}

function iniciarLectorConsulta() {
    html5QrCode = new Html5Qrcode("reader-auto");
    html5QrCode.start(
        { facingMode: "environment" }, 
        { fps: 10, qrbox: 250 },
        (decodedText) => {
            // Al detectar, inyectamos en el input manual y buscamos
            document.getElementById('manual-code').value = decodedText;
            mockSearch(); 
        }
    ).catch(err => console.warn("Aviso: Cámara no iniciada o ya en uso.", err));
}

function logout() { location.reload(); }

function openModule(moduleType) {
    // 1. Mostrar las opciones en la barra lateral
    document.querySelector('.nav-menu').style.display = 'block';
    
    // 2. Redirección ESTRICTA
    if (moduleType === 'stock') {
        showView('view-scan-init'); 
    } else if (moduleType === 'inventario') {
        showView('step-1-creacion');
    } else if (moduleType === 'ajuste') {
        showView('view-ajuste-almacen');
        renderTablaAjuste();
    } else if (moduleType === 'movimiento') { 
        showView('view-movimiento-almacen');
        renderTablaMovimiento();
        renderHistorialMovimiento();
    }
}

                            // Función para entrar a la fase de conteo (Desde Fase 1 o Sidebar)
    function irAFaseConteo() {
                                showView('step-2-conteo');
                                
                                // Iniciar cámara automática para inventario
                                html5QrCode = new Html5Qrcode("reader-inventory");
                                html5QrCode.start(
                                    { facingMode: "environment" }, 
                                    { fps: 10, qrbox: 250 },
                                    (decodedText) => {
                                        // Al detectar, ponemos el código en el input y preguntamos lote
                                        document.getElementById('inv-manual-code').value = decodedText;
                                        manualInventoryEntry(); // Llama a la lógica de lote que ya tienes
                                    }
                                ).catch(err => console.error("Error cámara inventario:", err));
                            }


// Función maestra para cambiar de pantalla sin errores
function showView(viewId) {
    // CORRECCIÓN: Incluir 'view-movimiento-almacen' para que mantenga el diseño móvil
    const isMobileMode = (viewId === 'view-ajuste-almacen' || viewId === 'view-movimiento-almacen');
    document.body.classList.toggle('ajuste-mobile-mode', isMobileMode);

    // 1. APAGADO DE SEGURIDAD: Si hay una cámara activa, la matamos antes de cambiar de vista
    if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().then(() => {
            console.log("Recurso de cámara liberado exitosamente.");
        }).catch(err => console.warn("Error al detener cámara:", err));
    }

    // CORRECCIÓN: Agregar 'view-movimiento-almacen' a la lista de vistas
    const allViews = [
        'view-dashboard', 'view-scan-init', 'step-1-creacion', 
        'step-2-conteo', 'step-3-cierre', 'view-results', 'view-inventory-history',
        'view-ajuste-almacen', 'view-movimiento-almacen' // <-- Faltaba esta
    ];
    
    allViews.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = (id === viewId) ? 'block' : 'none';
    });
}

// --- TOGGLE DE ENTRADA MANUAL ---
function toggleManualInput() {
    const container = document.getElementById('manual-input-container');
    const btnTrigger = document.getElementById('btn-show-manual');

    if (container.style.display === 'none') {
        container.style.display = 'block';
        btnTrigger.innerText = 'Ocultar entrada manual';
    } else {
        container.style.display = 'none';
        btnTrigger.innerText = 'O ingresar código manualmente';
    }
}

// --- ESCÁNER ---
function startCamera() {
    document.getElementById('view-scan-init').style.display = 'none';
    document.getElementById('view-camera-active').style.display = 'block';

    html5QrCode = new Html5Qrcode("reader");
    html5QrCode.start(
        { facingMode: "environment" }, 
        { fps: 10, qrbox: 250 },
        (decodedText) => { processScan(decodedText); }
    ).catch(err => alert("Error de cámara: " + err));
}

function stopCamera() {
    if(html5QrCode) {
        html5QrCode.stop().then(() => {
            if (isInventoryFlow) {
                showInventoryInit();
                isInventoryFlow = false;
            } else {
                showConsultarStockView();
            }
        });
    }
}

// --- FUNCIONES ESPECÍFICAS PARA CÁMARA DE INVENTARIO ---

function startInventoryCamera() {
    // 1. Ocultar el botón de escanear inicial
    document.getElementById('inventory-scan-init').style.display = 'none';
    
    // 2. Mostrar el contenedor de la cámara debajo del título
    document.getElementById('inventory-camera-container').style.display = 'block';

    // 3. Iniciar la librería en el nuevo contenedor
    html5QrCode = new Html5Qrcode("reader-inventory");
    html5QrCode.start(
        { facingMode: "environment" }, 
        { fps: 10, qrbox: 250 },
        (decodedText) => {
            // Al detectar código, detenemos cámara y procesamos
            stopInventoryCamera();
            document.getElementById('inv-manual-code').value = decodedText;
            showNotification('📦', 'Producto Identificado', 'Código: ' + decodedText);
        }
    ).catch(err => {
        showNotification('⚠️', 'Error de Cámara', 'Error: ' + err, function() {
            stopInventoryCamera(); // Revertir interfaz si falla
        });
    });
}

function stopInventoryCamera() {
    if (html5QrCode) {
        html5QrCode.stop().then(() => {
            document.getElementById('inventory-camera-container').style.display = 'none';
            document.getElementById('inventory-scan-init').style.display = 'block';
        });
    }
}

function confirmarGuardadoLote() {
    const inputQty = document.getElementById('input-lote-qty');
    const cantidad = parseInt(inputQty.value);

    // 1. VALIDACIÓN DE CANTIDAD (RF06)
    if (isNaN(cantidad) || cantidad < 1) {
        showNotification('⚠️', 'Cantidad Inválida', 'Debe ingresar al menos 1 unidad.');
        return; // Detiene la ejecucióng
    }

    // 2. VALIDACIÓN DE EXISTENCIA (Seguridad Extra)
    // Usamos la variable codigoTemporal que guardamos al escanear
    if (!productosBD[codigoTemporal]) {
        showNotification('❌', 'Error de Registro', 'El producto ya no se encuentra en la base de datos.');
        closeLoteModal();
        return; // Detiene la ejecución, NO llega al console.log de éxito
    }

    // 3. REGISTRO DE MOVIMIENTO (RF07) - Solo ocurre si pasó las validaciones anteriores
    const nuevoRegistro = {
        usuario: document.getElementById('user-display-name').innerText,
        fecha: new Date().toLocaleDateString(),
        hora: new Date().toLocaleTimeString(),
        sucursal: document.getElementById('current-branch-name').innerText,
        producto: productosBD[codigoTemporal].nombre,
        cantidad: cantidad,
        tipo: "CONTEO POR LOTE"
    };

    // AHORA SÍ: El log de éxito solo sale si todo está bien
    console.log("Movimiento Registrado con éxito:", nuevoRegistro);
    
    // Guardar en el historial para el reporte (RF08)
    historialMovimientos.push(nuevoRegistro);

    // 4. Limpieza de interfaz
    closeLoteModal();
    document.getElementById('inv-manual-code').value = "";
    
    showNotification('✅', 'Guardado', `Se registraron ${cantidad} unidades de ${nuevoRegistro.producto}`);
}

function closeLoteModal() {
    document.getElementById('modal-lote').style.display = 'none';
    codigoTemporal = "";
}

function processScan(code) {
    html5QrCode.stop().then(() => {
        if (isInventoryFlow) {
            showInventoryResults(code);
        } else {
            showResults(code);
        }
    });
}

// --- BÚSQUEDA Y RESULTADOS ---
const productosBD = {
    "1010": { nombre: "Laptop Lenovo IdeaPad", stock: 5, precio: "2,450.00" },
    "3030": { nombre: "Monitor Samsung 24\"", stock: 0, precio: "580.00" }
};

function mockSearch() {
    const code = document.getElementById('manual-code').value;
    
    // Supongamos que tienes un objeto con los datos (Simulación de BD)
    const productosBD = {
        "1010": {
            nombre: "Laptop Lenovo IdeaPad",
            stock: 5,
            precio: "2,450.00",
            imagen: "lenovo.jpeg" // Ruta de la imagen
        }
    };

    const producto = productosBD[code];

    if (producto) {
        document.getElementById('res-name').innerText = producto.nombre;
        document.getElementById('res-code').innerText = code;
        document.getElementById('res-stock').innerText = producto.stock + " unidades";
        document.getElementById('res-price').innerText = producto.precio;
        
        // Lógica para la imagen
        const imgEl = document.getElementById('res-image');
        const placeholder = document.getElementById('no-image-text');
        
        if (producto.imagen) {
            imgEl.src = producto.imagen;
            imgEl.style.display = 'block';
            placeholder.style.display = 'none';
        } else {
            imgEl.style.display = 'none';
            placeholder.style.display = 'block';
        }

        showView('view-results');
    } else {
        showNotification('❌', 'No encontrado', 'El código no existe en el sistema.');
    }
}


function showResults(code) {
    const p = productosBD[code] || { nombre: "Producto No Encontrado", stock: 0, precio: "0.00" };
    
    document.getElementById('res-name').innerText = p.nombre;
    document.getElementById('res-code').innerText = code;
    document.getElementById('res-stock').innerText = p.stock + " unidades";
    document.getElementById('res-price').innerText = p.precio;

    // Cambiar vista
    document.getElementById('view-scan-init').style.display = 'none';
    document.getElementById('view-camera-active').style.display = 'none';
    document.getElementById('view-results').style.display = 'block';
}

// --- NAVEGACIÓN DE INVENTARIO ---

function showInventoryInit() {
    // Ocultar todo y mostrar Paso 1 (Creación)
    hideAllViews();
    document.getElementById('step-1-creacion').style.display = 'block';
}

// --- AJUSTE DE ALMACÉN ---
const productosAjuste = [
    { id: 30, nombre: 'ARROZ', codigo: '', medida: 'KILOGRAMO', precio: '0.00', stock: 0, real: 0 },
    { id: 14, nombre: 'ARROZ CON MARISCOS', codigo: '7200140000004', medida: 'UNIDAD', precio: '29.50', stock: 0, real: 0 },
    { id: 34, nombre: 'CEBOLLA', codigo: '', medida: 'KILOGRAMO', precio: '0.00', stock: 9.975, real: 9.975 },
    { id: -1, nombre: 'COCA-COLA ZERO SUGAR', codigo: '7400010000008', medida: 'UNIDAD', precio: '9.00', stock: 97, real: 97 },
    { id: 33, nombre: 'CULANTRO', codigo: '', medida: 'KILOGRAMO', precio: '0.00', stock: 9.98, real: 9.98 },
    { id: 19, nombre: 'ENSALADA CESAR CON POLLO', codigo: '7300190000006', medida: 'UNIDAD', precio: '18.90', stock: 10, real: 10 },
    { id: -42, nombre: 'GASEOSA FAMILIAR 1.5 L', codigo: '7700420000002', medida: 'UNIDAD', precio: '10.00', stock: 59, real: 59 },
    { id: 31, nombre: 'GUARANÁ', codigo: '', medida: 'UNIDAD', precio: '0.00', stock: 0, real: 0 },
    { id: -54, nombre: 'PEPSI', codigo: '', medida: 'UNIDAD', precio: '5.00', stock: 10, real: 10 },
    { id: 20, nombre: 'PIZZA MARGARITA PERSONAL', codigo: '7300200000002', medida: 'UNIDAD', precio: '24.00', stock: 10, real: 10 }
];

let paginaAjuste = 1;
let tamanoPaginaAjuste = 10;

function obtenerProductosFiltradosAjuste() {
    const texto = (document.getElementById('ajuste-busqueda')?.value || '').trim().toLowerCase();
    const descripcion = ((document.getElementById('ajuste-descripcion')?.value || '') || (document.getElementById('ajuste-busqueda-mobile')?.value || '')).trim().toLowerCase();
    const codigo = (document.getElementById('ajuste-codigo')?.value || '').trim().toLowerCase();
    const id = (document.getElementById('ajuste-id')?.value || '').trim().toLowerCase();

    return productosAjuste.filter(producto => {
        const coincideTexto = !texto || [producto.nombre, producto.codigo, producto.id].join(' ').toLowerCase().includes(texto);
        const coincideDescripcion = !descripcion || producto.nombre.toLowerCase().includes(descripcion);
        const coincideCodigo = !codigo || producto.codigo.toLowerCase().includes(codigo);
        const coincideId = !id || String(producto.id).includes(id);
        return coincideTexto && coincideDescripcion && coincideCodigo && coincideId;
    });
}

function renderTablaAjuste() {
    const body = document.getElementById('ajuste-table-body');
    const pagination = document.getElementById('ajuste-paginacion');
    const totalLabel = document.getElementById('ajuste-registros');
    const mobileList = document.getElementById('ajuste-mobile-lista');
    const mobileSearch = document.getElementById('ajuste-busqueda-mobile');
    if (!body || !pagination) return;

    const resultados = obtenerProductosFiltradosAjuste();
    const paginas = Math.max(1, Math.ceil(resultados.length / tamanoPaginaAjuste));
    paginaAjuste = Math.min(paginaAjuste, paginas);
    const inicio = (paginaAjuste - 1) * tamanoPaginaAjuste;
    const visibles = resultados.slice(inicio, inicio + tamanoPaginaAjuste);

    body.innerHTML = visibles.map(producto => `
        <tr>
            <td>${producto.id}</td>
            <td>${producto.nombre}</td>
            <td>${producto.codigo}</td>
            <td>${producto.medida}</td>
            <td>${producto.precio}</td>
            <td>${producto.stock}</td>
            <td><input class="ajuste-real-input" type="number" min="0" step="0.001" value="${producto.real}" onchange="actualizarCantidadAjuste(${producto.id}, this.value)"></td>
        </tr>
    `).join('');

    pagination.innerHTML = `<button onclick="cambiarPaginaAjuste(-1)" ${paginaAjuste === 1 ? 'disabled' : ''}>«</button>`;
    for (let numero = 1; numero <= paginas; numero += 1) {
        pagination.innerHTML += `<button class="${numero === paginaAjuste ? 'active' : ''}" onclick="irPaginaAjuste(${numero})">${numero}</button>`;
    }
    pagination.innerHTML += `<button onclick="cambiarPaginaAjuste(1)" ${paginaAjuste === paginas ? 'disabled' : ''}>»</button>`;
    totalLabel.innerText = `${resultados.length} registros`;

    if (mobileList) {
        const mobileQuery = (mobileSearch?.value || '').trim().toLowerCase();
        const mobileResults = resultados.filter(producto =>
            !mobileQuery || [producto.nombre, producto.codigo, producto.id].join(' ').toLowerCase().includes(mobileQuery)
        );
        const paginasMobile = Math.max(1, Math.ceil(mobileResults.length / tamanoPaginaAjuste));
        const inicioMobile = (paginaAjuste - 1) * tamanoPaginaAjuste;
        const visiblesMobile = mobileResults.slice(inicioMobile, inicioMobile + tamanoPaginaAjuste);
        mobileList.innerHTML = visiblesMobile.map(producto => `
            <tr>
                <td>${producto.id}</td>
                <td class="m-name-cell">${producto.nombre}</td>
                <td>${producto.medida}</td>
                <td>${producto.stock}</td>
                <td><input type="number" class="m-input-real-table" min="0" step="0.001" value="${producto.real}" onchange="actualizarCantidadAjuste(${producto.id}, this.value)"></td>
            </tr>
        `).join('');
        const mobileTotal = document.getElementById('ajuste-mobile-registros');
        if (mobileTotal) mobileTotal.innerText = `${mobileResults.length} registros`;
        const mobilePagination = document.getElementById('ajuste-mobile-paginacion');
        if (mobilePagination) {
            mobilePagination.innerHTML = `<button type="button" onclick="cambiarPaginaAjuste(-1)" ${paginaAjuste === 1 ? 'disabled' : ''}>‹</button><button type="button" class="active">${paginaAjuste}</button><button type="button" onclick="cambiarPaginaAjuste(1)" ${paginaAjuste === paginasMobile ? 'disabled' : ''}>›</button>`;
        }
    }
}

function actualizarCantidadAjuste(id, valor) {
    const producto = productosAjuste.find(item => item.id === id);
    if (producto) producto.real = Number(valor) || 0;
}

function cambiarPaginaAjuste(direccion) {
    paginaAjuste += direccion;
    renderTablaAjuste();
}

function irPaginaAjuste(numero) {
    paginaAjuste = numero;
    renderTablaAjuste();
}

function cambiarTamanoAjuste() {
    const pageSize = document.getElementById('m-page-size') || document.getElementById('ajuste-page-size');
    tamanoPaginaAjuste = Number(pageSize.value);
    paginaAjuste = 1;
    renderTablaAjuste();
}

function limpiarListaAjustes() {
    ['ajuste-busqueda', 'ajuste-busqueda-mobile', 'ajuste-descripcion', 'ajuste-codigo', 'ajuste-id'].forEach(id => {
        const input = document.getElementById(id);
        if (input) input.value = '';
    });
    paginaAjuste = 1;
    renderTablaAjuste();
}

function toggleFiltrosAvanzados() {
    const panel = document.getElementById('panel-filtros-avanzados');
    if (panel) panel.classList.toggle('is-open');
}

function toggleMenuReporte() {
    const menu = document.getElementById('ajuste-menu-reporte');
    if (menu) menu.classList.toggle('is-open');
}

function toggleReportMenu(event) {
    if (event) event.stopPropagation();
    const menu = document.getElementById('report-floating-menu');
    if (menu) menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
}

function buscarProductoAjuste() {
    paginaAjuste = 1;
    renderTablaAjuste();
}

function guardarDatosAjuste() {
    const productosConCambios = productosAjuste.filter(producto => producto.real !== producto.stock);
    productosConCambios.forEach(producto => {
        producto.stock = producto.real;
    });
    productosConCambios.forEach(producto => {
        historialMovimientos.push({
            usuario: document.getElementById('user-display-name').innerText,
            fecha: new Date().toLocaleDateString(),
            hora: new Date().toLocaleTimeString(),
            almacen: document.getElementById('ajuste-almacen-mobile')?.value || document.getElementById('ajuste-almacen').value,
            producto: producto.nombre,
            cantidad: producto.real,
            tipo: 'AJUSTE DE ALMACÉN'
        });
    });
    renderTablaAjuste();
    const cambios = productosConCambios.length;
    showNotification('✓', 'Datos guardados', `${cambios} producto(s) con diferencias fueron guardados correctamente.`);
}

function guardarAjusteMovil(button, id) {
    const producto = productosAjuste.find(item => item.id === id);
    if (!producto) return;
    button.classList.add('saved');
    button.innerText = 'Listo';
    producto.guardado = true;
    setTimeout(() => {
        button.classList.remove('saved');
        button.innerText = 'Guardar';
    }, 1500);
}

function exportarAjuste(formato) {
    showNotification('✓', 'Exportación preparada', `El archivo ${formato.toUpperCase()} del ajuste está listo para generarse.`);
}

function cambiarPeriodoAjuste(direccion) {
    showNotification('↔', 'Cambio de periodo', direccion > 0 ? 'Se mostraría el siguiente inventario.' : 'Se mostraría el inventario anterior.');
}

function startInventoryScan() {
    // RF02: Validar que se seleccionó sucursal/almacén antes de escanear
    const suc = document.getElementById('inv-sucursal').value;
    const alm = document.getElementById('inv-almacen').value;
    
    // Aquí usamos tu función de cámara existente pero con un flag para saber que es inventario
    isInventoryFlow = true; 
    startCamera(); 
}

function showInventoryResults(code) {
    const p = productosBD[code] || { nombre: "Producto No Encontrado", stock: 0 };
    
    document.getElementById('inv-res-name').innerText = p.nombre;
    document.getElementById('inv-res-stock').innerText = p.stock;

    // Cambiar vista
    hideAllViews();
    document.getElementById('view-inventory-adjust').style.display = 'block';
}

function saveInventoryMove() {
    const qty = parseInt(document.getElementById('inv-qty').value);
    const tipoMov = document.getElementById('inv-type').value; // "suma" o "resta"
    
    // RF06: Validación básica
    if (isNaN(qty) || qty <= 0) {
        alert("⚠️ Ingrese una cantidad válida mayor a 0");
        return;
    }

    // RF07: Registro completo de movimiento 
    const nuevoMovimiento = {
        usuario: document.getElementById('user-display-name').innerText,
        fecha: new Date().toLocaleDateString(),
        hora: new Date().toLocaleTimeString(),
        sucursal: document.getElementById('inv-sucursal').value,
        almacen: document.getElementById('inv-almacen').value,
        producto: document.getElementById('inv-res-name').innerText,
        cantidad: qty,
        tipo: tipoMov === 'suma' ? 'AUMENTO' : 'DISMINUCIÓN'
    };

    // Guardar en el array (Simulación de BD)
    historialMovimientos.push(nuevoMovimiento);

    // Mostrar confirmación detallada
    console.log("Movimiento Registrado:", nuevoMovimiento);
    alert(`✅ MOVIMIENTO REGISTRADO\n\n` +
          `Producto: ${nuevoMovimiento.producto}\n` +
          `Tipo: ${nuevoMovimiento.tipo}\n` +
          `Cantidad: ${nuevoMovimiento.cantidad}\n` +
          `Almacén: ${nuevoMovimiento.almacen}`);

    showInventoryInit(); // Regresar al inicio
}

// Auxiliar para limpiar la pantalla central
function hideAllViews() {
    const views = ['view-scan-init', 'view-camera-active', 'view-results', 'step-1-creacion', 'step-2-conteo', 'step-3-cierre'];
    views.forEach(v => {
        const el = document.getElementById(v);
        if(el) el.style.display = 'none';
    });
}

function manualInventoryEntry() {
    const code = document.getElementById('inv-manual-code').value.trim();
    
    // 1. Validación de campo vacío
    if (code === "") {
        showNotification('⚠️', 'Atención', 'Ingrese o escanee un código primero');
        return;
    }

    // 2. Validación de existencia en Base de Datos (Simulada)
    // Buscamos si el código existe como llave en nuestro objeto de productos
    if (!productosBD[code]) {
        // Si no existe, mostramos error y no abrimos el modal de lote
        showNotification('❌', 'Producto no registrado', `El código "${code}" no corresponde a ningún producto en el sistema.`);
        
        // Limpiamos el input para facilitar el re-escaneo
        document.getElementById('inv-manual-code').value = "";
        document.getElementById('inv-manual-code').focus();
        return;
    }

    // 3. Si el producto existe, continuamos con el flujo normal
    const nombreProducto = productosBD[code].nombre;
    
    codigoTemporal = code;
    document.getElementById('lote-product-name').innerText = nombreProducto;
    document.getElementById('input-lote-qty').value = 1;
    document.getElementById('modal-lote').style.display = 'flex';
}

// --- FASE 1: CREACIÓN DE TOMA DE INVENTARIO ---
function initInventoryProcess() {
    const sucursal = document.getElementById('inv-sucursal').value;
    const almacen = document.getElementById('inv-almacen').value;
    
    if (!sucursal || !almacen) {
        alert("Por favor seleccione sucursal y almacén");
        return;
    }
    
    alert(`✅ Toma de Inventario Iniciada\n\nSucursal: ${sucursal}\nAlmacén: ${almacen}\n\nEstado: ABIERTO`);
    showInventoryInit();
}

// --- REGISTRO DE MOVIMIENTO (RF07) ---
// Simulación de Registro de Movimiento (RF07)
function registrarConteo(producto, cantidadLeida) {
    const movimiento = {
        usuario: document.getElementById('user-display-name').innerText, // 
        fecha: new Date().toLocaleDateString(), 
        hora: new Date().toLocaleTimeString(),
        sucursal: document.getElementById('inv-sucursal').value,
        almacen: document.getElementById('inv-almacen').value,
        producto: producto.nombre,
        cantidad: cantidadLeida,
        tipo: "AJUSTE POR CONTEO" // 
    };
    
    // Aquí se enviaría a PostgreSQL (RF03) 
    console.log("Movimiento guardado:", movimiento);
    alert(`Producto: ${movimiento.producto}\nStock Actualizado: ${movimiento.cantidad} [cite: 220, 221]`);
}

// --- FUNCIONES DE NAVEGACIÓN DEL FLUJO ---

// Función para pasar de Fase 1 (Creación) a Fase 2 (Conteo)
            function pasarAConteo() {
                // 1. Mostrar la notificación que ya teníamos
                showNotification('✅', 'Inventario Iniciado', 'Estado: ABIERTO', function() {
                    
                    // 2. CAMBIO CRÍTICO: Primero hacemos visible la vista
                    showView('step-2-conteo'); 
                    
                    // 3. Pequeño retardo (ms) para asegurar que el DOM se renderizó
                    setTimeout(() => {
                        iniciarCamaraConteo();
                    }, 100);
                });
            }

            function iniciarCamaraConteo() {
                // Verificamos que el contenedor exista antes de iniciar
                const container = document.getElementById("reader-inventory");
                if (!container) return;

                html5QrCode = new Html5Qrcode("reader-inventory");
                html5QrCode.start(
                    { facingMode: "environment" }, 
                    { fps: 10, qrbox: 250 },
                    (decodedText) => {
                        document.getElementById('inv-manual-code').value = decodedText;
                        manualInventoryEntry(); // Abre el modal de lote que ya tienes
                    }
                ).catch(err => {
                    console.error("Error al iniciar cámara de conteo:", err);
                });
            }

function pasarACierre() {
    // Fase 2 finalizada, pasamos a validación (Fase 3)
    document.getElementById('step-2-conteo').style.display = 'none';
    document.getElementById('step-3-cierre').style.display = 'block';
    showView('step-3-cierre'); // showView apaga la cámara automáticamente
}

function volverAConteo() {
    document.getElementById('step-3-cierre').style.display = 'none';
    document.getElementById('step-2-conteo').style.display = 'block';
}

function generarReporte() {
    // Aquí se calculan diferencias y se genera el PDF/Excel (Fase 3)
    showNotification('📊', 'Reporte Finalizado', 'Reporte generado con éxito. Estado: CERRADO.', function() {
        location.reload(); // Volver al inicio
    });
}

// function selectBranch(branchName) {
//     // Actualiza el texto en la cabecera
//     const display = document.getElementById('current-branch-name');
//     if (display) display.innerText = branchName;
    
//     // Cierra el modal automáticamente
//     closeBranchModal();
    
//     // Opcional: Notificación visual de éxito
//     showNotification('🏠', 'Sucursal Cambiada', 'Ahora en: ' + branchName);
// }

// --- GESTIÓN DEL MODAL DE SUCURSAL ---
function openBranchModal() {
    document.getElementById('modal-branch').style.display = 'flex';
}

function closeBranchModal() {
    document.getElementById('modal-branch').style.display = 'none';
}

// --- HISTORIAL DE TOMAS DE INVENTARIO ---
function showInventoryHistory() {
    // Usamos la función showView que ya limpia las demás pantallas
    showView('view-inventory-history');
}



// Mostrar y ocultar sucursales en el modal
function toggleBranchList(groupId) {
    const list = document.getElementById(groupId);
    
    // Ocultar otras listas abiertas para que parezca un acordeón real (Opcional)
    document.querySelectorAll('.branch-sub-list').forEach(el => {
        if (el.id !== groupId) el.style.display = 'none';
    });

    // Alternar visibilidad de la seleccionada
    if (list.style.display === 'none' || list.style.display === '') {
        list.style.display = 'block';
    } else {
        list.style.display = 'none';
    }
}



// ==========================================
// --- LÓGICA DEL MÓDULO MOVIMIENTO DE ALMACÉN ---
// ==========================================

// Base de datos simulada para el módulo de movimiento (independiente de Ajuste)
let productosMovimientoBD = [
    { id: 1, nombre: 'ACEITE', codigo: '7100010000007', medida: 'UNIDAD', pCompra: 15.00, pVenta: 20.00, stock: 20 },
    { id: 2, nombre: 'ARROZ', codigo: '', medida: 'UNIDAD', pCompra: 4.00, pVenta: 5.50, stock: 60 },
    { id: 4, nombre: 'REFRIGERADORA LG NO FRONT 250L', codigo: '7200040000005', medida: 'UNIDAD', pCompra: 1000.00, pVenta: 1200.00, stock: 20 },
    { id: 5, nombre: 'REFRIGERADORA SAMSUNG DIGITAL INVERTER 300L', codigo: '', medida: 'UNIDAD', pCompra: 1100.00, pVenta: 1350.00, stock: 11 }
];

let carritoMovimiento = []; // Productos agregados al movimiento actual
let historialMovimientoData = []; // Historial de movimientos guardados

// 1. Inicializar y renderizar la tabla de productos en el formulario
function renderTablaMovimiento() {
    const tbody = document.getElementById('mov-tabla-body');
    if (!tbody) return;

    tbody.innerHTML = carritoMovimiento.map((item, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${item.nombre}</td>
            <td>${item.stock}</td>
            <td>${item.medida}</td>
            <td>
                <input type="number" class="mov-input-cantidad" min="1" value="${item.cantidad}" onchange="actualizarCantidadMovimiento(${item.id}, this.value)">
            </td>
            <td>${item.estado || (Number(item.stock) > 0 ? 'Disponible' : 'Sin stock')}</td>
            <td>${Number(item.pCompra).toFixed(2)}</td>
            <td>${Number(item.pVenta).toFixed(2)}</td>
            <td>${(Number(item.cantidad) * Number(item.pCompra)).toFixed(2)}</td>
            <td>
                <button class="mov-btn-eliminar" onclick="eliminarProductoMovimiento(${item.id})">X</button>
            </td>
        </tr>
    `).join('');

    calcularTotalMovimiento();
}

// 2. Buscar producto y mostrar resultados
function buscarProductoMovimiento() {
    const query = document.getElementById('mov-buscar-producto').value.toLowerCase().trim();
    const resultsContainer = document.getElementById('mov-resultados-busqueda');

    if (query.length < 2) {
        resultsContainer.style.display = 'none';
        return;
    }

    const resultados = productosMovimientoBD.filter(p => 
        p.nombre.toLowerCase().includes(query) || p.codigo.includes(query)
    );

    if (resultados.length > 0) {
        resultsContainer.innerHTML = resultados.map(p => `
            <div class="mov-search-item" onclick="agregarProductoMovimiento(${p.id})">
                <strong>${p.nombre}</strong> <br>
                <small>Cod: ${p.codigo || 'N/A'} | Stock: ${p.stock} ${p.medida}</small>
            </div>
        `).join('');
        resultsContainer.style.display = 'block';
    } else {
        resultsContainer.innerHTML = '<div class="mov-search-item">No se encontraron resultados</div>';
        resultsContainer.style.display = 'block';
    }
}

// 3. Agregar producto al carrito del movimiento
function agregarProductoMovimiento(id) {
    const producto = productosMovimientoBD.find(p => p.id === id);
    if (!producto) return;

    // Verificar si ya está en el carrito
    const existe = carritoMovimiento.find(item => item.id === id);
    if (existe) {
        existe.cantidad += 1;
    } else {
        carritoMovimiento.push({
            id: producto.id,
            nombre: producto.nombre,
            codigo: producto.codigo,
            medida: producto.medida,
            pCompra: producto.pCompra,
            pVenta: producto.pVenta,
            stock: producto.stock,
            cantidad: 1
        });
    }

    document.getElementById('mov-buscar-producto').value = '';
    document.getElementById('mov-resultados-busqueda').style.display = 'none';
    renderTablaMovimiento();
}

// 4. Actualizar cantidad y recalcular
function actualizarCantidadMovimiento(id, nuevaCantidad) {
    const item = carritoMovimiento.find(p => p.id === id);
    if (item) {
        item.cantidad = parseInt(nuevaCantidad) || 1;
        renderTablaMovimiento();
    }
}

// 5. Eliminar producto del carrito
function eliminarProductoMovimiento(id) {
    carritoMovimiento = carritoMovimiento.filter(p => p.id !== id);
    renderTablaMovimiento();
}

// 6. Calcular totales
function calcularTotalMovimiento() {
    const total = carritoMovimiento.reduce((sum, item) => sum + (item.cantidad * item.pCompra), 0);
    const totalEl = document.getElementById('mov-total-costo');
    if (totalEl) totalEl.innerText = total.toFixed(2);
}

// 7. Limpiar formulario
function limpiarFormularioMovimiento() {
    carritoMovimiento = [];
    document.getElementById('mov-ref-serie').value = '';
    document.getElementById('mov-ref-num').value = '';
    document.getElementById('mov-observaciones').value = '';
    renderTablaMovimiento();
    showNotification('↻', 'Formulario Limpio', 'Se han restablecido los campos y la lista de productos.');
}

// 8. Guardar Movimiento (Actualiza Stock y guarda en historial)
function guardarMovimiento() {
    if (carritoMovimiento.length === 0) {
        showNotification('⚠️', 'Atención', 'Debe agregar al menos un producto al movimiento.');
        return;
    }

    const tipoMov = document.getElementById('mov-tipo-mov').value;
    const tipoOp = document.getElementById('mov-tipo-op').value;
    const almacen = document.getElementById('mov-almacen').value;

    // RF-14: Lógica de Actualización de Stock
    carritoMovimiento.forEach(itemCarrito => {
        const prodBD = productosMovimientoBD.find(p => p.id === itemCarrito.id);
        if (prodBD) {
            if (tipoMov === 'ENTRADA') {
                prodBD.stock += itemCarrito.cantidad;
            } else if (tipoMov === 'SALIDA') {
                prodBD.stock -= itemCarrito.cantidad;
                if (prodBD.stock < 0) prodBD.stock = 0; // Validación de no negativos
            }
        }
    });

    // RF-18 / RF-19: Guardar en Historial
    const nuevoMovimiento = {
        id: historialMovimientoData.length + 1,
        documento: `${document.getElementById('mov-tipo-doc').value} ${document.getElementById('mov-serie').value}-${document.getElementById('mov-numero').value}`,
        fecha: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString(),
        tipo: tipoMov,
        operacion: tipoOp,
        docRef: `${document.getElementById('mov-ref-serie').value}-${document.getElementById('mov-ref-num').value}`,
        observaciones: document.getElementById('mov-observaciones').value || 'Sin observaciones',
        responsable: document.getElementById('user-display-name').innerText,
        almacen: almacen,
        productos: [...carritoMovimiento]
    };

    historialMovimientoData.unshift(nuevoMovimiento); // Agregar al inicio del historial

    // Limpiar y notificar
    showNotification('✅', 'Movimiento Guardado', `Se registró el movimiento de ${tipoMov} correctamente. El stock ha sido actualizado.`);
    limpiarFormularioMovimiento();
    renderHistorialMovimiento();
}

// 9. Cambiar entre pestañas (Registrar / Historial)
function cambiarTabMovimiento(tab) {
    const formTab = document.getElementById('mov-tab-form');
    const histTab = document.getElementById('mov-tab-historial');
    const btnForm = document.getElementById('tab-mov-form');
    const btnHist = document.getElementById('tab-mov-historial');

    if (tab === 'form') {
        formTab.style.display = 'block';
        histTab.style.display = 'none';
        btnForm.classList.add('active');
        btnHist.classList.remove('active');
    } else {
        formTab.style.display = 'none';
        histTab.style.display = 'block';
        btnForm.classList.remove('active');
        btnHist.classList.add('active');
        renderHistorialMovimiento();
    }
}

// 10. Renderizar Historial con filtros
function renderHistorialMovimiento() {
    const tbody = document.getElementById('mov-historial-body');
    if (!tbody) return;

    const desde = document.getElementById('mov-fecha-desde').value;
    const hasta = document.getElementById('mov-fecha-hasta').value;
    const tipoFiltro = document.getElementById('mov-filtro-tipo').value;

    let filtrados = historialMovimientoData;

    if (tipoFiltro !== 'TODOS') {
        filtrados = filtrados.filter(m => m.tipo === tipoFiltro);
    }
    
    // Nota: Filtro de fechas simplificado para el prototipo. 
    // En producción se compararían objetos Date reales.

    if (filtrados.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 20px;">No hay movimientos registrados</td></tr>';
        return;
    }

    tbody.innerHTML = filtrados.map(m => `
        <tr>
            <td>${m.id}</td>
            <td>${m.documento}</td>
            <td>${m.fecha}</td>
            <td><span class="badge-${m.tipo === 'ENTRADA' ? 'open' : 'closed'}">${m.tipo}</span></td>
            <td>${m.operacion}</td>
            <td>${m.docRef || '-'}</td>
            <td>${m.observaciones || '-'}</td>
            <td>${m.responsable}</td>
        </tr>
    `).join('');
}

// 11. Exportar Reporte
function exportarMovimiento(formato) {
    const menu = document.getElementById('report-floating-menu-mov');
    if (menu) menu.style.display = 'none';
    
    showNotification('📊', 'Generando Reporte', `El archivo ${formato.toUpperCase()} del historial de movimientos se está generando en el servidor...`);
    
    setTimeout(() => {
        showNotification('✅', 'Reporte Listo', `El archivo ${formato.toUpperCase()} ha sido descargado exitosamente.`);
    }, 2000);
}

function toggleReportMenuMovimiento(event) {
    if (event) event.stopPropagation();
    const menu = document.getElementById('report-floating-menu-mov');
    if (menu) menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
}

// Cerrar menú flotante al hacer clic fuera
document.addEventListener('click', function(event) {
    const menuMov = document.getElementById('report-floating-menu-mov');
    if (menuMov && !event.target.closest('.report-wrapper')) {
        menuMov.style.display = 'none';
    }
});