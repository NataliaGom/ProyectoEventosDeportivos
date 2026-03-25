// *****************************************//
//            PARTIDOS ATP                  //
// *****************************************//

window.partidosDataATP = [];
window.filtroActual = 'all';
window.partidosVisibles = 10;
window.incremento = 5;
window.maximoPartidos = 30;

async function obtenerPartidosATP() {
    const url = 'https://site.api.espn.com/apis/site/v2/sports/tennis/atp/scoreboard';
    
    try {
        const respuesta = await fetch(url);
        
        if (!respuesta.ok) {
            throw new Error(`HTTP error! status: ${respuesta.status}`);
        }
        
        const datos = await respuesta.json();
        return procesarDatosATP(datos);
        
    } catch (error) {
        console.error('Error al obtener datos ATP:', error);
        return [];
    }
}

function procesarDatosATP(datos) {
    if (!datos.events || datos.events.length === 0) {
        return [];
    }
    
    const torneoPrincipal = datos.events[0];
    const nombreTorneo = torneoPrincipal.name || 'ATP Tour';
    let todosLosPartidos = [];
    
    if (torneoPrincipal.groupings) {
        torneoPrincipal.groupings.forEach(grouping => {
            const categoria = grouping.grouping?.displayName || '';
            const competencias = grouping.competitions || [];
            
            competencias.forEach(partido => {
                const partidoProcesado = procesarPartido(partido, categoria, nombreTorneo);
                if (partidoProcesado) {
                    todosLosPartidos.push(partidoProcesado);
                }
            });
        });
    }
    
    todosLosPartidos.sort((a, b) => new Date(b.fechaRaw) - new Date(a.fechaRaw));
    
    return todosLosPartidos;
}

function procesarPartido(partido, categoria, nombreTorneo) {
    const status = partido.status || {};
    const statusType = status.type || {};
    const isCompleted = statusType.completed;
    const isLive = statusType.state === 'in' || statusType.state === 'live';
    
    let estado = 'scheduled';
    let estadoTexto = 'Programado';
    let estadoClase = 'next';
    
    if (isCompleted) {
        estado = 'final';
        estadoTexto = 'Finalizado';
        estadoClase = 'next';
    } else if (isLive) {
        estado = 'live';
        estadoTexto = 'En vivo';
        estadoClase = 'live';
    }
    
    const competitors = partido.competitors || [];
    let jugador1 = null;
    let jugador2 = null;
    
    competitors.forEach(competitor => {
        if (competitor.order === 1) jugador1 = competitor;
        if (competitor.order === 2) jugador2 = competitor;
    });
    
    if (!jugador1 || !jugador2) return null;
    
    const nombreJugador1 = jugador1.athlete?.displayName || 'Jugador 1';
    const nombreJugador2 = jugador2.athlete?.displayName || 'Jugador 2';
    const paisJugador1 = jugador1.athlete?.flag?.alt || '';
    const paisJugador2 = jugador2.athlete?.flag?.alt || '';
    
    const round = partido.round?.displayName || categoria || 'Ronda no especificada';
    const fechaRaw = partido.date || new Date().toISOString();
    const fecha = new Date(fechaRaw).toLocaleString('es-ES', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    let marcador = '';
    let sets = [];
    
    if (jugador1.linescores && jugador2.linescores) {
        for (let i = 0; i < jugador1.linescores.length; i++) {
            const score1 = jugador1.linescores[i]?.value || 0;
            const score2 = jugador2.linescores[i]?.value || 0;
            const tiebreak1 = jugador1.linescores[i]?.tiebreak;
            const tiebreak2 = jugador2.linescores[i]?.tiebreak;
            
            let setText = `${score1}-${score2}`;
            if (tiebreak1 || tiebreak2) {
                setText += ` (${tiebreak1 || 0}-${tiebreak2 || 0})`;
            }
            sets.push(setText);
        }
        
        if (sets.length > 0) {
            marcador = sets.join(' · ');
        }
    }
    
    const winner = jugador1.winner ? jugador1 : (jugador2.winner ? jugador2 : null);
    const ganadorNombre = winner?.athlete?.displayName || '';
    
    return {
        id: partido.id,
        torneo: nombreTorneo,
        categoria: categoria,
        round: round,
        jugador1: nombreJugador1,
        jugador2: nombreJugador2,
        pais1: paisJugador1,
        pais2: paisJugador2,
        marcador: marcador,
        sets: sets,
        fecha: fecha,
        fechaRaw: fechaRaw,
        estado: estado,
        estadoTexto: estadoTexto,
        estadoClase: estadoClase,
        ganador: ganadorNombre,
        venue: partido.venue?.fullName || '',
        court: partido.venue?.court || ''
    };
}

async function cargarPartidosATP() {
    const partidosATP = await obtenerPartidosATP();
    window.partidosDataATP = partidosATP;
    window.partidosVisibles = 10;
    actualizarVistaPartidos();
}

function actualizarVistaPartidos() {
    let partidosCompletos = window.partidosDataATP;
    
    let partidosFiltrados = [];
    
    if (window.filtroActual === 'all') {
        partidosFiltrados = partidosCompletos.filter(partido => partido.estado !== 'scheduled');
    } else {
        partidosFiltrados = partidosCompletos.filter(partido => partido.estado === window.filtroActual);
    }
    
    if (window.filtroActual === 'scheduled') {
        partidosFiltrados.sort((a, b) => new Date(a.fechaRaw) - new Date(b.fechaRaw));
    }
    
    const tournamentInfo = document.getElementById('tournament-info');
    if (partidosCompletos.length > 0) {
        tournamentInfo.innerHTML = `
            <div class="d-flex align-items-center gap-2 mb-3">
                <i class="bi bi-trophy-fill text-success fs-5"></i>
                <span class="match-tournament fs-5 fw-semibold">${partidosCompletos[0].torneo}</span>
                <span class="badge bg-secondary">ATP · 2026</span>
                <span class="badge bg-info">${partidosFiltrados.length} partidos</span>
            </div>
        `;
    } else {
        tournamentInfo.innerHTML = `
            <div class="alert alert-info text-center py-2">
                No hay partidos disponibles en este momento.
            </div>
        `;
    }
    
    window.partidosFiltradosActuales = partidosFiltrados;
    window.partidosVisibles = 10;
    renderizarPartidosConPaginacion();
}

function renderizarPartidosConPaginacion() {
    const partidos = window.partidosFiltradosActuales || [];
    const totalPartidos = partidos.length;
    const partidosAMostrar = partidos.slice(0, window.partidosVisibles);
    
    renderizarPartidos(partidosAMostrar);
    
    const loadMoreContainer = document.getElementById('load-more-container');
    const loadMoreBtn = document.getElementById('load-more-btn');
    
    if (loadMoreContainer && loadMoreBtn) {
        if (window.partidosVisibles < totalPartidos && window.partidosVisibles < window.maximoPartidos) {
            const restantes = Math.min(window.incremento, totalPartidos - window.partidosVisibles, window.maximoPartidos - window.partidosVisibles);
            loadMoreBtn.innerHTML = `<i class="bi bi-plus-circle me-2"></i>Mostrar más (${restantes})`;
            loadMoreContainer.style.display = 'block';
            
            loadMoreBtn.removeEventListener('click', cargarMasPartidos);
            loadMoreBtn.addEventListener('click', cargarMasPartidos);
        } else {
            loadMoreContainer.style.display = 'none';
        }
    }
}

function cargarMasPartidos() {
    const totalPartidos = window.partidosFiltradosActuales.length;
    let nuevosVisibles = window.partidosVisibles + window.incremento;
    
    if (nuevosVisibles > totalPartidos) {
        nuevosVisibles = totalPartidos;
    }
    
    if (nuevosVisibles > window.maximoPartidos) {
        nuevosVisibles = window.maximoPartidos;
    }
    
    window.partidosVisibles = nuevosVisibles;
    renderizarPartidosConPaginacion();
}

function renderizarPartidos(partidos) {
    const contenedor = document.getElementById('matches-container');
    
    if (partidos.length === 0) {
        contenedor.innerHTML = `
            <div class="alert alert-info text-center">
                No hay partidos que coincidan con el filtro seleccionado.
            </div>
        `;
        return;
    }
    
    let html = '';
    
    partidos.forEach(partido => {
        html += `
            <article class="match-card card border-0 shadow-sm rounded-4 mb-3" data-estado="${partido.estado}">
                <div class="card-body">
                    <div class="row align-items-center gy-3">
                        <div class="col-12 col-lg-3">
                            <div>
                                <span class="match-tournament d-block">${partido.categoria || 'ATP Tour'}</span>
                                <small class="text-secondary">${partido.round}</small>
                            </div>
                        </div>
                        <div class="col-12 col-lg-5">
                            <div class="d-flex flex-column flex-md-row align-items-md-center justify-content-center gap-2 gap-md-3">
                                <div class="fw-semibold text-center text-md-end" style="min-width: 120px;">
                                    ${partido.pais1 ? `<span class="small text-secondary">[${partido.pais1}]</span> ` : ''}${partido.jugador1}
                                    ${partido.ganador === partido.jugador1 ? '<i class="bi bi-trophy-fill text-warning ms-1 small"></i>' : ''}
                                </div>
                                <span class="vs-badge">vs</span>
                                <div class="fw-semibold text-center text-md-start" style="min-width: 120px;">
                                    ${partido.pais2 ? `<span class="small text-secondary">[${partido.pais2}]</span> ` : ''}${partido.jugador2}
                                    ${partido.ganador === partido.jugador2 ? '<i class="bi bi-trophy-fill text-warning ms-1 small"></i>' : ''}
                                </div>
                            </div>
                            ${partido.marcador ? `<div class="text-center mt-2 small text-secondary">${partido.marcador}</div>` : ''}
                        </div>
                        <div class="col-6 col-lg-2 text-lg-center">
                            <span class="match-time">${partido.fecha}</span>
                        </div>
                        <div class="col-6 col-lg-2 text-lg-end">
                            <span class="match-status ${partido.estadoClase}">${partido.estadoTexto}</span>
                        </div>
                    </div>
                    ${partido.sets.length > 1 ? `
                        <div class="row mt-3 pt-2 border-top">
                            <div class="col-12">
                                <div class="d-flex flex-wrap gap-2 justify-content-center justify-content-lg-start">
                                    ${partido.sets.map((set, idx) => `<span class="badge bg-light text-dark">Set ${idx + 1}: ${set}</span>`).join('')}
                                </div>
                            </div>
                        </div>
                    ` : ''}
                </div>
            </article>
        `;
    });
    
    contenedor.innerHTML = html;
}

function filtrarPartidos(event) {
    const filtro = event.currentTarget.getAttribute('data-filter');
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('btn-success', 'active');
        btn.classList.add('btn-outline-secondary');
    });
    
    event.currentTarget.classList.remove('btn-outline-secondary');
    event.currentTarget.classList.add('btn-success', 'active');
    
    window.filtroActual = filtro;
    window.partidosVisibles = 10;
    actualizarVistaPartidos();
}

document.addEventListener('DOMContentLoaded', function() {
    cargarPartidosATP();
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', filtrarPartidos);
    });
});