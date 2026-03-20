const html = document.documentElement;
const tema = document.getElementById("temaToggle");



function aplicarTemaGuardado() {
	const temaGuardado = localStorage.getItem("temaPagina");

	if (temaGuardado) {
		html.setAttribute("data-bs-theme", temaGuardado);

		if (temaGuardado === "dark") {
			tema.innerHTML = '<i class="bi bi-sun-fill"></i>';
		} else {
			tema.innerHTML = '<i class="bi bi-moon-stars-fill"></i>';
		}
	}
}

function cambiarTema() {
	const temaActual = html.getAttribute("data-bs-theme");
	let temaNuevo = "light";

	if (temaActual === "light") {
		temaNuevo = "dark";
	} else {
		temaNuevo = "light";
	}

	html.setAttribute("data-bs-theme", temaNuevo);
	localStorage.setItem("temaPagina", temaNuevo);

	if (temaNuevo === "dark") {
		tema.innerHTML = '<i class="bi bi-sun-fill"></i>';
	} else {
		tema.innerHTML = '<i class="bi bi-moon-stars-fill"></i>';
	}
}


function guardarComentario() {
	const nombre = document.getElementById("nombreComentario").value;
	const comentario = document.getElementById("textoComentario").value;

	const datos = {
		nombre: nombre,
		comentario: comentario,
	};

	localStorage.setItem("comentarioTenis", JSON.stringify(datos));

	document.getElementById("resultadoComentario").innerHTML =
		'<div class="alert alert-success mt-3">Comentario guardado correctamente.</div>';
}

function verComentario() {
	const datosGuardados = localStorage.getItem("comentarioTenis");

	if (datosGuardados === null) {
		document.getElementById("resultadoComentario").innerHTML =
			'<div class="alert alert-warning mt-3">No hay comentario guardado.</div>';
		return;
	}

	const datos = JSON.parse(datosGuardados);

	document.getElementById("resultadoComentario").innerHTML =
		'<div class="card mt-3">' +
		'<div class="card-body">' +
		'<h5 class="card-title">Comentario guardado</h5>' +
		'<p class="mb-2"><strong>Nombre:</strong> ' + datos.nombre + "</p>" +
		'<p class="mb-0"><strong>Comentario:</strong> ' + datos.comentario + "</p>" +
		"</div>" +
		"</div>";
}

function borrarComentario() {
	localStorage.removeItem("comentarioTenis");

	document.getElementById("nombreComentario").value = "";
	document.getElementById("textoComentario").value = "";

	document.getElementById("resultadoComentario").innerHTML =
		'<div class="alert alert-secondary mt-3">Comentario eliminado.</div>';
}

tema.addEventListener("click", cambiarTema);


aplicarTemaGuardado();
verComentario();


const jugadoresKeys = [1902, 1906, 1905]; // Djokovic, Alcaraz, Sinner 

for (let i = 0; i < jugadoresKeys.length; i++) {

	fetch("https://api.api-tennis.com/tennis/?method=get_players&player_key=" + jugadoresKeys[i] + "&APIkey=fcd8e4e3602130a6a1df894b6c5549eb9ae9a5859896677164ba5fea76b271c5")
		.then((respuesta) => respuesta.json())
		.then((datos) => {

			const jugador = datos.result[0];

			const numero = i + 1;

			document.getElementById("jugador" + numero + "-nombre").textContent =
				jugador.player_name || "N/D";

			document.getElementById("jugador" + numero + "-pais").textContent =
				jugador.player_country || "N/D";

			document.getElementById("jugador" + numero + "-edad").textContent =
				jugador.player_bday || "N/D";

		})
		.catch((error) => {
			console.error("Error:", error);
		});
}