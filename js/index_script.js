// *****************************************//
//        PARTIDO EN VIVO - INDEX           //
// *****************************************//

function formatearNombreJugadorIndex(athlete) {
    if (!athlete || !athlete.displayName) return 'Jugador';
    
    const nombreCompleto = athlete.displayName;
    const partes = nombreCompleto.split(' ');
    
    if (partes.length >= 2) {
        const inicial = partes[0].charAt(0);
        const apellido = partes[partes.length - 1];
        return `${inicial}. ${apellido}`;
    }
    
    return nombreCompleto;
}

function procesarEquipoIndex(competitors) {
    if (!competitors || competitors.length === 0) return null;
    
    if (competitors.length === 1) {
        const jugador = competitors[0];
        return {
            nombre: formatearNombreJugadorIndex(jugador.athlete),
            pais: jugador.athlete?.flag?.alt || '',
            esEquipo: false
        };
    }
    
    const nombres = competitors.map(comp => formatearNombreJugadorIndex(comp.athlete));
    const paises = competitors.map(comp => comp.athlete?.flag?.alt || '');
    const paisesUnicos = [...new Set(paises.filter(p => p !== ''))];
    
    return {
        nombre: nombres.join(' / '),
        pais: paisesUnicos.length === 1 ? paisesUnicos[0] : paises.join(' / '),
        esEquipo: true
    };
}

async function obtenerPartidosATPIndex() {
    const url = 'https://site.api.espn.com/apis/site/v2/sports/tennis/atp/scoreboard';
    
    try {
        const respuesta = await fetch(url);
        
        if (!respuesta.ok) {
            throw new Error(`HTTP error! status: ${respuesta.status}`);
        }
        
        const datos = await respuesta.json();
        return procesarDatosATPIndex(datos);
        
    } catch (error) {
        console.error('Error al obtener datos ATP:', error);
        return [];
    }
}

function procesarDatosATPIndex(datos) {
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
                const partidoProcesado = procesarPartidoIndex(partido, categoria, nombreTorneo);
                if (partidoProcesado) {
                    todosLosPartidos.push(partidoProcesado);
                }
            });
        });
    }
    
    return todosLosPartidos;
}

function procesarPartidoIndex(partido, categoria, nombreTorneo) {
    const status = partido.status || {};
    const statusType = status.type || {};
    const isLive = statusType.state === 'in' || statusType.state === 'live';
    
    if (!isLive) return null;
    
    const competitors = partido.competitors || [];
    
    if (competitors.length < 2) return null;
    
    const equipo1 = [];
    const equipo2 = [];
    
    competitors.forEach(competitor => {
        if (competitor.order === 1) {
            equipo1.push(competitor);
        } else if (competitor.order === 2) {
            equipo2.push(competitor);
        }
    });
    
    if (equipo1.length === 0 || equipo2.length === 0) return null;
    
    const infoEquipo1 = procesarEquipoIndex(equipo1);
    const infoEquipo2 = procesarEquipoIndex(equipo2);
    
    const round = partido.round?.displayName || categoria || 'Ronda no especificada';
    
    let marcador = '';
    let sets = [];
    
    const jugadorReferencia1 = equipo1[0];
    const jugadorReferencia2 = equipo2[0];
    
    if (jugadorReferencia1.linescores && jugadorReferencia2.linescores) {
        for (let i = 0; i < jugadorReferencia1.linescores.length; i++) {
            const score1 = jugadorReferencia1.linescores[i]?.value || 0;
            const score2 = jugadorReferencia2.linescores[i]?.value || 0;
            const tiebreak1 = jugadorReferencia1.linescores[i]?.tiebreak;
            const tiebreak2 = jugadorReferencia2.linescores[i]?.tiebreak;
            
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
    
    const esDobles = (equipo1.length > 1 || equipo2.length > 1);
    
    return {
        torneo: nombreTorneo,
        categoria: categoria,
        round: round,
        equipo1: infoEquipo1,
        equipo2: infoEquipo2,
        esDobles: esDobles,
        marcador: marcador,
        sets: sets
    };
}

async function actualizarPartidoEnVivo() {
    const partidos = await obtenerPartidosATPIndex();
    const partidosEnVivo = partidos.filter(p => p !== null);
    
    const liveBanner = document.getElementById('live-banner');
    const noLiveBanner = document.getElementById('no-live-banner');
    
    if (partidosEnVivo.length > 0) {
        const partido = partidosEnVivo[0];
        
        const nombreEquipo1 = partido.equipo1.nombre;
        const nombreEquipo2 = partido.equipo2.nombre;
        const paisEquipo1 = partido.equipo1.pais;
        const paisEquipo2 = partido.equipo2.pais;
        
        document.getElementById('live-partido').innerHTML = `${paisEquipo1 ? `[${paisEquipo1}] ` : ''}${nombreEquipo1} <span class="text-danger">vs</span> ${paisEquipo2 ? `[${paisEquipo2}] ` : ''}${nombreEquipo2}`;
        document.getElementById('live-detalle').innerHTML = `${partido.categoria || 'ATP Tour'} · ${partido.round}${partido.esDobles ? ' · Dobles' : ''}`;
        document.getElementById('live-torneo').innerHTML = partido.torneo.length > 20 ? partido.torneo.substring(0, 20) + '...' : partido.torneo;
        document.getElementById('live-ronda').innerHTML = partido.round;
        document.getElementById('live-marcador').innerHTML = partido.marcador || (partido.sets.length > 0 ? partido.sets[partido.sets.length - 1] : 'En juego');
        
        liveBanner.style.display = 'block';
        noLiveBanner.style.display = 'none';
    } else {
        liveBanner.style.display = 'none';
        noLiveBanner.style.display = 'block';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    actualizarPartidoEnVivo();
    
    setInterval(actualizarPartidoEnVivo, 30000);
});