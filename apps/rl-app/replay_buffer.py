"""
Replay buffer implementation for the Tetris RL agent.
Used to store and sample transitions during training.
"""
from copy import deepcopy

class ReplayBuffer:
    def __init__(self, capacity):
        self.capacity = capacity
        self.buffer = []
        self.position = 0

    def push(self, transition: tuple) -> None:
        if len(transition) != 5:
            raise ValueError(
                "Replay transitions must be (state, next_state, reward, action, done)"
            )

        transition = deepcopy(transition)
        if len(self.buffer) < self.capacity:
            self.buffer.append(None)
        self.buffer[self.position] = transition
        self.position = (self.position + 1) % self.capacity

    def sample(self, batch_size: int) -> list[tuple]:
        import random
        return random.sample(self.buffer, batch_size)

    def __len__(self) -> int:
        return len(self.buffer)
