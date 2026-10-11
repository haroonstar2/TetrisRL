import random
from pathlib import Path
import torch
import torch.nn as nn
import torch.optim as optim

from env import TetrisEnv, legal_action_indices
from replay_buffer import ReplayBuffer
from models import AgentState, TetrisMLP, encode_state
from schemas import BOARD_WIDTH


# Takes the action index (combination of rotation and column) and decodes it into seperate rotation and column.
def decode_action(action_index: int) -> tuple[str, int, int]:
    rotation, column = divmod(action_index, BOARD_WIDTH)
    return "drop", rotation, column


def get_random_action(
    state: AgentState,
) -> tuple[str, int, int]:
    board, current_piece, _ = state
    legal_actions = legal_action_indices(board, current_piece)
    if not legal_actions:
        return "drop", 0, -1
    return decode_action(random.choice(legal_actions))


def get_best_action(
    state: AgentState, model: nn.Module
) -> tuple[str, int, int]:
    """Choose the highest-valued legal rotation/column action for the state."""
    board, current_piece, _ = state
    legal_actions = legal_action_indices(board, current_piece)
    if not legal_actions:
        return "drop", 0, -1

    device = next(model.parameters()).device
    state_tensor = torch.tensor(
        [encode_state(state)],
        dtype=torch.float32,
        device=device,
    )

    with torch.no_grad():
        q_values = model(state_tensor).squeeze(0)
        masked_q_values = torch.full_like(q_values, float("-inf"))
        masked_q_values[legal_actions] = q_values[legal_actions]
        action_index = int(masked_q_values.argmax().item())

    return decode_action(action_index)


def _encode_batch(
    states: tuple[AgentState, ...] | list[AgentState],
    device: torch.device,
) -> torch.Tensor:
    return torch.tensor(
        [encode_state(state) for state in states],
        dtype=torch.float32,
        device=device,
    )

def compute_loss(
    batch: list[tuple],
    model: nn.Module,
    target_model: nn.Module,
    gamma: float,
    device: torch.device,
) -> torch.Tensor:
    """Compute Bellman loss for selected actions."""

    states, next_states, rewards, actions, dones = zip(*batch)

    state_tensors = _encode_batch(states, device)
    next_state_tensors = _encode_batch(next_states, device)
    reward_tensors = torch.tensor(rewards, dtype=torch.float32, device=device)
    done_tensors = torch.tensor(dones, dtype=torch.float32, device=device)
    action_tensors = torch.tensor(actions, dtype=torch.long, device=device)

    q_values = model(state_tensors).gather(1, action_tensors.unsqueeze(1)).squeeze(1)

    with torch.no_grad():
        max_next_values = []
        next_q_values = target_model(next_state_tensors)
        for index, (next_state, done) in enumerate(zip(next_states, dones)):
            
            if done:
                max_next_values.append(0.0)
                continue

            next_board, next_piece, _ = next_state
            legal_actions = legal_action_indices(next_board, next_piece)
            
            if not legal_actions:
                max_next_values.append(0.0)
                continue

            masked_q_values = torch.full_like(next_q_values[index], float("-inf"))
            masked_q_values[legal_actions] = next_q_values[index, legal_actions]
            max_next_values.append(float(masked_q_values.max().item()))

        max_next_q_values = torch.tensor(
            max_next_values, dtype=torch.float32, device=device
        )
        target_q_values = reward_tensors + gamma * max_next_q_values * (1 - done_tensors)

    # return nn.SmoothL1Loss()(q_values, target_q_values)
    return nn.MSELoss()(q_values, target_q_values)

def train_tetris_agent(
    episodes: int = 500,
    batch_size: int = 128,
    checkpoint_path: Path | None = None,
    initial_checkpoint_path: Path | None = None,
    max_steps_per_episode: int = 5_000,
    epsilon_min: float = 0.01,
    epsilon_decay: float = 0.995,
) -> None:
    """
    Train the Tetris agent.
    
    The agent is trained using epsilon-greedy exploration.
    The training loop updates the model using the Bellman equation and periodically evaluates the agent's performance.

    Inputs:
        episodes: Number of training episodes.
        batch_size: Size of the mini-batch for optimization.
        checkpoint_path: Path to save the model checkpoint.
        initial_checkpoint_path: Path to load the initial model checkpoint.
        evaluation_interval: Interval (in episodes) for evaluating the agent.
        evaluation_episodes: Number of episodes for evaluation.
        max_steps_per_episode: Maximum steps per episode.
        epsilon_min: Minimum exploration rate.
        epsilon_decay: Multiplicative decay applied after each episode.

    Returns:
        None
    """
    if not 0.0 <= epsilon_min <= 1.0:
        raise ValueError("epsilon_min must be between 0 and 1")
    if not 0.0 < epsilon_decay <= 1.0:
        raise ValueError("epsilon_decay must be greater than 0 and at most 1")
    
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")

    model = TetrisMLP().to(device)

    # Load the initial model checkpoint if provided
    if initial_checkpoint_path is not None:
        model.load_state_dict(
            torch.load(initial_checkpoint_path, map_location=device, weights_only=True)
        )
    
    target_model = TetrisMLP().to(device)
    target_model.load_state_dict(model.state_dict())
    target_model.eval()

    # optimizer = optim.RMSprop(model.parameters(), lr=1e-4, alpha=0.95)
    optimizer = optim.Adam(model.parameters(), lr=1e-4)
    memory = ReplayBuffer(capacity=10_000)

    gamma = 0.99
    target_update_steps = 1_000

    epsilon = 1.0
    optimization_steps = 0

    print("Starting training loop...")
    for episode in range(episodes):
        env = TetrisEnv()
        state = env.reset()
        env.current_piece = env._get_random_piece()
        env.next_piece = env._get_random_piece()
        done = False

        episode_losses: list[float] = []
        episode_reward = 0.0
        episode_lines = 0
        episode_steps = 0
        step_count = 0

        while not done and episode_steps < max_steps_per_episode:
           
            state_snapshot: AgentState = (
                [row[:] for row in state],
                env.current_piece.model_copy(deep=True),
                env.next_piece.model_copy(deep=True),
            )

            legal_actions = legal_action_indices(
                state_snapshot[0], state_snapshot[1]
            )
            if not legal_actions:
                break

            if random.random() < epsilon:
                action, rotation, column = get_random_action(state_snapshot)
            else:
                action, rotation, column = get_best_action(state_snapshot, model)

            # Extract the result of the chosen action from the environment.
            step_result = env.step(action, rotation, column, step_count)
            next_state = step_result.board
            reward = step_result.reward
            done = step_result.done
            info = step_result.info

            next_state_snapshot: AgentState = (
                [row[:] for row in next_state],
                env.current_piece.model_copy(deep=True),
                env.next_piece.model_copy(deep=True),
            )

            action_index = rotation * BOARD_WIDTH + column

            memory.push(
                (
                    state_snapshot,
                    next_state_snapshot,
                    reward,
                    action_index,
                    done,
                )
            )

            state = next_state_snapshot[0]
            episode_reward += reward
            episode_lines += info["lines_cleared"]
            episode_steps += 1
            step_count += 1

            if len(memory) >= batch_size:
                batch = memory.sample(batch_size)
                loss = compute_loss(batch, model, target_model, gamma, device)
                optimizer.zero_grad()
                loss.backward()
                nn.utils.clip_grad_norm_(model.parameters(), max_norm=10.0)
                optimizer.step()

                optimization_steps += 1
                episode_losses.append(loss.item())

                if optimization_steps % target_update_steps == 0:
                    target_model.load_state_dict(model.state_dict())


        average_loss = (
            sum(episode_losses) / len(episode_losses) if episode_losses else None
        )

        if epsilon > epsilon_min:
            epsilon = max(epsilon_min, epsilon * epsilon_decay)

        loss_display = f"{average_loss:.4f}" if average_loss is not None else "warming up"
        print(
            f"Episode {episode + 1}/{episodes} "
            f"| epsilon={epsilon:.4f} "
            f"| avg_loss={loss_display} | reward={episode_reward:.4f} | avg_reward={episode_reward/episode_steps if episode_steps > 0 else 0:.4f} "
            f"| lines={episode_lines} | pieces={episode_steps}"
        )

    if checkpoint_path is None:
        checkpoint_path = (
            Path(__file__).resolve().parent / "models" / "tetris_checkpoint.pth"
        )
    checkpoint_path.parent.mkdir(parents=True, exist_ok=True)
    torch.save(model.state_dict(), checkpoint_path)
    print(f"Training completed. Saved checkpoint to {checkpoint_path}")


if __name__ == "__main__":
    train_tetris_agent()
