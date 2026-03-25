const API_KEY_TENNIS = 'fcd8e4e3602130a6a1df894b6c5549eb9ae9a5859896677164ba5fea76b271c5';
const TENNIS_BASE    = 'https://api.api-tennis.com/tennis/';
const PROXIES        = [
  function(u) { return 'https://corsproxy.io/?' + encodeURIComponent(u); },
  function(u) { return 'https://api.allorigins.win/get?url=' + encodeURIComponent(u); }
];

async function tennisApiCall(params) {
  var qs  = new URLSearchParams({ ...params, APIkey: API_KEY_TENNIS }).toString();
  var url = TENNIS_BASE + '?' + qs;
  var lastErr = new Error('Sin conexión');
  for (var i = 0; i < PROXIES.length; i++) {
    try {
      var res = await fetch(PROXIES[i](url));
      if (!res.ok) { lastErr = new Error('Proxy HTTP ' + res.status); continue; }
      var raw = await res.text();
      if (!raw) { lastErr = new Error('Respuesta vacía'); continue; }
      var parsed = JSON.parse(raw);
      if (parsed && parsed.contents !== undefined) parsed = JSON.parse(parsed.contents);
      if (!parsed || String(parsed.success) === '0') throw new Error('API error');
      return parsed.result;
    } catch(e) { lastErr = e; }
  }
  throw lastErr;
}

// ─────────────────────────────────────────
// ESTADO GLOBAL
// ─────────────────────────────────────────
var resultsLoaded = false;
var rankChart     = null;
var paisesChart   = null;
var rankCache     = { ATP: null, WTA: null };
var currentLeague = 'ATP';
var playerSource  = 'espn';   // 'espn' o 'tennis-api'

// ─────────────────────────────────────────
// TABS
// ─────────────────────────────────────────
document.querySelectorAll('.tab-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    var tab = this.dataset.tab;
    document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
    this.classList.add('active');
    document.getElementById('panel-rankings').style.display   = tab === 'rankings'   ? '' : 'none';
    document.getElementById('panel-resultados').style.display = tab === 'resultados' ? '' : 'none';
    document.getElementById('panel-jugador').style.display    = tab === 'jugador'    ? '' : 'none';
    if (tab === 'resultados' && !resultsLoaded) loadResults();
  });
});

// ─────────────────────────────────────────
// RANKINGS — ATP via ESPN, WTA via api-tennis.com
// ─────────────────────────────────────────
async function loadRankings(league) {
  currentLeague = league;

  document.getElementById('btn-atp').className = league === 'ATP'
    ? 'btn btn-success btn-sm rounded-pill px-3'
    : 'btn btn-outline-secondary btn-sm rounded-pill px-3';
  document.getElementById('btn-wta').className = league === 'WTA'
    ? 'btn btn-success btn-sm rounded-pill px-3'
    : 'btn btn-outline-secondary btn-sm rounded-pill px-3';

  document.getElementById('rankings-title').textContent = 'Ranking ' + league;
  document.getElementById('chart-title').textContent    = 'Top 10 · Puntos ' + league;
  document.getElementById('tabla-rankings-wrap').style.display = 'none';
  document.getElementById('rankings-body').innerHTML = '';
  if (rankChart)  { rankChart.destroy();  rankChart  = null; }
  if (paisesChart) { paisesChart.destroy(); paisesChart = null; }

  if (rankCache[league]) { renderRankings(rankCache[league], league); return; }

  setEstado('rankings', 'loading', 'Cargando ' + league + '...');

  try {
    var jugadores = league === 'ATP'
      ? await loadRankingsATP()
      : await loadRankingsWTA();

    if (!jugadores || jugadores.length === 0)
      throw new Error('Sin datos de ranking para ' + league);

    rankCache[league] = jugadores;
    if (currentLeague === league) renderRankings(jugadores, league);

  } catch(e) {
    if (currentLeague === league) setEstado('rankings', 'error', e.message);
  }
}


async function loadRankingsATP() {
  var url = 'https://sports.core.api.espn.com/v2/sports/tennis/leagues/atp/seasons/2026/types/2/weeks/11/rankings/1?lang=en&region=us';
  var res  = await fetch(url);
  if (!res.ok) throw new Error('ESPN HTTP ' + res.status);
  var data = await res.json();
  if (!data || !data.ranks || data.ranks.length === 0) throw new Error('Sin ranks ATP');

  var top20     = data.ranks.slice(0, 20);
  var jugadores = await Promise.all(top20.map(resolverAtletaESPN));
  return jugadores.filter(function(j) { return j !== null; });
}

async function resolverAtletaESPN(rankEntry) {
  try {
    var ref = rankEntry.athlete && rankEntry.athlete.$ref;
    if (!ref) return null;
    ref = ref.replace('http://', 'https://');
    var res     = await fetch(ref);
    if (!res.ok) return null;
    var athlete = await res.json();
    return {
      ranking: rankEntry.current || '–',
      points:  rankEntry.points  || 0,
      nombre:  athlete.shortName || athlete.displayName || '–',
      pais:    (athlete.flag && athlete.flag.alt)          ? athlete.flag.alt          : '–',
      bandera: (athlete.flag && athlete.flag.href)         ? athlete.flag.href         : '',
      foto:    (athlete.headshot && athlete.headshot.href) ? athlete.headshot.href     : '',
      id:      athlete.id || ''
    };
  } catch(e) { return null; }
}


async function loadRankingsWTA() {
  var data = await tennisApiCall({ method: 'get_standings', event_type: 'WTA' });
  if (!data || !data.length) throw new Error('Sin ranks WTA');

  return data.slice(0, 20).map(function(p) {
    return {
      ranking: parseInt(p.place) || '–',
      points:  parseInt(p.points) || 0,
      nombre:  p.player   || '–',
      pais:    p.country  || '–',
      bandera: '',   // api-tennis no devuelve bandera
      foto:    '',
      id:      p.player_key || ''
    };
  });
}

function renderRankings(jugadores, league) {
  currentLeague = league;
  var maxPts = jugadores[0] && jugadores[0].points ? jugadores[0].points : 1;

  var rows = jugadores.map(function(j) {
    var pct = Math.round(j.points / maxPts * 100);
    var fotoHtml = j.foto
      ? '<img src="' + j.foto + '" alt="" style="width:32px;height:32px;border-radius:50%;object-fit:cover;margin-right:8px;flex-shrink:0" onerror="this.style.display=\'none\'">'
      : '';
    var banderaHtml = j.bandera
      ? '<img src="' + j.bandera + '" alt="' + j.pais + '" style="width:22px;height:15px;object-fit:cover;border-radius:3px;margin-left:6px">'
      : '';

    return '<tr style="cursor:pointer" onclick="seleccionarJugador(\'' + j.id + '\', \'' + j.nombre.replace(/'/g, "\\'") + '\')">'
      + '<td class="text-success fw-bold">' + j.ranking + '</td>'
      + '<td><div style="display:flex;align-items:center">' + fotoHtml + '<strong>' + j.nombre + '</strong></div></td>'
      + '<td><div style="display:flex;align-items:center">' + j.pais + banderaHtml + '</div></td>'
      + '<td><div style="display:flex;align-items:center;gap:8px">'
      +   '<span>' + Number(j.points).toLocaleString() + '</span>'
      +   '<div class="progress" style="height:5px;width:80px;flex-shrink:0">'
      +     '<div class="progress-bar bg-success" style="width:' + pct + '%"></div>'
      +   '</div>'
      + '</div></td>'
      + '</tr>';
  }).join('');

  document.getElementById('rankings-body').innerHTML = rows;
  setEstado('rankings', 'ok', '');
  document.getElementById('tabla-rankings-wrap').style.display = '';

  if (rankChart) rankChart.destroy();
  var isDark     = document.documentElement.getAttribute('data-bs-theme') === 'dark';
  var gridColor  = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  var labelColor = isDark ? '#dee2e6' : '#495057';  
  var ctx = document.getElementById('rankings-chart').getContext('2d');
  rankChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: jugadores.slice(0, 10).map(function(j) { return j.nombre.split('.').pop().trim(); }),
      datasets: [{
        label: 'Puntos',
        data:  jugadores.slice(0, 10).map(function(j) { return j.points; }),
        backgroundColor: jugadores.slice(0, 10).map(function(_, i) {
          return i === 0 ? '#198754' : i <= 2 ? '#20c997' : 'rgba(25,135,84,0.35)';
        }),
        borderColor: '#198754', borderWidth: 1, borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: labelColor, font: { size: 11 } }, grid: { color: gridColor } },
        y: { ticks: { color: labelColor }, grid: { color: gridColor } }
      }
    }
  });

  // ── Gráfica de países
  var conteo = {};
  jugadores.forEach(function(j) {
    var p = j.pais || 'N/D';
    conteo[p] = (conteo[p] || 0) + 1;
  });
  // Ordenar por cantidad descendente
  var paisesOrdenados = Object.keys(conteo).sort(function(a, b) { return conteo[b] - conteo[a]; });
  var COLORES = [
    '#198754','#20c997','#0d6efd','#ffc107','#dc3545',
    '#6f42c1','#fd7e14','#0dcaf0','#6c757d','#d63384'
  ];

  document.getElementById('paises-title').textContent = 'Países · Top 20 ' + league;

  if (paisesChart) paisesChart.destroy();
  var ctx2 = document.getElementById('paises-chart').getContext('2d');


  var labelsConConteo = paisesOrdenados.map(function(p) {
    return p + ' (' + conteo[p] + ')';
  });

  paisesChart = new Chart(ctx2, {
    type: 'doughnut',
    data: {
      labels: labelsConConteo,
      datasets: [{
        data: paisesOrdenados.map(function(p) { return conteo[p]; }),
        backgroundColor: paisesOrdenados.map(function(_, i) { return COLORES[i % COLORES.length]; }),
        borderColor: isDark ? '#212529' : '#ffffff',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: labelColor,   
            padding: 14,
            font: { size: 12 },
            boxWidth: 14,
            boxHeight: 14
          }
        },
        tooltip: {
          callbacks: {
            label: function(ctx) {
              var n = ctx.parsed;
              return ' ' + ctx.label.split(' (')[0] + ': ' + n + ' jugador' + (n > 1 ? 'es' : '');
            }
          }
        }
      },
      cutout: '55%'
    }
  });
}

function seleccionarJugador(athleteId, nombre) {
  document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
  document.getElementById('tab-jugador-btn').classList.add('active');
  document.getElementById('panel-rankings').style.display   = 'none';
  document.getElementById('panel-resultados').style.display = 'none';
  document.getElementById('panel-jugador').style.display    = '';
  document.getElementById('inputJugadorIdStats').value      = athleteId;
  // Marcar la fuente según qué ranking estaba activo
  playerSource = currentLeague === 'WTA' ? 'tennis-api' : 'espn';
  document.getElementById('estado-jugador').innerHTML =
    '<span class="text-body-secondary small">Seleccionado: <strong>' + nombre + '</strong></span>';
  loadPlayer();
}

// ─────────────────────────────────────────
// RESULTADOS — ESPN scoreboard ATP + WTA
// ─────────────────────────────────────────
async function loadResults() {
  resultsLoaded = true;
  try {
    var resATP = await fetch('https://site.api.espn.com/apis/site/v2/sports/tennis/atp/scoreboard');
    var resWTA = await fetch('https://site.api.espn.com/apis/site/v2/sports/tennis/wta/scoreboard');
    if (!resATP.ok || !resWTA.ok) throw new Error('Error al cargar scoreboard');
    var dataATP = await resATP.json();
    var dataWTA = await resWTA.json();
    var todos   = extraerPartidos(dataATP, 'ATP').concat(extraerPartidos(dataWTA, 'WTA'));
    var fin     = todos.filter(function(p) { return p.estado === 'final'; });

    setEstado('resultados', 'ok', '');
    if (!fin.length) {
      document.getElementById('resultados-grid').innerHTML =
        '<div class="col"><p class="text-body-secondary">No hay partidos finalizados en este momento.</p></div>';
      return;
    }
    document.getElementById('resultados-grid').innerHTML = fin.slice(0, 24).map(function(p) {
      var p1Win = p.ganador === p.jugador1;
      return '<div class="col-12 col-md-6 col-xl-4">'
        + '<div class="card border-0 shadow-sm rounded-4 h-100 match-card"><div class="card-body p-3">'
        + '<div class="d-flex justify-content-between align-items-center mb-2">'
        + '<span class="match-tournament small">' + p.torneo + '</span>'
        + '<span class="badge bg-light text-body-secondary">' + p.circuito + '</span></div>'
        + '<div class="d-flex flex-column gap-1">'
        + '<div class="d-flex justify-content-between align-items-center"><span class="'
        + (p1Win ? 'fw-semibold' : 'text-body-secondary') + '">'
        + (p1Win ? '<i class="bi bi-trophy-fill text-success me-1" style="font-size:.7rem"></i>' : '')
        + p.jugador1 + '</span></div>'
        + '<div class="vs-badge my-1">VS</div>'
        + '<div class="d-flex justify-content-between align-items-center"><span class="'
        + (!p1Win ? 'fw-semibold' : 'text-body-secondary') + '">'
        + (!p1Win ? '<i class="bi bi-trophy-fill text-success me-1" style="font-size:.7rem"></i>' : '')
        + p.jugador2 + '</span></div>'
        + (p.marcador ? '<div class="text-center mt-1 small text-body-secondary">' + p.marcador + '</div>' : '')
        + '</div></div></div></div>';
    }).join('');
  } catch(e) { setEstado('resultados', 'error', e.message); }
}

function extraerPartidos(datos, circuito) {
  if (!datos.events || !datos.events.length) return [];
  var torneo = datos.events[0];
  var nombre = torneo.name || circuito + ' Tour';
  var out    = [];
  if (torneo.groupings) torneo.groupings.forEach(function(g) {
    (g.competitions || []).forEach(function(p) {
      var st = (p.status && p.status.type) || {};
      if (!st.completed) return;
      var c  = p.competitors || [];
      var j1 = c.find(function(x) { return x.order === 1; }) || {};
      var j2 = c.find(function(x) { return x.order === 2; }) || {};
      var n1 = (j1.athlete && j1.athlete.displayName) || 'J1';
      var n2 = (j2.athlete && j2.athlete.displayName) || 'J2';
      var sets = [];
      if (j1.linescores && j2.linescores)
        for (var i = 0; i < j1.linescores.length; i++)
          sets.push((j1.linescores[i].value || 0) + '-' + (j2.linescores[i].value || 0));
      out.push({ circuito: circuito, torneo: nombre, jugador1: n1, jugador2: n2,
        ganador: j1.winner ? n1 : (j2.winner ? n2 : ''), marcador: sets.join(' · '), estado: 'final' });
    });
  });
  return out;
}

// ─────────────────────────────────────────
// JUGADOR — ESPN athletes
// ─────────────────────────────────────────
async function loadPlayer() {
  var key = document.getElementById('inputJugadorIdStats').value.trim();
  if (!key) return;
  setEstado('jugador', 'loading', 'Buscando jugador...');
  document.getElementById('player-result').innerHTML = '';
  try {
    if (playerSource === 'tennis-api') {
      // Jugadora WTA: usar api-tennis.com
      var data = await tennisApiCall({ method: 'get_players', player_key: key });
      if (!data || !data.length) throw new Error('Jugadora no encontrada');
      setEstado('jugador', 'ok', '');
      renderPlayerTennisApi(data[0]);
    } else {
      // Jugador ATP: usar ESPN
      var res = await fetch('https://sports.core.api.espn.com/v2/sports/tennis/athletes/' + key + '?lang=en&region=us');
      if (!res.ok) throw new Error('Jugador no encontrado (HTTP ' + res.status + ')');
      var athlete = await res.json();
      if (!athlete || !athlete.id) throw new Error('Jugador no encontrado');
      setEstado('jugador', 'ok', '');
      renderPlayer(athlete);
    }
  } catch(e) { setEstado('jugador', 'error', e.message); }
}

function renderPlayer(athlete) {
  var nombre  = athlete.fullName    || athlete.displayName || '–';
  var pais    = (athlete.flag && athlete.flag.alt)          ? athlete.flag.alt      : '–';
  var bandera = (athlete.flag && athlete.flag.href)         ? athlete.flag.href     : '';
  var foto    = (athlete.headshot && athlete.headshot.href) ? athlete.headshot.href : '';
  var edad    = athlete.age         || '–';
  var debut   = athlete.debutYear   || '–';
  var hand    = (athlete.hand && athlete.hand.displayValue) ? athlete.hand.displayValue : '–';
  var peso    = athlete.displayWeight || '–';
  var altura  = athlete.displayHeight || '–';
  var status  = (athlete.status && athlete.status.name)     ? athlete.status.name   : '–';

  var link = '';
  if (athlete.links && athlete.links.length) {
    var pc = athlete.links.find(function(l) { return l.rel && l.rel.includes('playercard'); });
    link = pc ? pc.href : athlete.links[0].href;
  }

  var fotoHtml = foto
    ? '<img src="' + foto + '" alt="' + nombre
      + '" class="rounded-circle border" style="width:80px;height:80px;object-fit:cover;border-color:rgba(25,135,84,.4)!important"'
      + ' onerror="this.style.display=\'none\'">'
    : '<span style="font-size:2.5rem">&#127926;</span>';
  var banderaHtml = bandera
    ? '<img src="' + bandera + '" alt="' + pais
      + '" style="width:22px;height:15px;object-fit:cover;border-radius:3px;vertical-align:middle;margin-left:4px">'
    : '';

  document.getElementById('player-result').innerHTML =
    '<div class="card border-0 shadow-sm rounded-4"><div class="card-body p-4">'
    + '<div class="d-flex align-items-center gap-3 mb-4">' + fotoHtml
    + '<div><h3 class="h4 mb-1">' + nombre + '</h3>'
    + '<div class="d-flex flex-wrap gap-2 text-body-secondary small"><span>' + pais + banderaHtml + '</span></div>'
    + (link ? '<a href="' + link + '" target="_blank" rel="noopener noreferrer" class="btn btn-outline-success btn-sm mt-2">Ver perfil ESPN</a>' : '')
    + '</div></div>'
    + '<div class="row g-3">'
    + sbox('summary-green',  'Edad',   edad)
    + sbox('summary-blue',   'País',   pais)
    + sbox('summary-yellow', 'Debut',  debut)
    + sbox('summary-green',  'Mano',   hand)
    + sbox('summary-blue',   'Peso',   peso)
    + sbox('summary-yellow', 'Altura', altura)
    + sbox('summary-green',  'Status', status)
    + '</div></div></div>';
}

function renderPlayerTennisApi(p) {
  var nombre  = p.player_name    || '–';
  var pais    = p.player_country || '–';
  var foto    = p.player_logo    || '';
  var bday    = p.player_bday    || '–';

  var stats   = p.stats || [];
  var singles = stats.filter(function(s) { return s.type === 'singles'; })
                     .sort(function(a, b) { return b.season - a.season; });
  var s = singles[0] || {};

  var won    = parseInt(s.matches_won  || 0);
  var lost   = parseInt(s.matches_lost || 0);
  var titles = parseInt(s.titles       || 0);
  var total  = won + lost;
  var pct    = total ? Math.round(won / total * 100) : 0;
  var rank   = s.rank    || '–';
  var season = s.season  || '–';

  var fotoHtml = foto
    ? '<img src="' + foto + '" alt="' + nombre
      + '" class="rounded-circle border" style="width:80px;height:80px;object-fit:cover;border-color:rgba(25,135,84,.4)!important"'
      + ' onerror="this.style.display=\'none\'">'
    : '<span style="font-size:2.5rem">&#127926;</span>';

  // Superficie con más victorias
  var surfStats = [
    { name: 'Hard',  won: parseInt(s.hard_won  || 0) },
    { name: 'Clay',  won: parseInt(s.clay_won  || 0) },
    { name: 'Grass', won: parseInt(s.grass_won || 0) }
  ].sort(function(a,b){ return b.won - a.won; });
  var bestSurface = surfStats[0].won > 0 ? surfStats[0].name + ' (' + surfStats[0].won + ' vic.)' : '–';

  document.getElementById('player-result').innerHTML =
    '<div class="card border-0 shadow-sm rounded-4"><div class="card-body p-4">'
    + '<div class="d-flex align-items-center gap-3 mb-4">' + fotoHtml
    + '<div><h3 class="h4 mb-1">' + nombre + '</h3>'
    + '<div class="d-flex flex-wrap gap-2 text-body-secondary small">'
    + '<span>🌍 ' + pais + '</span>'
    + '<span>🎂 ' + bday + '</span>'
    + '<span>📅 Temporada ' + season + '</span>'
    + '</div></div></div>'
    + '<div class="row g-3">'
    + sbox('summary-green',  'Ranking WTA', '#' + rank)
    + sbox('summary-green',  'Victorias',   won)
    + sbox('summary-blue',   'Derrotas',    lost)
    + sbox('summary-yellow', '% Victorias', pct + '%')
    + sbox('summary-green',  'Títulos',     titles)
    + sbox('summary-blue',   'Mejor sup.',  bestSurface)
    + '</div></div></div>';
}

function sbox(cls, label, val) {
  return '<div class="col-6 col-md-4 col-lg-3">'
    + '<div class="stats-summary-card ' + cls + ' h-100">'
    + '<span class="summary-label">' + label + '</span>'
    + '<h3 class="summary-value" style="font-size:1.3rem">' + val + '</h3>'
    + '</div></div>';
}

// ─────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────
function setEstado(panel, tipo, msg) {
  var el = document.getElementById('estado-' + panel);
  if (!el) return;
  if (tipo === 'ok') { el.innerHTML = ''; return; }
  if (tipo === 'loading') {
    el.innerHTML = '<div class="d-flex align-items-center gap-2 text-body-secondary">'
      + '<div class="spinner-border spinner-border-sm text-success" role="status"><span class="visually-hidden">Cargando...</span></div>'
      + ' ' + msg + '</div>';
    return;
  }
  el.innerHTML = '<span class="text-danger"><i class="bi bi-exclamation-triangle me-1"></i>' + msg + '</span>';
}

// ─────────────────────────────────────────
// INIT
// ─────────────────────────────────────────
loadRankings('ATP');

new MutationObserver(function() {
  var cache = rankCache[currentLeague];
  if (cache) renderRankings(cache, currentLeague);
}).observe(document.documentElement, { attributes: true, attributeFilter: ['data-bs-theme'] });