from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from models import JugadorDTO, JugadorRespuestaDTO
from utils import generar_guid, buscar_jugador, buscar_jugador_por_guid

app = FastAPI(title="Eventos Deportivos API")

origins = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://toptenistats.com",
        "https://www.toptenistats.com"
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)
@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "jugadores_cargados": len(jugadores_mem)
    }

# Almacenamiento 
jugadores_mem: list[JugadorRespuestaDTO] = []


@app.post("/jugadores/ranking", response_model=list[JugadorRespuestaDTO])
async def guardar_ranking(jugadores: list[JugadorDTO]):
    """Recibe la lista de jugadores desde la página y la almacena"""
    global jugadores_mem  # usamos global porque está dentro de una función y queremos reasignar una variable que vive fuera. Para no hacer .append()

    # Usamos model.jump() para convertir el modelo a diccionario 
    # con **j pasa cada clave del diccionario como argumento nombrado al constructor
    jugadores_mem = [
        JugadorRespuestaDTO(**j.model_dump(), guid=generar_guid())
        for j in jugadores
    ]
    return jugadores_mem


@app.get("/jugadores/ranking/{rank}", response_model=JugadorRespuestaDTO)
async def obtener_jugador(rank: str):
    """
    Busca un jugador por:
    - número de ranking (ej: /jugadores/ranking/1)
    """
    if not jugadores_mem:
        raise HTTPException(
            status_code=404,
            detail="No hay jugadores cargados. Envía primero el ranking desde el frontend."
        )

    jugador = buscar_jugador(jugadores_mem, rank)

    if not jugador:
        raise HTTPException(
            status_code=404,
            detail=f"No se encontró jugador con ranking: {rank}"
        )

    return jugador

@app.get("/jugadores/guid/{guid}", response_model=JugadorRespuestaDTO)
async def obtener_jugador_por_guid(guid: str):
    if not jugadores_mem:
        raise HTTPException(
            status_code=404,
            detail="No hay jugadores cargados."
        )

    jugador = buscar_jugador_por_guid(jugadores_mem, guid)

    if not jugador:
        raise HTTPException(
            status_code=404,
            detail=f"No se encontró jugador con guid: {guid}"
        )

    return jugador

@app.get("/jugadores/ranking", response_model=list[JugadorRespuestaDTO])
async def obtener_ranking_completo():
    """Devuelve todos los jugadores almacenados"""
    if not jugadores_mem:
        raise HTTPException(status_code=404, detail="No hay jugadores cargados.")
    return jugadores_mem

