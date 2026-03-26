from pydantic import BaseModel

# Clase DTO (Data Transfer Object) para representar un
# objeto de Curso para cuando se van a mandar datos a 
# un endpoint.


# DTO para jugadores
class JugadorDTO(BaseModel):
    nombre: str
    


