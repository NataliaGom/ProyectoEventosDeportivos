
// *****************************************//
//               COMENTARIOS                //
// *****************************************//

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

verComentario();





