// *****************************************//
//        PARTIDO EN VIVO - INDEX           //
// *****************************************//

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
    
    return {
        torneo: nombreTorneo,
        categoria: categoria,
        round: round,
        jugador1: nombreJugador1,
        jugador2: nombreJugador2,
        pais1: paisJugador1,
        pais2: paisJugador2,
        marcador: marcador
    };
}

async function actualizarPartidoEnVivo() {
    const partidos = await obtenerPartidosATPIndex();
    const partidosEnVivo = partidos.filter(p => p !== null);
    
    const liveBanner = document.getElementById('live-banner');
    const noLiveBanner = document.getElementById('no-live-banner');
    
    if (partidosEnVivo.length > 0) {
        const partido = partidosEnVivo[0];
        
        document.getElementById('live-partido').innerHTML = `${partido.pais1 ? `[${partido.pais1}] ` : ''}${partido.jugador1} <span class="text-danger">vs</span> ${partido.pais2 ? `[${partido.pais2}] ` : ''}${partido.jugador2}`;
        document.getElementById('live-detalle').innerHTML = `${partido.categoria || 'ATP Tour'} · ${partido.round}`;
        document.getElementById('live-torneo').innerHTML = partido.torneo.length > 20 ? partido.torneo.substring(0, 20) + '...' : partido.torneo;
        document.getElementById('live-ronda').innerHTML = partido.round;
        document.getElementById('live-marcador').innerHTML = partido.marcador || 'En juego';
        
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