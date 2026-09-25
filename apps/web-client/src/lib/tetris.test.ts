import { describe, it, expect } from 'vitest';
import {
  createEmptyGrid,
  checkCollision,
  rotateMatrix,
  mergePieceToGrid,
  clearLines,
  calculateScore,
  BOARD_TOTAL_HEIGHT,
  BOARD_WIDTH,
  Piece,
} from './tetris';

describe('Tetris Logic Unit Tests', () => {
  it('createEmptyGrid should produce grid of correct dimensions', () => {
    const grid = createEmptyGrid();
    expect(grid.length).toBe(BOARD_TOTAL_HEIGHT);
    expect(grid[0].length).toBe(BOARD_WIDTH);
    expect(grid.every((row) => row.every((cell) => cell === 0))).toBe(true);
  });

  it('checkCollision detects boundaries correctly', () => {
    const grid = createEmptyGrid();
    const piece: Piece = {
      type: 'O',
      shape: [
        [4, 4],
        [4, 4],
      ],
      x: 0,
      y: 0,
    };

    // Valid position
    expect(checkCollision(grid, piece, 0, 0)).toBe(false);

    // Left wall collision
    expect(checkCollision(grid, piece, -1, 0)).toBe(true);

    // Right wall collision
    expect(checkCollision(grid, piece, 9, 0)).toBe(true);

    // Bottom floor collision
    expect(checkCollision(grid, piece, 0, BOARD_TOTAL_HEIGHT - 1)).toBe(true);
  });

  it('checkCollision detects stacked blocks', () => {
    const grid = createEmptyGrid();
    grid[5][5] = 1; // Existing block

    const piece: Piece = {
      type: 'O',
      shape: [
        [4, 4],
        [4, 4],
      ],
      x: 4,
      y: 4,
    };

    expect(checkCollision(grid, piece, 0, 0)).toBe(true);
  });

  it('rotateMatrix rotates 2D square matrix clockwise', () => {
    const matrix = [
      [1, 2],
      [3, 4],
    ];
    const rotated = rotateMatrix(matrix);
    expect(rotated).toEqual([
      [3, 1],
      [4, 2],
    ]);
  });

  it('mergePieceToGrid correctly overlays piece onto grid', () => {
    const grid = createEmptyGrid();
    const piece: Piece = {
      type: 'O',
      shape: [
        [4, 4],
        [4, 4],
      ],
      x: 2,
      y: 2,
    };

    const merged = mergePieceToGrid(grid, piece);
    expect(merged[2][2]).toBe(4);
    expect(merged[2][3]).toBe(4);
    expect(merged[3][2]).toBe(4);
    expect(merged[3][3]).toBe(4);
    expect(merged[0][0]).toBe(0);
  });

  it('clearLines removes full rows and inserts empty rows at top', () => {
    const grid = createEmptyGrid();
    // Fill bottom line
    grid[BOARD_TOTAL_HEIGHT - 1] = Array(BOARD_WIDTH).fill(1);

    const { newGrid, linesCleared } = clearLines(grid);
    expect(linesCleared).toBe(1);
    expect(newGrid[BOARD_TOTAL_HEIGHT - 1].every((cell) => cell === 0)).toBe(true);
  });

  it('calculateScore returns correct points', () => {
    expect(calculateScore(1)).toBe(100);
    expect(calculateScore(2)).toBe(300);
    expect(calculateScore(3)).toBe(500);
    expect(calculateScore(4)).toBe(800);
    expect(calculateScore(0)).toBe(0);
  });
});
