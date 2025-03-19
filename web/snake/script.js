document.addEventListener("keydown", event => {
    const keyMap = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" };
    if (keyMap[event.key]) changeDirection(keyMap[event.key]);
});

setInterval(updateGame, 150);
