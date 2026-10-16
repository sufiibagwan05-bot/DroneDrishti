# 🛡️ DroneDrishti
**AI-Enabled Drone & Counter-Drone Threat Simulation Trainer**

![DroneDrishti Simulator](https://img.shields.io/badge/Status-Active-brightgreen) ![Tech Stack](https://img.shields.io/badge/Tech-React%20%7C%20Three.js%20%7C%20FastAPI%20%7C%20Streamlit-blue)

## 📌 Problem Statement Overview
**Background:** Recent conflicts have shown that low-cost commercial and military-grade drones, employed individually and in swarms, have become a decisive battlefield factor. Existing training relies on classroom instruction and limited live-fire drills, which are costly, weather-dependent, and do not scale to give troops adequate repetitions.

**Our Solution:** **DroneDrishti** is a lightweight, browser-based 3D simulation platform designed to train military personnel in recognizing, classifying, and responding to drone/swarm threats across varied and realistic scenarios. 

---

## ✨ Key Features
- **🎮 Web-Based 3D Engine:** Desktop and VR-capable simulator using React Three Fiber. No heavy gaming PC or dedicated software installation required.
- **🌤️ Dynamic Tactical Scenarios:** Procedurally generated drone swarms across dynamically changing environments (Daylight, Night Operations, and Degraded Sensors/Fog).
- **🧠 Decision-Tree Based Scoring:** Advanced AI backend that evaluates trainee performance based on Reaction Time (TTD) and precise Engagement Decisions (Kinetic Gun vs. EW Jammer).
- **📊 AAR Command Dashboard:** A dedicated After-Action Review (AAR) telemetry dashboard for unit commanders to track skill gaps, accuracy, and export performance reports.
- **⚙️ Adaptive AI Difficulty:** Recruit, Veteran, and Elite difficulty modes with adaptive swarm speeds to prevent rote learning.

---

## 🛠️ Tech Stack
*   **Frontend (Simulator):** React.js, Three.js (React Three Fiber / Drei)
*   **Backend (Core Engine):** Python, FastAPI, SQLite (Persistent Storage)
*   **Analytics (AAR Dashboard):** Python, Streamlit, Pandas, Plotly

---

## 🚀 How to Run Locally

### 1. Backend Engine (FastAPI)
Navigate to the backend folder and start the API server:
```bash
cd backend
pip install fastapi uvicorn pydantic sqlite3
uvicorn main:app --reload