const jugadoresKeys = [1902, 1906, 1905];

for (let i = 0; i < jugadoresKeys.length; i++) {
  fetch("https://api.api-tennis.com/tennis/?method=get_players&player_key=" + jugadoresKeys[i] + "&APIkey=TU_API_KEY")
    .then((respuesta) => respuesta.json())
    .then((datos) => {
      const jugador = datos.result[0];
      const numero = i + 1;

      document.getElementById("jugador" + numero + "-nombre").textContent = jugador.player_name || "N/D";
      document.getElementById("jugador" + numero + "-pais").textContent = jugador.player_country || "N/D";
      document.getElementById("jugador" + numero + "-edad").textContent = jugador.player_bday || "N/D";
    })
    .catch((error) => console.error("Error:", error));
}