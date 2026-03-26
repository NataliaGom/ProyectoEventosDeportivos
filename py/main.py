from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from models import JugadorDTO, JugadorRespuestaDTO, JugadorCreateDTO, JugadorUpdateDTO
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

# Almacenamiento 
jugadores_mem: list[JugadorRespuestaDTO] = []

@app.get("/health")
async def health_check():
    return {"status": "ok"}

@app.post("/jugadores/ranking", response_model=list[JugadorRespuestaDTO])
async def guardar_ranking(jugadores: list[JugadorDTO]):
    """Recibe la lista de jugadores desde la página y la almacena"""
    global jugadores_mem

    jugadores_mem = [
        JugadorRespuestaDTO(**j.model_dump(), guid=generar_guid())
        for j in jugadores
    ]
    return jugadores_mem


@app.post("/jugadores", response_model=JugadorRespuestaDTO, status_code=201)
async def crear_jugador(jugador: JugadorCreateDTO):
    """
    Da de alta un nuevo jugador.
    
    - **nombre**: Nombre del jugador (requerido)
    - **pais**: País del jugador (requerido)
    - **ranking**: Posición en el ranking
    - **edad**: Edad del jugador
    - **debutYear**: Año de debut
    - **link**: URL del perfil
    - **foto**: URL de la foto
    - **bandera**: URL de la bandera
    - **athleteRef**: Referencia del atleta
    - **athleteId**: ID del atleta
    """
    global jugadores_mem
    
    nuevo_jugador = JugadorRespuestaDTO(
        **jugador.model_dump(),
        guid=generar_guid()
    )
    
    jugadores_mem.append(nuevo_jugador)
    
    return nuevo_jugador


@app.put("/jugadores/{guid}", response_model=JugadorRespuestaDTO)
async def modificar_jugador(guid: str, jugador: JugadorUpdateDTO):
    """
    Modifica un jugador existente por su GUID.
    
    Solo se actualizan los campos enviados en la petición.
    """
    global jugadores_mem
    
    jugador_existente = buscar_jugador_por_guid(jugadores_mem, guid)
    
    if not jugador_existente:
        raise HTTPException(
            status_code=404,
            detail=f"No se encontró jugador con guid: {guid}"
        )
    
    datos_actualizados = jugador.model_dump(exclude_unset=True)
    
    for key, value in datos_actualizados.items():
        setattr(jugador_existente, key, value)
    
    return jugador_existente


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


@app.get("/jugadores/ranking", response_model=dict)
async def obtener_ranking_completo(
    pagina: int = Query(1, ge=1, description="Número de página"),
    limite: int = Query(10, ge=1, le=100, description="Elementos por página")
):
    """Devuelve todos los jugadores almacenados con paginación"""
    if not jugadores_mem:
        raise HTTPException(status_code=404, detail="No hay jugadores cargados.")
    
    total = len(jugadores_mem)
    inicio = (pagina - 1) * limite
    fin = inicio + limite
    total_paginas = (total + limite - 1) // limite
    
    return {
        "success": True,
        "data": jugadores_mem[inicio:fin],
        "paginacion": {
            "pagina": pagina,
            "limite": limite,
            "total": total,
            "total_paginas": total_paginas,
            "siguiente": pagina < total_paginas,
            "anterior": pagina > 1
        }
    }


@app.get("/health")
async def health_check():
    """Verifica que la API esté funcionando"""
    return {
        "status": "ok",
        "jugadores_cargados": len(jugadores_mem)
    }