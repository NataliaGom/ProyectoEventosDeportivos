# TopTenisStats 

Plataforma web para el seguimiento del tenis profesional masculino (ATP). Consulta rankings en tiempo real, resultados de partidos, estadísticas y perfiles de jugadores del circuito ATP.

---

##  Página web

**[toptenistats.com](https://toptenistats.com)**

---

##  Levantar el frontend

El frontend es estático — no requiere instalación ni servidor adicional.

1. Clona el repositorio:
   ```bash
   git clone https://github.com/NataliaGom/ProyectoEventosDeportivos.git
   cd ProyectoEventosDeportivos
   ```

2. Abre `index.html` directamente en tu navegador, o usa una extensión como **Live Server** en VS Code.

> Todos los datos se obtienen en tiempo real desde la ESPN API pública — no se requiere configuración adicional.

---

##  Levantar el backend

### Requisitos previos
- Python 3.10+

### Instalación

1. Instala las dependencias:
   ```bash
   pip install -r requirements.txt
   ```

2. Levanta el servidor:
   ```bash
   uvicorn main:app --reload
   ```

El servidor queda disponible en `http://localhost:8000`.

---

##  Health endpoint

```
GET http://localhost:8000/health
```

Verifica que la API esté funcionando y muestra cuántos jugadores están cargados en memoria.

La documentación interactiva completa de la API está disponible en:
```
http://localhost:8000/docs
```

---

## 👥 Autores

| | Nombre |
|---|---|
| <img src="https://raw.githubusercontent.com/NataliaGom/ProyectoEventosDeportivos/main/img/nat.png.jpeg"
width="50" style="border-radius:50%"/> | **Natalia Gómez Álvarez** |
| <img src="https://raw.githubusercontent.com/NataliaGom/ProyectoEventosDeportivos/main/img/andreEnUtah.jpg" width="50" style="border-radius:50%"/> | **Andre Herrera Cataño** |
| <img src="https://raw.githubusercontent.com/NataliaGom/ProyectoEventosDeportivos/main/img/sergio.png" width="50" style="border-radius:50%"/> | **Sergio García Ávila** |

