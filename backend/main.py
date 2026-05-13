from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import json
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://central-valley-energy-navigator.vercel.app"], # Your exact Vercel URL
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(BASE_DIR, "data", "decision_tree_config.json")

# 1. Define the data structure expected from React
class SurveyResults(BaseModel):
    county: str
    size: str  # e.g., "3" or "more than 8"
    utility: str
    income: str # e.g., "$42,000 - $53,000"
    assistance: List[str]

def load_rules():
    with open(DATA_FILE, "r") as file:
        return json.load(file)

@app.post("/api/evaluate")
def evaluate_eligibility(results: SurveyResults):
    rules = load_rules()
    
    # --- Logic 1: Categorical Eligibility (CARE) ---
    # If they are in any program, they qualify for CARE immediately.
    if any(prog in results.assistance for prog in ["Medicaid/Medi-Cal", "SSI", "WIC", "SNAP", "LIHEAP"]):
        return {"eligible": True, "program": "CARE", "reason": "Categorical (Program Enrollment)"}

    # --- Logic 2: Income Preparation ---
    # Map the survey string to a number for comparison
    income_map = {
        'Under $42,000': 42000,
        '$42,000 - $53,000': 53000,
        '$53,000 - $64,000': 64000,
        '$64,000 - $75,000': 75000,
        '$75,000 - $84,000': 84000,
        '$84,000 - $97,000': 97000,
        '$97,000 - $108,000': 108000,
        'Over $108,000': 108001
    }
    user_income = income_map.get(results.income, 999999)
    household_size = results.size # "1-2", "3", etc.

    # --- Logic 3: Check CARE Income ---
    care_limits = rules["programs"][0]["eligibility_rules"]["income_limits"]
    care_threshold = care_limits.get(household_size, care_limits["8"])
    
    if user_income <= care_threshold:
        return {"eligible": True, "program": "CARE", "reason": "Household Income"}

    # --- Logic 4: Check FERA Income ---
    # Only for households of 3+ and specific utilities
    if results.utility in ["PG&E", "Southern California Edison (SCE)"]:
        fera_limits = rules["programs"][1]["eligibility_rules"]["income_limits"]
        fera_threshold = fera_limits.get(household_size)
        if fera_threshold and user_income <= fera_threshold:
            return {"eligible": True, "program": "FERA", "reason": "Household Income"}

    return {"eligible": False, "program": None, "reason": "Income exceeds limits"}