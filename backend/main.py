from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3
import time

app = FastAPI(title="DroneDrishti AI Tactical Engine", version="2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- SQLite Database Setup (Permanent Storage) ---
DB_NAME = "dronedrishti_aar.db"

def init_db():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS engagements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            trainee_id TEXT,
            unit_id TEXT,
            difficulty TEXT,
            scenario TEXT,
            reaction_time_ms REAL,
            is_threat BOOLEAN,
            weapon_used TEXT,
            score INTEGER,
            feedback TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()

init_db()

class EngagementData(BaseModel):
    trainee_id: str
    unit_id: str
    difficulty: str        # 'recruit', 'veteran', 'elite'
    reaction_time_ms: float
    is_threat: bool
    weapon_used: str       # 'kinetic', 'jammer'
    environment: str       # 'day', 'night', 'degraded'

@app.post("/api/score")
def calculate_score(data: EngagementData):
    score = 100
    feedback = []

    # Difficulty Thresholds
    threshold_ms = 4500 if data.difficulty == 'recruit' else (3500 if data.difficulty == 'veteran' else 2500)

    # 1. Reaction Time Evaluation
    if data.reaction_time_ms > threshold_ms:
        penalty = 30 if data.difficulty == 'elite' else 20
        score -= penalty
        feedback.append(f"Latency Exceeded (> {threshold_ms/1000}s).")
    else:
        feedback.append("Optimal Reaction Window.")

    # 2. Decision Tree Logic: Weapon vs Threat
    if data.is_threat:
        if data.weapon_used == "jammer":
            score -= 50
            feedback.append("CRITICAL: Jammer failed on Kamikaze Threat.")
        else:
            feedback.append("Confirmed Kinetic Neutralization.")
    else:
        if data.weapon_used == "kinetic":
            score -= 40
            feedback.append("TACTICAL ERROR: Kinetic ammo expended on Decoy.")
        else:
            feedback.append("Successful EW Jamming on Decoy.")

    final_score = max(0, score)

    # Save to SQLite
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO engagements (trainee_id, unit_id, difficulty, scenario, reaction_time_ms, is_threat, weapon_used, score, feedback)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        data.trainee_id,
        data.unit_id,
        data.difficulty,
        data.environment,
        data.reaction_time_ms,
        data.is_threat,
        data.weapon_used,
        final_score,
        " | ".join(feedback)
    ))
    conn.commit()
    conn.close()

    return {"status": "success", "final_score": final_score, "feedback": " | ".join(feedback)}

@app.get("/api/results")
def get_results():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM engagements ORDER BY id DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]