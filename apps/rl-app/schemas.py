"""
Data models for the Tetris RL agent using Pydantic.
Includes models for the current piece, game state, and action response.
"""

from pydantic import BaseModel
from typing import List, Optional

BOARD_WIDTH = 10
BOARD_VISIBLE_HEIGHT = 20
BOARD_BUFFER_HEIGHT = 4
BOARD_TOTAL_HEIGHT = BOARD_VISIBLE_HEIGHT + BOARD_BUFFER_HEIGHT

class CurrentPiece(BaseModel):
    shape: List[List[int]]
    x: int
    y: int
    type: str

class GameState(BaseModel):
    grid: List[List[int]]
    currentPiece: Optional[CurrentPiece] = None
    nextPiece: Optional[CurrentPiece] = None
    score: int
    gameOver: bool

class PlacementResult(BaseModel):
    cleared_board: List[List[int]]
    board_before_clear: List[List[int]]
    lines_cleared: int

class StepResult(BaseModel):
    board: List[List[int]]
    reward: float
    done: bool
    info: Optional[dict] = None

class ActionResponse(BaseModel):
    action: str
    rotation: Optional[int] = None
    column: Optional[int] = None

