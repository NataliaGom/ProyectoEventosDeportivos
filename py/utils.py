import uuid
from typing import Optional
from models import JugadorDTO

def generar_guid():
    return str(uuid.uuid4())

def buscar_jugador(jugadores: list[JugadorDTO], id: str) -> Optional[JugadorDTO]:
    """ Busca por número de ranking o por athleteId """
    # ranking numérico
    if id.isdigit():
        resultado = next(
            (j for j in jugadores if str(j.ranking) == id),
            None
        )
        if resultado:
            return resultado
    
    # Si no encontró por ranking, busca por athleteId
    return next(
        (j for j in jugadores if j.athleteId == id),
        None
    )

def buscar_jugador_por_guid(jugadores: list, guid: str):
    return next(
        (j for j in jugadores if j.guid == guid),
        None
    )


