import random
from typing import List, Optional
from fastapi import FastAPI
from pydantic import BaseModel

import heuristics

# uvicorn main:app --host 0.0.0.0 --port 8000

app = FastAPI(title="Tetris RL Skeleton Service")

class CurrentPiece(BaseModel):
    shape: List[List[int]]
    x: int
    y: int
    type: str

class GameState(BaseModel):
    grid: List[List[int]]
    currentPiece: Optional[CurrentPiece] = None
    score: int
    gameOver: bool

class ActionResponse(BaseModel):
    action: str
    rotation: int
    column: int

ACTIONS = ["left", "right", "rotate", "drop", "none"]

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/act", response_model=ActionResponse)
def get_action(state: GameState):
    # Mock RL logic: Return a dummy move
    if state.gameOver:
        return ActionResponse(action="none", rotation=0, column=0)

    # # Simple heuristic or pseudo-random selection for mock move
    # action = random.choice(["left", "right", "rotate", "drop", "none"])
    # return ActionResponse(action=action, rotation=random.randint(0, 3), column=random.randint(0, 9))

    best_rotation, best_column = find_best_move(state.grid, state.currentPiece) if state.currentPiece else (0, 0)

    # Return the target landing spot configuration explicitly
    return ActionResponse(
        action="drop", 
        rotation=best_rotation, 
        column=best_column
    )


def find_best_move(board: list[list[int]], current_piece: CurrentPiece) -> tuple[int, int]:

    best_score = float('-inf')
    best_action = {"action": "drop", "rotation": 0, "column": 0}

    # Iterate over all possible rotations and columns
    for rotation in range(4):
        rotated_shape = heuristics.rotate_piece(current_piece.shape, rotation)
        current_piece_width = len(rotated_shape[0])
        for column in range(len(board[0]) - current_piece_width + 1):

            simulated_board = heuristics.simulate_drop(board, current_piece.shape, rotation, column)
            if simulated_board is None:
                continue

            score = heuristics.evaluate_board(simulated_board)

            if score > best_score:
                best_score = score
                best_action = {"action": "drop", "rotation": rotation, "column": column}

    return best_action["rotation"], best_action["column"]
