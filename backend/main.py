from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import os

app = FastAPI()

# --- CORS Configuration ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://central-valley-energy-navigator.vercel.app",
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
            "message": "You qualify for CARE through your enrollment in public assistance programs!",
            "discount": "30-35% on electric and 20% on gas."
        }

    # 2. Income Mapping
    income_map = {
        'Under $42,300': 42299,
        '$42,300 - $53,300': 53300,
        '$53,300 - $64,300': 64300,  
        '$64,300 - $75,300': 75300,
        '$75,300 - $86,300': 86300,
        '$86,300 - $97,300': 97300,
        '$97,300 - $108,300': 108300,
        'Over $108,300': 108301
    }
    user_income = income_map.get(results.income, 999999)

    # 3. CARE Income Limits (2025-2026)
    care_limits = {
        "1-2": 42300, "3": 53300, "4": 64300, "5": 75300, 
        "6": 86300, "7": 97300, "8": 108300, "more than 8": 119300
    }
    
    if user_income <= care_limits.get(results.size, 0):
        return {
            "eligible": True,
            "program": "CARE",
            "message": "Based on your income and household size, you qualify for CARE!",
            "discount": "30-35% on electric and 20% on gas."
        }

    # 4. FERA Income Limits (HHS of 3+ and specific electric utilities)
    is_electric_provider = results.utility in ['PG&E', 'Southern California Edison (SCE)']
    fera_limits = {
        "3": 66625, "4": 80375, "5": 94125, "6": 107875, 
        "7": 121625, "8": 135375, "more than 8": 149125
    }

    if is_electric_provider and user_income <= fera_limits.get(results.size, 0):
        return {
            "eligible": True,
            "program": "FERA",
            "message": "You qualify for the FERA program!",
            "discount": "potential 18% discount on your electric bill."
        }

    # 5. Ineligible
    return {
        "eligible": False,
        "program": None,
        "message": "You may not qualify for CARE or FERA based on the current income guidelines.",
        "discount": None
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)