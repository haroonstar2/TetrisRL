from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_get_action():
    payload = {
        "grid": [[0]*10 for _ in range(24)],
        "currentPiece": {
            "shape": [[1, 1], [1, 1]],
            "x": 4,
            "y": 0,
            "type": "O"
        },
        "score": 0,
        "gameOver": False
    }
    response = client.post("/act", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "action" in data
    assert data["action"] in ["left", "right", "rotate", "drop", "none"]

def test_get_action_game_over():
    payload = {
        "grid": [[0]*10 for _ in range(24)],
        "currentPiece": None,
        "score": 100,
        "gameOver": True
    }
    response = client.post("/act", json=payload)
    assert response.status_code == 200
    assert response.json() == {"action": "none"}
