import heuristics


def test_simulate_drop_applies_rotation():
    piece = [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
    ]
    board = [[0] * 10 for _ in range(6)]

    rotated_board = heuristics.simulate_drop(board, piece, 1, 4)

    assert rotated_board is not None
    assert sum(cell != 0 for row in rotated_board for cell in row) == 4
    assert [sum(cell != 0 for cell in row) for row in rotated_board] == [0, 0, 1, 1, 1, 1]


def test_simulate_drop_rejects_piece_blocked_at_spawn():
    board = [[0] * 10 for _ in range(6)]
    board[0][0] = 9

    result = heuristics.simulate_drop(board, [[1]], 0, 0)

    assert result is None