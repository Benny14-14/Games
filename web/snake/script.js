document.addEventListener("keydown", event => {
    const keyMap = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" };
    if (keyMap[event.key]) changeDirection(keyMap[event.key]);
});

let gameSpeed = 150; // Standardwert: Mittel
let gameInterval;

// Funktion zum Starten des Spiels mit der aktuellen Geschwindigkeit
function startGame() {
    if (gameInterval) clearInterval(gameInterval); // Altes Interval löschen
    gameInterval = setInterval(updateGame, gameSpeed);
}

// Geschwindigkeit ändern, wenn der Slider bewegt wird
document.getElementById("speedSlider").addEventListener("input", function() {
    let speedValue = parseInt(this.value);
    let speedLabel = document.getElementById("speedLabel");

    if (speedValue === 1) {
        gameSpeed = 200;
        speedLabel.textContent = "Slow";
        this.style.background = "green";
    } else if (speedValue === 2) {
        gameSpeed = 150;
        speedLabel.textContent = "Medium";
        this.style.background = "yellow";
    } else if (speedValue === 3) {
        gameSpeed = 100;
        speedLabel.textContent = "Fast";
        this.style.background = "red";
    }

    startGame(); // Spielgeschwindigkeit aktualisieren
});

// Starte das Spiel beim Laden mit der Standardgeschwindigkeit
startGame();

