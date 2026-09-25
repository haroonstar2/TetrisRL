import random
from typing import List, Optional
from fastapi import FastAPI
from pydantic import BaseModel

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

ACTIONS = ["left", "right", "rotate", "drop", "none"]

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/act", response_model=ActionResponse)
def get_action(state: GameState):
    # Mock RL logic: Return a dummy move
    if state.gameOver:
        return ActionResponse(action="none")

    # Simple heuristic or pseudo-random selection for mock move
    action = random.choice(["left", "right", "rotate", "drop", "none"])
    return ActionResponse(action=action)
