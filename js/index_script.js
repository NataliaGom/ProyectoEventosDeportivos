// *****************************************//
//        PARTIDO EN VIVO - INDEX           //
// *****************************************//

function formatearNombreJugadorIndex(nombreCompleto) {
    if (!nombreCompleto) return 'Jugador';
    
    const partes = nombreCompleto.split(' ');
    
    if (partes.length >= 2) {
        const inicial = partes[0].charAt(0);
        const apellido = partes[partes.length - 1];
        return `${inicial}. ${apellido}`;
    }
    
    return nombreCompleto;
}

function extraerJugadorIndex(competitor) {
    let nombre = '';
    let pais = '';
    
    if (competitor.athlete) {
        nombre = competitor.athlete.displayName;
        if (competitor.athlete.flag?.alt) pais = competitor.athlete.flag.alt;
    } else if (competitor.displayName) {
        nombre = competitor.displayName;
    }
    
    if (!nombre) return null;
    
    return {
        nombre: nombre,
        nombreFormateado: formatearNombreJugadorIndex(nombre),
        pais: pais
    };
}

function esPartidoIndividualIndex(competitors) {
    if (competitors.length !== 2) return false;
    
    const tieneVariosAtletas1 = competitors[0].athletes && competitors[0].athletes.length > 1;
    const tieneVariosAtletas2 = competitors[1].athletes && competitors[1].athletes.length > 1;
    
    return !tieneVariosAtletas1 && !tieneVariosAtletas2;
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
    const competitors = partido.competitors || [];
    
    if (!esPartidoIndividualIndex(competitors)) return null;
    
    const status = partido.status || {};
    const statusType = status.type || {};
    const isLive = statusType.state === 'in' || statusType.state === 'live';
    
    if (!isLive) return null;
    
    let jugador1 = null;
    let jugador2 = null;
    
    competitors.forEach(competitor => {
        if (competitor.order === 1) {
            jugador1 = extraerJugadorIndex(competitor);
        } else if (competitor.order === 2) {
            jugador2 = extraerJugadorIndex(competitor);
        }
    });
    
    if (!jugador1 || !jugador2) return null;
    
    const round = partido.round?.displayName || categoria || 'Ronda no especificada';
    
    let marcador = '';
    let sets = [];
    
    const jugadorReferencia1 = competitors.find(c => c.order === 1);
    const jugadorReferencia2 = competitors.find(c => c.order === 2);
    
    if (jugadorReferencia1?.linescores && jugadorReferencia2?.linescores) {
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
    
    return {
        torneo: nombreTorneo,
        categoria: categoria,
        round: round,
        jugador1: jugador1,
        jugador2: jugador2,
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
        
        const nombreJugador1 = partido.jugador1.nombreFormateado;
        const nombreJugador2 = partido.jugador2.nombreFormateado;
        const paisJugador1 = partido.jugador1.pais;
        const paisJugador2 = partido.jugador2.pais;
        
        document.getElementById('live-partido').innerHTML = `${paisJugador1 ? `[${paisJugador1}] ` : ''}${nombreJugador1} <span class="text-danger">vs</span> ${paisJugador2 ? `[${paisJugador2}] ` : ''}${nombreJugador2}`;
        document.getElementById('live-detalle').innerHTML = `${partido.categoria || 'ATP Tour'} · ${partido.round}`;
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