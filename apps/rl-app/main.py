import torch
from pathlib import Path
from fastapi import FastAPI
from schemas import GameState, ActionResponse
from models import TetrisMLP
from train import get_best_action

# uvicorn main:app --host 0.0.0.0 --port 8000

app = FastAPI(title="Tetris RL Skeleton Service")

# Load trained weights once on startup
model = TetrisMLP()
checkpoint_path = Path(__file__).resolve().parent / "models" / "tetris_checkpoint.pth"
if checkpoint_path.exists():
    try:
        model.load_state_dict(
            torch.load(checkpoint_path, map_location="cpu", weights_only=True)
        )
        print("\033[1;32mModel checkpoint loaded successfully.\033[0m")
    except RuntimeError:
        print("\033[1;31mFailed to load model checkpoint.\033[0m")
model.eval()  # Set to evaluation mode

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/act", response_model=ActionResponse, response_model_exclude_none=True)
def get_action(state: GameState):
    if state.gameOver or state.currentPiece is None or state.nextPiece is None:
        return ActionResponse(action="none")

    action, rotation, column = get_best_action(
        (state.grid, state.currentPiece, state.nextPiece), model
    )
    return ActionResponse(action=action, rotation=rotation, column=column)
