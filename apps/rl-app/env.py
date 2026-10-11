"""
Tetris environment for reinforcement learning.
- reset(): Resets the environment to the initial state and returns the initial observation.
- step(action, rotation, column): Executes the given action in the environment and returns a tuple (next_state, reward, done, info).
- render(): Renders the current state of the environment.

"""
import random

from heuristics import evaluate_board
from schemas import BOARD_WIDTH, BOARD_TOTAL_HEIGHT, CurrentPiece, PlacementResult, StepResult
from typing import Optional, Tuple

TETROMINOES: dict[str, dict[str, list[list[int]] | int]] = {
  "I": {
    "shape": [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    "color": 1,
  },
  "J": {
    "shape": [
      [2, 0, 0],
      [2, 2, 2],
      [0, 0, 0],
    ],
    "color": 2,
  },
  "L": {
    "shape": [
      [0, 0, 3],
      [3, 3, 3],
      [0, 0, 0],
    ],
    "color": 3,
  },
  "O": {
    "shape": [
      [4, 4],
      [4, 4],
    ],
    "color": 4,
  },
  "S": {
    "shape": [
      [0, 5, 5],
      [5, 5, 0],
      [0, 0, 0],
    ],
    "color": 5,
  },
  "T": {
    "shape": [
      [0, 6, 0],
      [6, 6, 6],
      [0, 0, 0],
    ],
    "color": 6,
  },
  "Z": {
    "shape": [
      [7, 7, 0],
      [0, 7, 7],
      [0, 0, 0],
    ],
    "color": 7,
  },
}

LINE_REWARDS = {lines: float(lines * lines) for lines in range(5)}
STEP_REWARD = 1


def _rotate_shape(piece_shape: list[list[int]], rotations: int) -> list[list[int]]:
    rotated = [row[:] for row in piece_shape]

    n = len(piece_shape)

    for _ in range(rotations % 4):
        new_rotated = [[0] * n for _ in range(n)]
        for r in range(n):
            for c in range(n):
                new_rotated[c][n - 1 - r] = rotated[r][c]
        rotated = new_rotated

    occupied_rows = [
        row_index
        for row_index, row in enumerate(rotated)
        if any(cell != 0 for cell in row)
    ]
    occupied_columns = [
        column_index
        for column_index in range(len(rotated[0]))
        if any(row[column_index] != 0 for row in rotated)
    ]

    if not occupied_rows or not occupied_columns:
        return rotated

    top, bottom = min(occupied_rows), max(occupied_rows)
    left, right = min(occupied_columns), max(occupied_columns)
    return [row[left:right + 1] for row in rotated[top:bottom + 1]]

def _shape_collides(
    board: list[list[int]], shape: list[list[int]], column: int, row: int
) -> bool:
    for row_offset, shape_row in enumerate(shape):
        for column_offset, cell in enumerate(shape_row):
            if cell == 0:
                continue
            target_x = column + column_offset
            target_y = row + row_offset
            if target_x < 0 or target_x >= BOARD_WIDTH or target_y >= BOARD_TOTAL_HEIGHT:
                return True
            if target_y >= 0 and board[target_y][target_x] != 0:
                return True
    return False


def _simulate_placement(
    board: list[list[int]], piece: CurrentPiece, rotation: int, column: int
) -> Optional[PlacementResult]:
    """Return (cleared board, board before clearing, lines) for a grouped action."""
    shape = _rotate_shape(piece.shape, rotation)
    if _shape_collides(board, shape, column, 0):
        return None

    # Find the row where the piece will land
    landing_row = 0
    while not _shape_collides(board, shape, column, landing_row + 1):
        landing_row += 1

    board_before_clear = [row[:] for row in board]
    for row_offset, shape_row in enumerate(shape):
        for column_offset, cell in enumerate(shape_row):
            if cell != 0:
                board_before_clear[landing_row + row_offset][column + column_offset] = cell

    remaining_rows = []

    # Keep rows that are not completely filled
    for row in board_before_clear:
        if any(cell == 0 for cell in row):
            remaining_rows.append(row[:])

    lines_cleared = BOARD_TOTAL_HEIGHT - len(remaining_rows)

    cleared_board = (
        [[0 for _ in range(BOARD_WIDTH)] for _ in range(lines_cleared)]
        + remaining_rows
    )
    return PlacementResult(
        cleared_board=cleared_board,
        board_before_clear=board_before_clear,
        lines_cleared=lines_cleared,
    )


def legal_action_indices(board: list[list[int]], piece: CurrentPiece) -> list[int]:
    """Return the rotation/column action indices that can be placed legally."""
    
    res = []

    for rotation in range(4):
        for column in range(BOARD_WIDTH):
            if _simulate_placement(board, piece, rotation, column) is not None:
                res.append(rotation * BOARD_WIDTH + column)
    
    return res

class TetrisEnv:
    def __init__(self):

        self.board = [[0 for _ in range(BOARD_WIDTH)] for _ in range(BOARD_TOTAL_HEIGHT)]
        self.current_piece = None
        self.next_piece = None
        self.score = 0
        self.done = False

        self.reset()

    def _get_random_piece(self) -> CurrentPiece:

        piece_type = random.choice(list(TETROMINOES.keys()))
        tetromino = TETROMINOES[piece_type]
        start_x = (BOARD_WIDTH - len(tetromino["shape"][0])) // 2
        start_y = 0

        return CurrentPiece(
          type=piece_type,
          shape=[row[:] for row in tetromino["shape"]],
          x=start_x,
          y=start_y,
        )

    def reset(self) -> list[list[int]]:
        self.board = [[0 for _ in range(BOARD_WIDTH)] for _ in range(BOARD_TOTAL_HEIGHT)]
        self.current_piece = None
        self.next_piece = None
        self.score = 0
        self.done = False
        return self.board

    def step(self, action: str, rotation: int, column: int, current_step: int) -> StepResult:
      """
      Perform a step in the Tetris environment based on the given action, rotation, and column.

      Args:
          action (str): The action to perform ("drop" is the only supported action).
          rotation (int): The number of 90-degree clockwise rotations to apply to the current piece.
          column (int): The target column to place the piece.

      Returns:
          StepResult: The updated board, reward, terminal flag, and step metadata.
      """
      if self.done:
        print("Game is already over.")
        return StepResult(
          board=self.board,
          reward=0,
          done=True,
          info={"lines_cleared": 0},
        )

      # Make sure to set the pieces if they are not already set
      if self.current_piece is None:
        self.current_piece = self._get_random_piece()

      if self.next_piece is None:
        self.next_piece = self._get_random_piece()

      # Ignore any action that is not "drop"
      if action != "drop":
        return StepResult(
          board=self.board,
          reward=0,
          done=self.done,
          info={"lines_cleared": 0},
        )

      if column < 0 or column >= BOARD_WIDTH:
        print("Invalid column specified.")
        self.done = True
        return StepResult(
          board=self.board,
          reward=0,
          done=True,
          info={"lines_cleared": 0, "reason": "invalid_column"},
        )

      # Simulate the placement of the current piece on the board
      result = _simulate_placement(self.board, self.current_piece, rotation % 4, column)

      if result is None:
        print("\033[1;31mCollision occurred at spawn.\033[0m")
        self.done = True
        return StepResult(
          board=self.board,
          reward=0,
          done=True,
          info={"lines_cleared": 0, "reason": "spawn_collision"},
        )

      # Calculate the fitness of the board before and after the placement
      previous_fitness = evaluate_board(self.board)
      next_board = result.cleared_board
      lines_cleared = result.lines_cleared

      reward = (evaluate_board(next_board, lines_cleared) - previous_fitness) + LINE_REWARDS[lines_cleared]

      if self.done:
        reward = -10

      self.board = next_board

      # Update the current and next pieces, and check if the game is done
      self.current_piece = self.next_piece
      self.next_piece = self._get_random_piece()
      self.done = _shape_collides(
        self.board,
        self.current_piece.shape,
        self.current_piece.x,
        self.current_piece.y,
      )

      return StepResult(
        board=self.board,
        reward=reward,
        done=self.done,
        info={
          "lines_cleared": lines_cleared,
          "reward": reward,
        }
      )

    def render(self) -> None:
        for row in self.board:
            print(" ".join(str(cell) for cell in row))
        print(f"Score: {self.score}")
