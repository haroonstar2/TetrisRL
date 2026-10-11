"""
Neural network architectures for the Tetris RL agent.
Includes both a Multi-Layer Perceptron (MLP) and a Convolutional Neural Network (CNN) for processing the Tetris board state.
"""
import torch
import torch.nn as nn
from schemas import CurrentPiece

BOARD_CELLS = 24 * 10
PIECE_TYPES = ("I", "J", "L", "O", "S", "T", "Z")
NUM_ACTIONS = 4 * 10
STATE_FEATURES = BOARD_CELLS + 2 * len(PIECE_TYPES)

AgentState = tuple[list[list[int]], CurrentPiece, CurrentPiece]


def encode_state(state: AgentState) -> list[float]:
    """Encode the board plus one-hot current and next piece types."""
    board, current_piece, next_piece = state

    flattened_board = []
    for row in board:
        for cell in row:
            flattened_board.append(1.0 if cell != 0 else 0.0)

    if len(flattened_board) != BOARD_CELLS:
        raise ValueError(f"Expected {BOARD_CELLS} board cells, got {len(flattened_board)}")

    try:
        current_index = PIECE_TYPES.index(current_piece.type)
        next_index = PIECE_TYPES.index(next_piece.type)
    except ValueError as error:
        raise ValueError("Piece type must be one of I, J, L, O, S, T, or Z") from error

    current_encoding = [0.0] * len(PIECE_TYPES)
    next_encoding = [0.0] * len(PIECE_TYPES)
    current_encoding[current_index] = 1.0
    next_encoding[next_index] = 1.0
    return flattened_board + current_encoding + next_encoding


# VERY IMPORTANT
# The networks take binary board occupancy plus one-hot encodings for the
# current and next pieces, and output one Q-value for each rotation/column pair.

class TetrisMLP(nn.Module):
    def __init__(self):
        super(TetrisMLP, self).__init__()

        self.layers = nn.Sequential(
            nn.Linear(STATE_FEATURES, 128),
            nn.ReLU(),
            nn.Linear(128, 64),
            nn.ReLU(),
            nn.Linear(64, NUM_ACTIONS)
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.layers(x)

class TetrisGridCNN(nn.Module):
    def __init__(self):
        super(TetrisGridCNN, self).__init__()
        # Input shape: 1 channel, 24 rows, 10 cols
        # Output = (Input_size - Kernel_size + 2*Padding)/Stride + 1 
        self.convs = nn.Sequential(
            nn.Conv2d(1, 32, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.Conv2d(32, 64, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.Flatten()
        )
        # Calculate flattened size: 64 channels * 24 rows * 10 cols = 15,360
        self.fc = nn.Sequential(
            nn.Linear(64 * 24 * 10 + 2 * len(PIECE_TYPES), 128),
            nn.ReLU(),
            nn.Linear(128, NUM_ACTIONS)
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        board = x[:, :BOARD_CELLS].reshape(-1, 1, 24, 10)
        pieces = x[:, BOARD_CELLS:]
        features = torch.cat((self.convs(board), pieces), dim=1)
        return self.fc(features)
