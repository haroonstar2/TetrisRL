def evaluate_board(board: list[list[int]]) -> float:
    """
    Computes a heuristic score based on aggregate height, lines, holes, and bumpiness.
    Formula reference from Stevens & Pradhan / Yiyuan.
    """
    # Calculate column heights
    heights = []
    num_cols = len(board[0])
    num_rows = len(board)
    
    for c in range(num_cols):
        col_height = 0
        for r in range(num_rows):
            if board[r][c] != 0:
                col_height = num_rows - r
                break
        heights.append(col_height)
        
    aggregate_height = sum(heights)
    
    holes = 0
    for c in range(num_cols):
        block_found = False
        for r in range(num_rows):
            if board[r][c] != 0:
                block_found = True
            elif board[r][c] == 0 and block_found:
                holes += 1
                
    bumpiness = sum(abs(heights[i] - heights[i+1]) for i in range(len(heights) - 1))

    complete_lines = sum(1 for r in range(num_rows) if all(board[r][c] != 0 for c in range(num_cols)))
    
    # Weighted fitness score. Weights taken from Yiyuan.
    score = (-0.51 * aggregate_height) + (0.76 * complete_lines) + (-0.36 * holes) + (-0.18 * bumpiness)
    return score

def rotate_matrix(matrix: list[list[int]]) -> list[list[int]]:
    size = len(matrix)
    return [
        [matrix[size - 1 - row][column] for row in range(size)]
        for column in range(size)
    ]


def rotate_piece(piece: list[list[int]], rotation: int) -> list[list[int]]:
    rotated_piece = [row[:] for row in piece]
    for _ in range(rotation % 4):
        rotated_piece = rotate_matrix(rotated_piece)
    return rotated_piece


def simulate_drop(
    board: list[list[int]],
    current_piece: list[list[int]],
    rotation: int,
    column: int,
) -> list[list[int]] | None:
    """
    Simulates dropping the current piece onto the board at the given rotation and column.
    Returns the new board state after the drop.
    """
    current_piece = rotate_piece(current_piece, rotation)
    piece_height = len(current_piece)
    piece_width = len(current_piece[0])

    if column < 0 or column + piece_width > len(board[0]):
        return None

    new_board = [row[:] for row in board]

    landing_row = len(new_board) - piece_height
    for r in range(landing_row + 1):
        collision = False
        for i in range(piece_height):
            for j in range(piece_width):

                if current_piece[i][j] != 0 and new_board[r + i][column + j] != 0:
                    collision = True
                    break
            if collision:
                break
        if collision:
            landing_row = r - 1
            break

    if landing_row < 0:
        return None

    for i in range(piece_height):
        for j in range(piece_width):
            if current_piece[i][j] != 0:
                new_board[landing_row + i][column + j] = current_piece[i][j]
    return new_board