document.addEventListener("keydown", function(event) {
    switch(event.key) {
        case "ArrowUp":
            if (direction !== "down") direction = "up";
            break;
        case "ArrowDown":
            if (direction !== "up") direction = "down";
            break;
        case "ArrowLeft":
            if (direction !== "right") direction = "left";
            break;
        case "ArrowRight":
            if (direction !== "left") direction = "right";
            break;
    }
});

let gameSpeed = 150; 
let gameInterval;

function startGame() {
    if (gameInterval) clearInterval(gameInterval);
    gameInterval = setInterval(updateGame, gameSpeed);
}

document.getElementById("speedSlider").addEventListener("input", function() {
    let speedValue = parseInt(this.value);
    let speedLabel = document.getElementById("speedLabel");

    if (speedValue === 1) {
        gameSpeed = 200;
        speedLabel.textContent = "Slow";
    } else if (speedValue === 2) {
        gameSpeed = 150;
        speedLabel.textContent = "Medium";
    } else if (speedValue === 3) {
        gameSpeed = 100;
        speedLabel.textContent = "Fast";
    }

    startGame();
});

startGame();

function updateScore() {
    document.getElementById("score").textContent = score;
    if (score > highscore) {
        highscore = score;
        document.getElementById("highscore").textContent = highscore;
        localStorage.setItem("highscore", highscore);
    }
}
