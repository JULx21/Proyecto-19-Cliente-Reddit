// ---------- Cosas del HTML que vamos a usar ----------
const contenedorCarriles = document.getElementById("carriles");
const popup = document.getElementById("popup");
const inputSubreddit = document.getElementById("inputSubreddit");
const mensaje = document.getElementById("mensaje");
const btnAbrir = document.getElementById("btnAbrir");
const btnAgregar = document.getElementById("btnAgregar");
const btnCerrar = document.getElementById("btnCerrar");

// Lista con los nombres de los subreddits que tiene el usuario
// Si ya había guardados en localStorage los traemos, si no empieza vacía
let subreddits = JSON.parse(localStorage.getItem("subreddits")) || [];

// ---------- localStorage ----------
// Guarda la lista en el navegador (solo guarda texto, por eso el JSON.stringify)
function guardar() {
    localStorage.setItem("subreddits", JSON.stringify(subreddits));
}

// ---------- Pedir los posts a Reddit ----------
// async/await es para esperar la respuesta de internet sin congelar la página
async function traerPosts(nombre) {
    const respuesta = await fetch("https://www.reddit.com/r/" + nombre + ".json");

    // Si Reddit responde con error (404 = no existe, 403 = bloqueado, etc.)
    if (!respuesta.ok) {
        throw new Error("No se pudo cargar r/" + nombre + " (error " + respuesta.status + ")");
    }

    const datos = await respuesta.json();
    const posts = datos.data.children;

    // Si no trae posts, el subreddit no existe o está vacío
    if (posts.length === 0) {
        throw new Error("El subreddit r/" + nombre + " no existe o no tiene publicaciones");
    }

    return posts;
}

// ---------- Dibujar un carril en la pantalla ----------
function crearCarril(nombre) {
    // Creamos la caja del carril
    const carril = document.createElement("div");
    carril.className = "carril";
    carril.id = "carril-" + nombre;

    // Título + botón de los 3 puntitos + menú (oculto al inicio)
    carril.innerHTML =
        '<div class="carril-titulo">' +
            "<span>/r/" + nombre + "</span>" +
            '<button class="btn-menu">⋮</button>' +
        "</div>" +
        '<div class="menu oculto">' +
            '<button class="btn-refresh">Refresh</button>' +
            '<button class="btn-delete">Delete</button>' +
        "</div>" +
        '<div class="lista"></div>';

    const btnMenu = carril.querySelector(".btn-menu");
    const menu = carril.querySelector(".menu");

    // Abrir y cerrar el menú
    btnMenu.addEventListener("click", function () {
        menu.classList.toggle("oculto");
    });

    // Refresh: vuelve a pedir los datos
    carril.querySelector(".btn-refresh").addEventListener("click", function () {
        menu.classList.add("oculto");
        cargarCarril(nombre);
    });

    // Delete: borra el carril de la pantalla y de la lista guardada
    carril.querySelector(".btn-delete").addEventListener("click", function () {
        carril.remove();
        // filter deja todos menos el que borramos
        subreddits = subreddits.filter(function (s) {
            return s !== nombre;
        });
        guardar();
    });

    contenedorCarriles.appendChild(carril);
}

// ---------- Llenar un carril con los posts ----------
async function cargarCarril(nombre) {
    const lista = document.querySelector("#carril-" + nombre + " .lista");

    // Estado de carga
    lista.innerHTML = '<p class="estado">Cargando...</p>';

    try {
        const posts = await traerPosts(nombre);

        lista.innerHTML = ""; // limpiamos el "Cargando..."

        // Recorremos cada post y lo mostramos
        posts.forEach(function (p) {
            const info = p.data; // aquí está el título, autor, votos, etc.

            const div = document.createElement("div");
            div.className = "post";
            div.innerHTML =
                '<div class="votos">▲<br>' + info.ups + "</div>" +
                "<div>" +
                    '<a href="https://www.reddit.com' + info.permalink + '" target="_blank">' + info.title + "</a>" +
                    '<p class="autor">por u/' + info.author + "</p>" +
                "</div>";

            lista.appendChild(div);
        });
    } catch (error) {
        // Si algo falla mostramos el error dentro del carril
        lista.innerHTML = '<p class="estado error">' + error.message + "</p>";
    }
}

// ---------- Agregar un subreddit nuevo ----------
async function agregarSubreddit() {
    // trim() quita espacios, toLowerCase() lo pone en minúscula
    const nombre = inputSubreddit.value.trim().toLowerCase();

    if (nombre === "") {
        mensaje.textContent = "Escribe un nombre de subreddit";
        return;
    }

    // Evitar carriles repetidos
    if (subreddits.includes(nombre)) {
        mensaje.textContent = "Ese subreddit ya está agregado";
        return;
    }

    mensaje.textContent = "Verificando...";

    try {
        // Primero verificamos que exista (si no existe, salta al catch)
        await traerPosts(nombre);

        subreddits.push(nombre);
        guardar();
        crearCarril(nombre);
        cargarCarril(nombre);
        cerrarPopup();
    } catch (error) {
        // Mensaje de error claro dentro del popup
        mensaje.textContent = error.message;
    }
}

// ---------- Popup ----------
function abrirPopup() {
    inputSubreddit.value = "";
    mensaje.textContent = "";
    popup.classList.remove("oculto");
    inputSubreddit.focus();
}

function cerrarPopup() {
    popup.classList.add("oculto");
}

btnAbrir.addEventListener("click", abrirPopup);
btnCerrar.addEventListener("click", cerrarPopup);
btnAgregar.addEventListener("click", agregarSubreddit);

// Poder agregar también con la tecla Enter
inputSubreddit.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
        agregarSubreddit();
    }
});

// ---------- Al abrir la página: restaurar los carriles guardados ----------
subreddits.forEach(function (nombre) {
    crearCarril(nombre);
    cargarCarril(nombre);
});
