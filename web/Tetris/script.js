// Einfaches Tetris - script.js
(() => {
  // Konstanten
  const COLS = 10;
  const ROWS = 20;
  const BLOCK = 30; // Pixelgröße je Zelle
  const LINES_PER_LEVEL = 8;
  const POINTS = { single: 40, double: 100, triple: 300, tetris: 1200 };

  // Canvas + Kontext
  const playCanvas = document.getElementById('playfield');
  const playCtx = playCanvas.getContext('2d');
  const nextCanvas = document.getElementById('next');
  const nextCtx = nextCanvas.getContext('2d');

  // UI Elemente
  const scoreEl = document.getElementById('score');
  const levelEl = document.getElementById('level');
  const linesEl = document.getElementById('lines');
  const restartBtn = document.getElementById('restart');

  // Skalierung für klare Pixel
  playCtx.scale(BLOCK, BLOCK);
  nextCtx.scale(BLOCK/2, BLOCK/2); // kleinere Darstellung für Next

  // Tetris Formen (Tetrominos) als 2D-Matrizen
  const SHAPES = {
    I: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
    J: [[1,0,0],[1,1,1],[0,0,0]],
    L: [[0,0,1],[1,1,1],[0,0,0]],
    O: [[1,1],[1,1]],
    S: [[0,1,1],[1,1,0],[0,0,0]],
    T: [[0,1,0],[1,1,1],[0,0,0]],
    Z: [[1,1,0],[0,1,1],[0,0,0]]
  };

  const COLORS = {
    I: '#06b6d4',
    J: '#6366f1',
    L: '#f59e0b',
    O: '#f97316',
    S: '#10b981',
    T: '#a78bfa',
    Z: '#ef4444'
  };

  // Hilfsfunktionen
  function createMatrix(w, h) {
    const m = [];
    while (h--) m.push(new Array(w).fill(0));
    return m;
  }

  function rotate(matrix) {
    // Rotiert die Matrix im Uhrzeigersinn
    const N = matrix.length;
    const result = createMatrix(N, N);
    for (let y=0;y<N;y++){
      for (let x=0;x<N;x++){
        result[x][N-1-y] = matrix[y][x];
      }
    }
    // trim empty rows/cols for non-square (keep square for simplicity)
    return result;
  }

  // Zufälliges Tetromino
  function randomPiece(){
    const types = Object.keys(SHAPES);
    const t = types[Math.floor(Math.random() * types.length)];
    // Kopie der Form (tiefe Kopie)
    const shape = SHAPES[t].map(row => row.slice());
    return { type: t, matrix: shape, x: Math.floor(COLS/2) - Math.ceil(shape[0].length/2), y: 0 };
  }

  // Spielzustand
  let arena = createMatrix(COLS, ROWS);
  let current = randomPiece();
  let next = randomPiece();
  let score = 0;
  let level = 1;
  let totalLines = 0;
  let dropCounter = 0;
  let dropInterval = 1000; // ms initial
  let lastTime = 0;
  let paused = false;
  let gameOver = false;

  // Zeichnen
  function drawCell(ctx, x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 1, 1);
    // leichter inner-shadow
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 0.04;
    ctx.strokeRect(x+0.02, y+0.02, 0.96, 0.96);
  }

  function drawArena() {
    playCtx.clearRect(0,0, COLS, ROWS);
    // Hintergrundfeld (dunkel)
    playCtx.fillStyle = '#06121a';
    playCtx.fillRect(0,0,COLS,ROWS);

    // Gitterlinien (subtil)
    playCtx.strokeStyle = 'rgba(255,255,255,0.02)';
    playCtx.lineWidth = 0.02;
    for (let x=0;x<=COLS;x++){
      playCtx.beginPath();
      playCtx.moveTo(x,0);
      playCtx.lineTo(x,ROWS);
      playCtx.stroke();
    }
    for (let y=0;y<=ROWS;y++){
      playCtx.beginPath();
      playCtx.moveTo(0,y);
      playCtx.lineTo(COLS,y);
      playCtx.stroke();
    }

    // Zeichne die statischen Blöcke in Arena
    for (let y=0;y<ROWS;y++){
      for (let x=0;x<COLS;x++){
        const val = arena[y][x];
        if (val) {
          drawCell(playCtx, x, y, val);
        }
      }
    }

    // Zeichne das aktive Tetromino
    drawPiece(playCtx, current);
  }

  function drawPiece(ctx, piece){
    const m = piece.matrix;
    for (let y=0;y<m.length;y++){
      for (let x=0;x<m[y].length;x++){
        if (m[y][x]) {
          drawCell(ctx, piece.x + x, piece.y + y, COLORS[piece.type]);
        }
      }
    }
  }

  function drawNext(){
    nextCtx.clearRect(0,0, nextCanvas.width, nextCanvas.height);
    // Hintergrund
    nextCtx.fillStyle = '#06121a';
    nextCtx.fillRect(0,0,4,4); // scaled coords
    // center next piece inside 4x4 area
    const m = next.matrix;
    const offsetX = Math.floor((4 - m[0].length)/2);
    const offsetY = Math.floor((4 - m.length)/2);
    for (let y=0;y<m.length;y++){
      for (let x=0;x<m[y].length;x++){
        if (m[y][x]) {
          nextCtx.fillStyle = COLORS[next.type];
          nextCtx.fillRect(offsetX + x, offsetY + y, 1, 1);
          nextCtx.strokeStyle = 'rgba(0,0,0,0.25)';
          nextCtx.lineWidth = 0.02;
          nextCtx.strokeRect(offsetX + x + 0.02, offsetY + y + 0.02, 0.96, 0.96);
        }
      }
    }
  }

  // Kollisionserkennung
  function collide(arena, piece) {
    const m = piece.matrix;
    for (let y=0;y<m.length;y++){
      for (let x=0;x<m[y].length;x++){
        if (m[y][x]) {
          const px = piece.x + x;
          const py = piece.y + y;
          if (py >= ROWS || px < 0 || px >= COLS || (py >= 0 && arena[py][px])) {
            return true;
          }
        }
      }
    }
    return false;
  }

  // Merge piece into arena (beim Festsetzen)
  function merge(arena, piece) {
    const m = piece.matrix;
    for (let y=0;y<m.length;y++){
      for (let x=0;x<m[y].length;x++){
        if (m[y][x]) {
          const px = piece.x + x;
          const py = piece.y + y;
          if(py >= 0 && py < ROWS && px >= 0 && px < COLS) {
            arena[py][px] = COLORS[piece.type];
          }
        }
      }
    }
  }

  // Reihen löschen
  function sweep() {
    let rowCount = 0;
    outer: for (let y = ROWS - 1; y >= 0; y--) {
      for (let x = 0; x < COLS; x++) {
        if (!arena[y][x]) {
          continue outer;
        }
      }
      // ganze Reihe gefüllt -> lösche sie
      const row = arena.splice(y, 1)[0].fill(0);
      arena.unshift(row);
      y++; // gleiche Reihe nochmal prüfen
      rowCount++;
    }
    if (rowCount > 0) {
      totalLines += rowCount;
      linesEl.textContent = totalLines;
      // Punkte basierend auf Anzahl gelöschter Reihen gleichzeitig
      if (rowCount === 1) score += POINTS.single * level;
      else if (rowCount === 2) score += POINTS.double * level;
      else if (rowCount === 3) score += POINTS.triple * level;
      else if (rowCount >= 4) score += POINTS.tetris * level;
      scoreEl.textContent = score;
      // Level up
      const newLevel = Math.floor(totalLines / LINES_PER_LEVEL) + 1;
      if (newLevel > level) {
        level = newLevel;
        levelEl.textContent = level;
        // erhöhe Schwerkraft (schneller fallen)
        dropInterval = Math.max(100, 1000 - (level - 1) * 100);
      }
    }
  }

  // Bewege Player horizontal/vertikal
  function playerMove(dir) {
    current.x += dir;
    if (collide(arena, current)) {
      current.x -= dir;
    }
  }

  function playerDrop() {
    current.y++;
    if (collide(arena, current)) {
      current.y--;
      merge(arena, current);
      resetPiece();
      sweep();
      if (collide(arena, current)) {
        // wenn nach Hinzufügen neues Piece kollidiert -> Game Over
        gameOver = true;
      }
    }
    dropCounter = 0;
  }

  // Hard drop
  function hardDrop() {
    while (!collide(arena, current)) {
      current.y++;
    }
    current.y--;
    merge(arena, current);
    // Punkte für Hard Drop (z.B. 2 Punkte pro Zeile fallen)
    score += 2 * (ROWS - current.y);
    scoreEl.textContent = score;
    resetPiece();
    sweep();
    if (collide(arena, current)) gameOver = true;
    dropCounter = 0;
  }

  // Rotate with simple wall-kick attempt
  function playerRotate() {
    const original = current.matrix;
    const rotated = rotate(current.matrix);
    current.matrix = rotated;

    // try small kicks
    const kicks = [0, -1, 1, -2, 2];
    let kicked = false;
    for (let i=0;i<kicks.length;i++){
      current.x += kicks[i];
      if (!collide(arena, current)) { kicked = true; break; }
      current.x -= kicks[i];
    }
    if (!kicked) {
      // restore
      current.matrix = original;
    }
  }

  function resetPiece() {
    current = next;
    next = randomPiece();
    drawNext();
    // positionieren
    current.x = Math.floor(COLS/2) - Math.ceil(current.matrix[0].length/2);
    current.y = 0;
    // falls direkt Kollision -> Spielende (handled externally)
  }

  // Eingaben
  document.addEventListener('keydown', event => {
    if (gameOver) return;
    if (event.key === 'ArrowLeft') {
      playerMove(-1);
      drawArena();
    } else if (event.key === 'ArrowRight') {
      playerMove(1);
      drawArena();
    } else if (event.key === 'ArrowDown') {
      playerDrop();
      drawArena();
    } else if (event.key === 'ArrowUp') {
      playerRotate();
      drawArena();
    } else if (event.code === 'Space') {
      event.preventDefault();
      hardDrop();
      drawArena();
    } else if (event.key.toLowerCase() === 'p') {
      paused = !paused;
      if (!paused) {
        // reset timing so it doesn't instantly drop
        lastTime = performance.now();
        requestAnimationFrame(update);
      }
    }
  });

  restartBtn.addEventListener('click', startGame);

  // Game Loop
  function update(time = 0) {
    if (paused || gameOver) {
      if (gameOver) renderGameOver();
      return;
    }
    const delta = time - lastTime;
    lastTime = time;
    dropCounter += delta;
    if (dropCounter > dropInterval) {
      playerDrop();
    }
    drawArena();
    if (!gameOver) requestAnimationFrame(update);
    else renderGameOver();
  }

  function renderGameOver() {
    playCtx.fillStyle = 'rgba(2,6,23,0.7)';
    playCtx.fillRect(0, ROWS/2 - 2, COLS, 4);
    playCtx.fillStyle = '#fff';
    playCtx.font = '0.6px sans-serif';
    playCtx.textAlign = 'center';
    playCtx.fillText('GAME OVER', COLS/2, ROWS/2);
  }

  // Start / Reset
  function startGame() {
    arena = createMatrix(COLS, ROWS);
    current = randomPiece();
    next = randomPiece();
    score = 0;
    level = 1;
    totalLines = 0;
    dropInterval = 1000;
    dropCounter = 0;
    lastTime = performance.now();
    paused = false;
    gameOver = false;
    scoreEl.textContent = score;
    levelEl.textContent = level;
    linesEl.textContent = totalLines;
    drawNext();
    requestAnimationFrame(update);
  }

  // initial
  drawNext();
  drawArena();
  startGame();

})();
