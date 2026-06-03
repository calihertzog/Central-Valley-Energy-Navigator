from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import os
import json

app = FastAPI()

# --- CORS Configuration ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://central-valley-energy-navigator.vercel.app",
        "http://localhost:3000",
        "http://localhost:5173" 
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Load Configuration ---
# Loads once on startup, preventing disk I/O bottlenecks on high traffic
with open("data/decision_tree_config.json", "r") as config_file:
    PROGRAM_CONFIG = json.load(config_file)

def get_income_limits(program_id: str) -> dict:
    """Helper to extract income limits from the loaded JSON config."""
    for program in PROGRAM_CONFIG.get("programs", []):
        if program.get("id") == program_id:
            return program.get("eligibility_rules", {}).get("income_limits", {})
    return {}

# Cache the limits globally
CARE_LIMITS = get_income_limits("care")
FERA_LIMITS = get_income_limits("fera")


def calculate_limit(size_input: str, limits: dict, per_person_addition: int) -> int:
    """Calculates exact limits, handling households > 8 mathematically."""
    # Handle original survey string if frontend hasn't been updated to number input yet
    if size_input == "1-2":
        return limits.get("1-2", 0)
        
    try:
        size = int(size_input)
    except ValueError:
        # Fallback for the old "more than 8" string selection
        if size_input == "more than 8":
            size = 9 
        else:
            return limits.get(size_input, 0)
            
    # Return limits based on parsed size
    if size <= 2:
        return limits.get("1-2", 0)
    elif size <= 8:
        return limits.get(str(size), 0)
    else:
        # Dynamically calculate for massive households based on base size 8
        base_limit = limits.get("8", 0)
        return base_limit + ((size - 8) * per_person_addition)


class SurveyResults(BaseModel):
    county: str
    size: str
    utility: str
    income: str
    assistance: List[str] = []

@app.post("/api/evaluate-eligibility")
async def evaluate_eligibility(results: SurveyResults):
    # 1. Categorical Eligibility (Instant CARE)
    if len(results.assistance) > 0:
        return {
            "eligible": True,
            "program": "CARE",
            "messageKey": "care_assistance_msg",
            "discountKey": "care_discount",
            "utility": results.utility
        }

    # 2. Parse Exact Income
    try:
        user_income = float(results.income)
    except ValueError:
        # Fallback in case of unexpected input
        user_income = 9999999

    # 3. CARE Income Limits 
    care_limit = calculate_limit(results.size, CARE_LIMITS, 11360)
    if user_income <= care_limit:
        return {
            "eligible": True,
            "program": "CARE",
            "messageKey": "care_income_msg",
            "discountKey": "care_discount",
            "utility": results.utility
        }

    # 4. FERA Income Limits 
    is_electric_provider = results.utility in ['PG&E', 'Southern California Edison (SCE)']
    fera_limit = calculate_limit(results.size, FERA_LIMITS, 14200)

    if is_electric_provider and user_income <= fera_limit:
        return {
            "eligible": True,
            "program": "FERA",
            "messageKey": "fera_income_msg",
            "discountKey": "fera_discount",
            "utility": results.utility
        }

    # 5. Ineligible
    return {
        "eligible": False,
        "program": None,
        "messageKey": "ineligible_msg",
        "discountKey": None,
        "utility": results.utility
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)