from pydantic import BaseModel
from typing import Optional

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


class JugadorCreateDTO(BaseModel):
    """DTO para crear un nuevo jugador"""
    ranking: Optional[int | str] = None
    nombre: str
    edad: Optional[int | str] = None
    pais: str
    debutYear: Optional[int | str] = None
    link: Optional[str] = "N/D"
    foto: Optional[str] = ""
    bandera: Optional[str] = ""
    athleteRef: Optional[str] = ""
    athleteId: Optional[str] = ""


class JugadorUpdateDTO(BaseModel):
    """DTO para modificar un jugador existente (todos los campos opcionales)"""
    ranking: Optional[int | str] = None
    nombre: Optional[str] = None
    edad: Optional[int | str] = None
    pais: Optional[str] = None
    debutYear: Optional[int | str] = None
    link: Optional[str] = None
    foto: Optional[str] = None
    bandera: Optional[str] = None
    athleteRef: Optional[str] = None
    athleteId: Optional[str] = None