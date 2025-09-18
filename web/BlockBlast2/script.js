const gridSize = 10;
let grid = [];
let score = 0;

const gridEl = document.getElementById("grid");
const piecesEl = document.getElementById("pieces");
const scoreEl = document.getElementById("score");
const restartBtn = document.getElementById("restart");

// --- Spielfeld initialisieren ---
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

// --- Blöcke generieren ---
const shapes = [
  [[1]], // 1x1
  [[1, 1]], // 1x2
  [[1], [1]], // 2x1
  [[1, 1], [1, 1]], // Quadrat
  [[1, 1, 1]], // 1x3
  [[1], [1], [1]], // 3x1
  [[1, 1, 1], [0, 1, 0]], // T
  [[1, 0], [1, 1]], // L
  [[0, 1], [1, 1]] // umgedrehtes L
];

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
    piece.draggable = true;
    piece.addEventListener("dragstart", dragStart);
    piecesEl.appendChild(piece);
  }
}

// --- Drag & Drop ---
let draggedShape = null;

function dragStart(e) {
  draggedShape = JSON.parse(e.target.dataset.shape);
}

// --- Drop auf Grid ---
gridEl.addEventListener("dragover", e => e.preventDefault());

gridEl.addEventListener("drop", e => {
  const rect = gridEl.getBoundingClientRect();
  const x = Math.floor((e.clientX - rect.left) / 42);
  const y = Math.floor((e.clientY - rect.top) / 42);

  if (placeShape(draggedShape, x, y)) {
    updateGrid();
    clearLines();
    generatePieces();
  }
});

function placeShape(shape, x, y) {
  // passt es ins Grid?
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c]) {
        if (
          x + c >= gridSize ||
          y + r >= gridSize ||
          grid[y + r][x + c] === 1
        ) {
          return false;
        }
      }
    }
  }
  // setzen
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c]) grid[y + r][x + c] = 1;
    }
  }
  score += shape.flat().filter(Boolean).length;
  return true;
}

// --- Grid rendern ---
function updateGrid() {
  const cells = gridEl.querySelectorAll(".cell");
  grid.flat().forEach((val, i) => {
    cells[i].classList.toggle("filled", val === 1);
  });
  scoreEl.textContent = "Score: " + score;
}

// --- Reihen/Spalten löschen ---
function clearLines() {
  let cleared = 0;
  // Reihen
  for (let r = 0; r < gridSize; r++) {
    if (grid[r].every(c => c === 1)) {
      grid[r] = Array(gridSize).fill(0);
      cleared++;
    }
  }
  // Spalten
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

// --- Restart ---
restartBtn.addEventListener("click", () => {
  score = 0;
  createGrid();
  generatePieces();
  updateGrid();
});

generatePieces();
updateGrid();
