from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import json
import os

app = FastAPI()

# --- CORS Configuration ---
# This allows your React frontend to communicate with this backend.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://central-valley-energy-navigator.vercel.app"], # Your exact Vercel URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Path to your JSON file ---
# This ensures Python finds the file regardless of where you run the script from
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(BASE_DIR, "data", "decision_tree_config.json")

# --- API Endpoints ---

@app.get("/api/eligibility-rules")
def get_rules():
    """
    Reads the JSON file from the data folder and sends it to the frontend.
    """
    try:
        with open(DATA_FILE, "r") as file:
            data = json.load(file)
            return data
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Configuration file not found.")
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Error reading the JSON file.")

@app.post("/api/save-survey")
def save_survey(results: dict):
    """
    Endpoint to receive the completed survey from React.
    For now, it just prints it to the terminal and returns a success message.
    """
    print("Received new survey results:", results)
    # Later, you can add database logic here (e.g., saving to MongoDB or PostgreSQL)
    return {"status": "success", "message": "Survey data received!"}