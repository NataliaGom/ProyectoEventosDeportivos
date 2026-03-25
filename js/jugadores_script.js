// *********************************//
//       ENDPOINT jugador ID        //
// *********************************//

async function obtenerJugadorPorId(jugadorId) {
    const url = `https://sports.core.api.espn.com/v2/sports/tennis/athletes/${jugadorId}?lang=en&region=us`;

    try {
        const respuesta = await fetch(url);

        if (!respuesta.ok) {
            throw new Error(`HTTP error! status: ${respuesta.status}`);
        }

        const athlete = await respuesta.json();
        return athlete;

    } catch (error) {
        console.error('Error al obtener jugador por ID:', error);
        return null;
    }
}

function procesarJugadorBuscado(athlete) {
    if (!athlete) {
        return null;
    }

    let pais = 'N/D';

    if (athlete.flag && athlete.flag.alt) {
        pais = athlete.flag.alt;
    } 

    if (athlete.links && athlete.links.length > 0) {
        const linkPlayerCard = athlete.links.find(link =>
            link.rel && link.rel.includes('playercard') && link.href
        );

        if (linkPlayerCard) {
            linkJugador = linkPlayerCard.href;
        } else if (athlete.links[0].href) {
            linkJugador = athlete.links[0].href;
        }
    }

    return {
        id: athlete.id || 'N/D',
        nombre: athlete.shortName || athlete.displayName || 'N/D',
        nombreCompleto: athlete.fullName || 'N/D',
        edad: athlete.age || 'N/D',
        pais: pais,
        debutYear: athlete.debutYear || 'N/D',
        foto: athlete.headshot?.href || '',
        bandera: athlete.flag?.href || '',
        link: linkJugador
    };
}

function renderizarJugadorBuscado(jugador) {
    const contenedor = document.getElementById('resultadoBusquedaJugador');

    if (!contenedor) return;

    if (!jugador) {
        contenedor.innerHTML = `
            <div class="alert alert-warning mb-0">
                No se encontró información del jugador.
            </div>
        `;
        return;
    }

    contenedor.innerHTML = `
        <div class="card jugador-buscado-card border-0 shadow-sm">
            <div class="card-body p-4">
                <div class="d-flex flex-column flex-md-row align-items-md-center gap-4">
                    <div class="text-center">
                        ${
                            jugador.foto
                                ? `<img src="${jugador.foto}" alt="${jugador.nombre}" class="jugador-buscado-foto">`
                                : `<div class="jugador-buscado-foto-placeholder">Sin foto</div>`
                        }
                    </div>

                    <div class="flex-grow-1">
                        <h4 class="mb-1">${jugador.nombreCompleto}</h4>
                        <p class="text-body-secondary mb-3">ID: ${jugador.id}</p>

                        <div class="row g-3">
                            <div class="col-sm-6 col-lg-3">
                                <div class="dato-jugador-box">
                                    <span class="dato-jugador-label">Short Name</span>
                                    <strong>${jugador.nombre}</strong>
                                </div>
                            </div>

                            <div class="col-sm-6 col-lg-3">
                                <div class="dato-jugador-box">
                                    <span class="dato-jugador-label">Edad</span>
                                    <strong>${jugador.edad}</strong>
                                </div>
                            </div>

                            <div class="col-sm-6 col-lg-3">
                                <div class="dato-jugador-box">
                                    <span class="dato-jugador-label">País</span>
                                    <div class="d-flex align-items-center gap-2 justify-content-center justify-content-sm-start">
                                        <strong>${jugador.pais}</strong>
                                        ${
                                            jugador.bandera
                                                ? `<img src="${jugador.bandera}" alt="${jugador.pais}" class="bandera-pais">`
                                                : ''
                                        }
                                    </div>
                                </div>
                            </div>

                            <div class="col-sm-6 col-lg-3">
                                <div class="dato-jugador-box">
                                    <span class="dato-jugador-label">Año debut</span>
                                    <strong>${jugador.debutYear}</strong>
                                </div>
                            </div>
                        </div>

                        <div class="mt-3">
                            ${
                                jugador.link !== 'N/D'
                                    ? `<a href="${jugador.link}" target="_blank" rel="noopener noreferrer" class="btn btn-outline-success btn-sm">Ver perfil ESPN</a>`
                                    : ''
                            }
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

async function buscarJugadorPorId() {
    const input = document.getElementById('inputJugadorId');
    const estado = document.getElementById('estadoBusquedaJugador');
    const resultado = document.getElementById('resultadoBusquedaJugador');

    if (!input || !estado || !resultado) return;

    const jugadorId = input.value.trim();

    if (jugadorId === '') {
        estado.innerHTML = '<div class="alert alert-warning mb-0">Escribe un ID de jugador.</div>';
        resultado.innerHTML = '';
        return;
    }

    estado.innerHTML = '<div class="alert alert-info mb-0">Buscando jugador...</div>';
    resultado.innerHTML = '';

    const athlete = await obtenerJugadorPorId(jugadorId);

    if (!athlete) {
        estado.innerHTML = '<div class="alert alert-danger mb-0">No se pudo obtener el jugador.</div>';
        resultado.innerHTML = '';
        return;
    }

    const jugadorProcesado = procesarJugadorBuscado(athlete);

    estado.innerHTML = '';
    renderizarJugadorBuscado(jugadorProcesado);
}

function limpiarBusquedaJugador() {
    const input = document.getElementById('inputJugadorId');
    const estado = document.getElementById('estadoBusquedaJugador');
    const resultado = document.getElementById('resultadoBusquedaJugador');

    if (input) input.value = '';
    if (estado) estado.innerHTML = '';
    if (resultado) resultado.innerHTML = '';
}

// *********************************//
//            RANKING              //
// *********************************//
window.rankingData = [];
window.paginaActualRanking = 1;
window.jugadoresPorPagina = 15;
window.maximoJugadores = 100;



async function obtenerRankingATP() {
    const url = 'https://sports.core.api.espn.com/v2/sports/tennis/leagues/atp/seasons/2026/types/2/weeks/11/rankings/1?lang=en&region=us';

    try {
        console.log('1. Voy a pedir el ranking');
        const respuesta = await fetch(url);
        console.log('2. Respuesta ranking:', respuesta);

        if (!respuesta.ok) {
            throw new Error(`HTTP error! status: ${respuesta.status}`);
        }

        const datos = await respuesta.json();
        console.log('3. JSON ranking recibido:', datos);

        return await procesarRankingATP(datos);

    } catch (error) {
        console.error('Error al obtener ranking ATP:', error);
        return [];
    }
}
async function procesarRankingATP(datos) {

    if (!datos || !datos.ranks || datos.ranks.length === 0) {
        console.error('No existe el arreglo ranks o viene vacío.');
        return [];
    }

    const rankingLimitado = datos.ranks.slice(0, window.maximoJugadores); //Solo 100 jugadores no 150

    const promesasJugadores = rankingLimitado.map(jugadorRanking =>
        procesarJugadorRanking(jugadorRanking)
    );

    const jugadoresProcesados = await Promise.all(promesasJugadores);

    return jugadoresProcesados.filter(jugador => jugador !== null);
}

async function procesarJugadorRanking(jugadorRanking) {
    try {
        const athleteRef = jugadorRanking.athlete?.$ref;

        if (!athleteRef) {
            return null;
        }

        const athleteRefSeguro = athleteRef.replace('http://', 'https://'); //Para asegurar la ruta
        const respuestaAthlete = await fetch(athleteRefSeguro);

        if (!respuestaAthlete.ok) {
            throw new Error(`HTTP error! status: ${respuestaAthlete.status}`);
        }

        const athlete = await respuestaAthlete.json();

        let pais = 'N/D';

        if (athlete.flag && athlete.flag.alt) {
            pais = athlete.flag.alt;
        } 

        let linkJugador = 'N/D';

        if (athlete.links && athlete.links.length > 0) {
            const linkPlayerCard = athlete.links.find(link =>
                link.rel && link.rel.includes('playercard') && link.href
            );

            if (linkPlayerCard) {
                linkJugador = linkPlayerCard.href;
            } else if (athlete.links[0].href) {
                linkJugador = athlete.links[0].href;
            }
        }

        return {
            ranking: jugadorRanking.current || 'N/D',
            nombre: athlete.shortName || 'N/D',
            edad: athlete.age || 'N/D',
            pais: pais,
            debutYear: athlete.debutYear || 'N/D',
            link: linkJugador,
            foto: athlete.headshot?.href || '',
            bandera: athlete.flag?.href || ''
        };

    } catch (error) {
        console.error('Error al procesar jugador del ranking:', error);
        return null;
    }
}
function renderizarRanking() {
    const tbody = document.getElementById('ranking-body');
    const infoPaginacion = document.getElementById('info-paginacion-ranking');
    const btnAnterior = document.getElementById('btn-anterior-ranking');
    const btnSiguiente = document.getElementById('btn-siguiente-ranking');

    if (!tbody) return;

    tbody.innerHTML = '';

    const inicio = (window.paginaActualRanking - 1) * window.jugadoresPorPagina;
    const fin = inicio + window.jugadoresPorPagina;
    const jugadoresPagina = window.rankingData.slice(inicio, fin);

    jugadoresPagina.forEach(jugador => {
        let fila = `
            <tr>
                <td>${jugador.ranking}</td>
                <td>
                <div class="d-flex align-items-center gap-2">
                    <img src="${jugador.foto}" class="jugador-foto" alt="">
                    <span>${jugador.nombre}</span>
                </div>
                </td>
                <td>${jugador.edad}</td>
                <td>
                <div class="d-flex align-items-center gap-2">
                    <span>${jugador.pais}</span>
                    ${jugador.bandera? `<img src="${jugador.bandera}" class="bandera-pais" alt="">`: ''}
                </div>
                </td>
                <td>${jugador.debutYear}</td>
                <td>
        `;

        if (jugador.link !== 'N/D') {
            fila += `<a href="${jugador.link}" target="_blank" rel="noopener noreferrer">Ver jugador</a>`;
        } else {
            fila += `N/D`;
        }

        fila += `
                </td>
            </tr>
        `;

        tbody.innerHTML += fila;
    });

    const totalJugadores = window.rankingData.length;
    const inicioReal = totalJugadores === 0 ? 0 : inicio + 1;
    const finReal = fin > totalJugadores ? totalJugadores : fin;

    infoPaginacion.textContent = `Mostrando ${inicioReal}-${finReal} de ${totalJugadores}`;

    btnAnterior.disabled = window.paginaActualRanking === 1;
    btnSiguiente.disabled = fin >= totalJugadores;
}

function paginaSiguienteRanking() {
    const totalJugadores = window.rankingData.length;
    const totalPaginas = Math.ceil(totalJugadores / window.jugadoresPorPagina);

    if (window.paginaActualRanking < totalPaginas) {
        window.paginaActualRanking++;
        renderizarRanking();
    }
}

function paginaAnteriorRanking() {
    if (window.paginaActualRanking > 1) {
        window.paginaActualRanking--;
        renderizarRanking();
    }
}

async function cargarRankingCompleto() {
    const estadoRanking = document.getElementById('estadoRanking');

    if (estadoRanking) {
        estadoRanking.textContent = 'Cargando ranking...';
    }

    window.rankingData = await obtenerRankingATP();

    if (window.rankingData.length === 0) {
        if (estadoRanking) {
            estadoRanking.innerHTML = '<div class="alert alert-warning mb-0">No se pudo cargar el ranking.</div>';
        }
        return;
    }

    if (estadoRanking) {
        estadoRanking.innerHTML = '';
    }

    window.paginaActualRanking = 1;
    renderizarRanking();
}

const btnBuscarJugador = document.getElementById('btnBuscarJugador');
const btnLimpiarBusquedaJugador = document.getElementById('btnLimpiarBusquedaJugador');
const inputJugadorId = document.getElementById('inputJugadorId');

if (btnBuscarJugador) {
    btnBuscarJugador.addEventListener('click', buscarJugadorPorId);
}

if (btnLimpiarBusquedaJugador) {
    btnLimpiarBusquedaJugador.addEventListener('click', limpiarBusquedaJugador);
}

if (inputJugadorId) {
    inputJugadorId.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            buscarJugadorPorId();
        }
    });
}
const btnSiguienteRanking = document.getElementById('btn-siguiente-ranking');
const btnAnteriorRanking = document.getElementById('btn-anterior-ranking');

if (btnSiguienteRanking) {
    btnSiguienteRanking.addEventListener('click', paginaSiguienteRanking);
}

if (btnAnteriorRanking) {
    btnAnteriorRanking.addEventListener('click', paginaAnteriorRanking);
}

cargarRankingCompleto();