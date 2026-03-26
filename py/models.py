from pydantic import BaseModel
from typing import Optional

# Clase DTO (Data Transfer Object) para representar un
# objeto de Curso para cuando se van a mandar datos a 
# un endpoint.


class JugadorDTO(BaseModel):
    ranking: int | str
    nombre: str
    edad: int | str
    pais: str
    debutYear: int | str
    link: Optional[str] = "N/D"
    foto: Optional[str] = ""
    bandera: Optional[str] = ""
    athleteRef: Optional[str] = ""
    athleteId: Optional[str] = ""

class JugadorRespuestaDTO(JugadorDTO):
    guid: str


