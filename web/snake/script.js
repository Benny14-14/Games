document.addEventListener("keydown", function(event) {
    switch(event.key) {
        case "ArrowUp":
            if (direction !== "DOWN") direction = "UP";
            break;
        case "ArrowDown":
            if (direction !== "UP") direction = "DOWN";
            break;
        case "ArrowLeft":
            if (direction !== "RIGHT") direction = "LEFT";
            break;
        case "ArrowRight":
            if (direction !== "LEFT") direction = "RIGHT";
            break;
    }
});

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


let highscore = localStorage.getItem("snakeHighscore") || 0; // Speichert Highscore im Browser
document.getElementById("highscore").textContent = highscore;
let score = 0;

// Score aktualisieren
function updateScore() {
    document.getElementById("score").textContent = score;
    if (score > highscore) {
        highscore = score;
        document.getElementById("highscore").textContent = highscore;
        localStorage.setItem("snakeHighscore", highscore);
    }
}

// Score erhöhen, wenn Apfel gegessen wird (rufe updateScore() nach jeder Kollision auf)
function eatApple() {
    score += 10; // Punkte für einen Apfel
    updateScore();
}
document.getElementById("speedSlider").addEventListener("input", function() {
    document.getElementById("gameCanvas").focus(); // Fokus zurück auf das Spiel setzen
});
