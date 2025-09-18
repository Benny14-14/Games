const gridSize = 10;
let grid = [];
let score = 0;

const gridEl = document.getElementById("grid");
const piecesEl = document.getElementById("pieces");
const scoreEl = document.getElementById("score");
const restartBtn = document.getElementById("restart");

function createGrid() {
  grid = Array.from({ length: gridSize }, () => Array(gridSize).fill(0));
  gridEl.innerHTML = "";
  for (let i = 0; i < gridSize * gridSize; i++) {
    const cell = document.createElement("div");
    cell.classList.add("cell");
    gridEl.appendChild(cell);
  }
}
createGrid();

const shapes = [
  [[1]], [[1, 1]], [[1],[1]], [[1,1],[1,1]], 
  [[1,1,1]], [[1],[1],[1]], [[1,1,1],[0,1,0]],
  [[1,0],[1,1]], [[0,1],[1,1]]
];

let draggedPiece = null;
let offsetX = 0, offsetY = 0;

function generatePieces() {
  piecesEl.innerHTML = "";
  for (let i = 0; i < 3; i++) {
    const shape = shapes[Math.floor(Math.random() * shapes.length)];
    const piece = document.createElement("div");
    piece.classList.add("piece");
    piece.style.gridTemplateColumns = `repeat(${shape[0].length}, 30px)`;

    shape.forEach(row => {
      row.forEach(cell => {
        const cellEl = document.createElement("div");
        if (cell) cellEl.classList.add("piece-cell");
        piece.appendChild(cellEl);
      });
    });

    piece.dataset.shape = JSON.stringify(shape);

    // eigenes Drag
    piece.addEventListener("mousedown", startDrag);
    piece.addEventListener("touchstart", startDrag);

    piecesEl.appendChild(piece);
  }
}

function startDrag(e) {
  e.preventDefault();
  const piece = e.currentTarget;
  draggedPiece = piece.cloneNode(true);
  draggedPiece.style.position = "absolute";
  draggedPiece.style.pointerEvents = "none";
  draggedPiece.style.opacity = "0.8";
  document.body.appendChild(draggedPiece);

  const rect = piece.getBoundingClientRect();
  offsetX = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
  offsetY = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;

  moveDrag(e);
  document.addEventListener("mousemove", moveDrag);
  document.addEventListener("mouseup", endDrag);
  document.addEventListener("touchmove", moveDrag, { passive: false });
  document.addEventListener("touchend", endDrag);
}

function moveDrag(e) {
  if (!draggedPiece) return;
  const x = e.touches ? e.touches[0].clientX : e.clientX;
  const y = e.touches ? e.touches[0].clientY : e.clientY;
  draggedPiece.style.left = (x - offsetX) + "px";
  draggedPiece.style.top = (y - offsetY) + "px";
}

function endDrag(e) {
  if (!draggedPiece) return;
  const shape = JSON.parse(draggedPiece.dataset.shape);
  const rect = gridEl.getBoundingClientRect();
  const x = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
  const y = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;

  const gridX = Math.floor((x - rect.left) / 42);
  const gridY = Math.floor((y - rect.top) / 42);

  if (placeShape(shape, gridX, gridY)) {
    updateGrid();
    clearLines();
    generatePieces();
  }

  document.body.removeChild(draggedPiece);
  draggedPiece = null;

  document.removeEventListener("mousemove", moveDrag);
  document.removeEventListener("mouseup", endDrag);
  document.removeEventListener("touchmove", moveDrag);
  document.removeEventListener("touchend", endDrag);
}

function placeShape(shape, x, y) {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c]) {
        if (
          x + c >= gridSize ||
          y + r >= gridSize ||
          x + c < 0 ||
          y + r < 0 ||
          grid[y + r][x + c] === 1
        ) {
          return false;
        }
      }
    }
  }
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c]) grid[y + r][x + c] = 1;
    }
  }
  score += shape.flat().filter(Boolean).length;
  return true;
}

function updateGrid() {
  const cells = gridEl.querySelectorAll(".cell");
  grid.flat().forEach((val, i) => {
    cells[i].classList.toggle("filled", val === 1);
  });
  scoreEl.textContent = "Score: " + score;
}

function clearLines() {
  let cleared = 0;
  for (let r = 0; r < gridSize; r++) {
    if (grid[r].every(c => c === 1)) {
      grid[r] = Array(gridSize).fill(0);
      cleared++;
    }
  }
  for (let c = 0; c < gridSize; c++) {
    if (grid.every(row => row[c] === 1)) {
      for (let r = 0; r < gridSize; r++) grid[r][c] = 0;
      cleared++;
    }
  }
  if (cleared > 0) {
    score += cleared * 10;
    updateGrid();
  }
}

restartBtn.addEventListener("click", () => {
  score = 0;
  createGrid();
  generatePieces();
  updateGrid();
});

generatePieces();
updateGrid();
