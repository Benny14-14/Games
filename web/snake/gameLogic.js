const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const gridSize = 20;
let snake = [{ x: 10, y: 10 }];
let direction = "right";
let food = getRandomFoodPosition();
let score = 0;
let highscore = localStorage.getItem("highscore") || 0;

document.getElementById("highscore").textContent = highscore;

function getRandomFoodPosition() {
    return {
        x: Math.floor(Math.random() * (canvas.width / gridSize)),
        y: Math.floor(Math.random() * (canvas.height / gridSize))
    };
}

function updateGame() {
    let head = { ...snake[0] };

    switch (direction) {
        case "up": head.y--; break;
        case "down": head.y++; break;
        case "left": head.x--; break;
        case "right": head.x++; break;
    }

    // Rand überschreiten -> Teleport auf die andere Seite
    if (head.x < 0) head.x = canvas.width / gridSize - 1;
    if (head.x >= canvas.width / gridSize) head.x = 0;
    if (head.y < 0) head.y = canvas.height / gridSize - 1;
    if (head.y >= canvas.height / gridSize) head.y = 0;

    // Prüfen, ob die Schlange sich selbst berührt
    if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        resetGame();
        return;
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
        score++;
        updateScore();
        food = getRandomFoodPosition();
    } else {
        snake.pop();
    }

    drawGame();
}
