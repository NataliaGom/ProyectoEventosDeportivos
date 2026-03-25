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

tema.addEventListener("click", cambiarTema);

aplicarTemaGuardado();