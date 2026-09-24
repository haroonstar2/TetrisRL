export const BOARD_WIDTH = 10;
export const BOARD_VISIBLE_HEIGHT = 20;
export const BOARD_BUFFER_HEIGHT = 4;
export const BOARD_TOTAL_HEIGHT = BOARD_VISIBLE_HEIGHT + BOARD_BUFFER_HEIGHT; // 24

export type PieceType = 'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z';

export interface Piece {
  type: PieceType;
  shape: number[][];
  x: number;
  y: number;
}

export const TETROMINOES: Record<PieceType, { shape: number[][]; color: number }> = {
  I: {
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    color: 1,
  },
  J: {
    shape: [
      [2, 0, 0],
      [2, 2, 2],
      [0, 0, 0],
    ],
    color: 2,
  },
  L: {
    shape: [
      [0, 0, 3],
      [3, 3, 3],
      [0, 0, 0],
    ],
    color: 3,
  },
  O: {
    shape: [
      [4, 4],
      [4, 4],
    ],
    color: 4,
  },
  S: {
    shape: [
      [0, 5, 5],
      [5, 5, 0],
      [0, 0, 0],
    ],
    color: 5,
  },
  T: {
    shape: [
      [0, 6, 0],
      [6, 6, 6],
      [0, 0, 0],
    ],
    color: 6,
  },
  Z: {
    shape: [
      [7, 7, 0],
      [0, 7, 7],
      [0, 0, 0],
    ],
    color: 7,
  },
};

export const COLOR_MAP: Record<number, string> = {
  0: '#111827', // empty cell (slate-900)
  1: '#06b6d4', // I: cyan
  2: '#3b82f6', // J: blue
  3: '#f97316', // L: orange
  4: '#eab308', // O: yellow
  5: '#22c55e', // S: green
  6: '#a855f7', // T: purple
  7: '#ef4444', // Z: red
};

export function createEmptyGrid(): number[][] {
  return Array.from({ length: BOARD_TOTAL_HEIGHT }, () =>
    Array(BOARD_WIDTH).fill(0)
  );
}

export function getRandomPiece(): Piece {
  const keys = Object.keys(TETROMINOES) as PieceType[];
  const type = keys[Math.floor(Math.random() * keys.length)];
  const tetromino = TETROMINOES[type];
  const startX = Math.floor((BOARD_WIDTH - tetromino.shape[0].length) / 2);
  const startY = 0; // Spawn in buffer zone
  return {
    type,
    shape: tetromino.shape,
    x: startX,
    y: startY,
  };
}

export function checkCollision(
  grid: number[][],
  piece: Piece,
  moveX = 0,
  moveY = 0,
  newShape?: number[][]
): boolean {
  const shape = newShape || piece.shape;
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c] !== 0) {
        const targetX = piece.x + c + moveX;
        const targetY = piece.y + r + moveY;

        if (targetX < 0 || targetX >= BOARD_WIDTH || targetY >= BOARD_TOTAL_HEIGHT) {
          return true; // Wall/floor collision
        }
        if (targetY >= 0 && grid[targetY][targetX] !== 0) {
          return true; // Collision with existing block
        }
      }
    }
  }
  return false;
}

export function rotateMatrix(matrix: number[][]): number[][] {
  const N = matrix.length;
  const result: number[][] = Array.from({ length: N }, () => Array(N).fill(0));
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      result[c][N - 1 - r] = matrix[r][c];
    }
  }
  return result;
}

export function mergePieceToGrid(grid: number[][], piece: Piece): number[][] {
  const newGrid = grid.map((row) => [...row]);
  for (let r = 0; r < piece.shape.length; r++) {
    for (let c = 0; c < piece.shape[r].length; c++) {
      if (piece.shape[r][c] !== 0) {
        const targetX = piece.x + c;
        const targetY = piece.y + r;
        if (targetY >= 0 && targetY < BOARD_TOTAL_HEIGHT && targetX >= 0 && targetX < BOARD_WIDTH) {
          newGrid[targetY][targetX] = piece.shape[r][c];
        }
      }
    }
  }
  return newGrid;
}

export function clearLines(grid: number[][]): { newGrid: number[][]; linesCleared: number } {
  const newGrid: number[][] = [];
  let linesCleared = 0;

  for (let r = 0; r < BOARD_TOTAL_HEIGHT; r++) {
    if (grid[r].every((cell) => cell !== 0)) {
      linesCleared++;
    } else {
      newGrid.push([...grid[r]]);
    }
  }

  while (newGrid.length < BOARD_TOTAL_HEIGHT) {
    newGrid.unshift(Array(BOARD_WIDTH).fill(0));
  }

  return { newGrid, linesCleared };
}

export function calculateScore(linesCleared: number): number {
  switch (linesCleared) {
    case 1:
      return 100;
    case 2:
      return 300;
    case 3:
      return 500;
    case 4:
      return 800;
    default:
      return 0;
  }
}
