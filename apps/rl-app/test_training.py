import torch
import torch.nn as nn

from env import (
    STEP_PENALTY,
    TERMINAL_PENALTY,
    TETROMINOES,
    TetrisEnv,
    _rotate_shape,
    legal_action_indices,
)
from models import TetrisMLP, encode_state
from replay_buffer import ReplayBuffer
from schemas import CurrentPiece
from train import (
    compute_loss,
    get_best_action,
    get_random_action,
    train_tetris_agent,
)


def make_piece(piece_type: str = "O") -> CurrentPiece:
    return CurrentPiece(
        type=piece_type,
        # Deep copy the shape to avoid mutation issues.
        shape=[row[:] for row in TETROMINOES[piece_type]["shape"]],
        x=4,
        y=0,
    )

class ConstantValueNetwork(nn.Module):
    def __init__(self, value: float = 0.0):
        super().__init__()
        self.value = nn.Parameter(torch.tensor(value))

    def forward(self, inputs: torch.Tensor) -> torch.Tensor:
        return self.value.expand(inputs.size(0), 40)


class PreferHighActionIndexNetwork(nn.Module):
    def __init__(self):
        super().__init__()
        self.scale = nn.Parameter(torch.tensor(1.0))

    def forward(self, inputs: torch.Tensor) -> torch.Tensor:
        return torch.arange(40, device=inputs.device).expand(inputs.size(0), -1) * self.scale


def test_model_outputs_one_value_per_action_from_full_state():
    board = [[0] * 10 for _ in range(24)]
    state = (board, make_piece("O"), make_piece("T"))
    encoded = torch.tensor([encode_state(state)])

    assert encoded.shape == (1, 254)
    assert TetrisMLP()(encoded).shape == (1, 40)


def test_state_encoding_uses_board_and_piece_types():
    board = [[0] * 10 for _ in range(24)]
    board[-1][0] = 1
    board[-1][1] = 7

    encoded = encode_state((board, make_piece("O"), make_piece("T")))

    assert encoded[230] == 1.0
    assert encoded[231] == 1.0
    assert encoded[240:247] == [0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0]
    assert encoded[247:] == [0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0]


def test_greedy_and_random_policies_only_choose_legal_actions():
    board = [[0] * 10 for _ in range(24)]
    piece = make_piece("O")
    state = (board, piece, make_piece("T"))
    model = PreferHighActionIndexNetwork()

    assert get_best_action(state, model) == ("drop", 3, 8)
    for _ in range(50):
        _, _, column = get_random_action(state)
        assert 0 <= column <= 8


def test_replay_buffer_stores_immutable_snapshots():
    board = [[0] * 10 for _ in range(24)]
    piece = make_piece()
    state = (board, piece, make_piece("T"))
    memory = ReplayBuffer(capacity=1)
    memory.push((state, state, 1.0, 0, False))

    board[0][0] = 7
    piece.x = 0

    stored_state, _, _, _, _ = memory.sample(1)[0]
    stored_board, stored_piece, _ = stored_state
    assert stored_board[0][0] == 0
    assert stored_piece.x == 4


def test_loss_trains_the_selected_action_value():
    board = [[0] * 10 for _ in range(24)]
    piece = make_piece()
    state = (board, piece, make_piece("T"))
    model = ConstantValueNetwork()
    target_model = ConstantValueNetwork()
    transition = (state, state, 1.0, 7, True)

    initial_loss = compute_loss([transition], model, target_model, 0.9, torch.device("cpu"))
    assert torch.isclose(initial_loss, torch.tensor(0.5))

    with torch.no_grad():
        model.value.fill_(1.0)
    selected_loss = compute_loss([transition], model, target_model, 0.9, torch.device("cpu"))
    assert torch.isclose(selected_loss, torch.tensor(0.0))


def test_environment_distinguishes_no_clear_and_invalid_terminal_moves():
    env = TetrisEnv(reward_mode="game")
    env.current_piece = make_piece()
    env.next_piece = make_piece("T")

    result = env.step("drop", 0, 0)
    assert result.reward == STEP_PENALTY
    assert not result.done
    assert result.info["lines_cleared"] == 0

    invalid_env = TetrisEnv(reward_mode="game")
    invalid_env.current_piece = make_piece()
    result = invalid_env.step("drop", 0, 10)
    assert result.reward == TERMINAL_PENALTY
    assert result.done
    assert result.info["reason"] == "invalid_column"


def test_heuristic_reward_is_dense_without_a_line_clear():
    env = TetrisEnv(reward_mode="heuristic")
    env.current_piece = make_piece()
    env.next_piece = make_piece("T")

    result = env.step("drop", 0, 0)

    assert result.reward != 0.0
    assert not result.done
    assert result.info["lines_cleared"] == 0


def test_heuristic_reward_is_positive_for_a_line_clear():
    env = TetrisEnv(reward_mode="heuristic")
    env.board[-1][:8] = [1] * 8
    env.current_piece = make_piece("O")
    env.next_piece = make_piece("T")

    result = env.step("drop", 0, 8)

    assert result.reward > 0.0
    assert result.info["lines_cleared"] == 1


def test_legal_actions_include_each_valid_rotation_and_column():
    board = [[0] * 10 for _ in range(24)]
    actions = legal_action_indices(board, make_piece("O"))

    assert len(actions) == 36
    assert 8 in actions
    assert 9 not in actions
    assert 38 in actions
    assert 39 not in actions


def test_rotation_trims_padding_and_exposes_both_board_edges():
    board = [[0] * 10 for _ in range(24)]
    piece = make_piece("I")

    assert _rotate_shape(piece.shape, 1) == [[1], [1], [1], [1]]

    actions = legal_action_indices(board, piece)
    assert 10 in actions  # rotation 1, physical column 0
    assert 19 in actions  # rotation 1, physical column 9


def test_one_episode_training(tmp_path):
    checkpoint = tmp_path / "checkpoint.pth"

    train_tetris_agent(
        episodes=1,
        batch_size=4,
        checkpoint_path=checkpoint,
        max_steps_per_episode=25,
    )

    assert checkpoint.exists()
    state_dict = torch.load(checkpoint, map_location="cpu", weights_only=True)
    assert state_dict["layers.4.weight"].shape == (40, 64)
