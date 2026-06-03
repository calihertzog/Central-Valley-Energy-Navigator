import pytest
from fastapi.testclient import TestClient
from main import app, get_income_limits

client = TestClient(app)

def test_categorical_care_eligibility():
    """Test that public assistance grants instant CARE eligibility."""
    payload = {
        "county": "Tulare County",
        "size": "4",
        "utility": "PG&E",
        "income": "900000",  # High income, but assistance overrides it
        "assistance": ["Medicaid/Medi-Cal"]
    }
    response = client.post("/api/evaluate-eligibility", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["eligible"] is True
    assert data["program"] == "CARE"
    assert data["messageKey"] == "care_assistance_msg"

def test_care_exact_income_boundary():
    """Test CARE eligibility right on the exact limit line (Size 3: $54,640)."""
    payload = {
        "county": "Kern County",
        "size": "3",
        "utility": "SoCalGas",
        "income": "54640",
        "assistance": []
    }
    response = client.post("/api/evaluate-eligibility", json=payload)
    data = response.json()
    assert data["eligible"] is True
    assert data["program"] == "CARE"

def test_fera_income_eligibility_pge():
    """Test FERA eligibility for a family of 4 making $80,000 using PG&E."""
    payload = {
        "county": "Kern County",
        "size": "4",
        "utility": "PG&E",
        "income": "80000", # Above CARE limit (66000), below FERA limit (82500)
        "assistance": []
    }
    response = client.post("/api/evaluate-eligibility", json=payload)
    data = response.json()
    assert data["eligible"] is True
    assert data["program"] == "FERA"

def test_fera_ineligible_wrong_utility():
    """Test FERA rejection if the utility is not an electric provider."""
    payload = {
        "county": "Tulare County",
        "size": "4",
        "utility": "SoCalGas",
        "income": "80000", # Income is FERA-eligible, but utility is wrong
        "assistance": []
    }
    response = client.post("/api/evaluate-eligibility", json=payload)
    data = response.json()
    assert data["eligible"] is False
    assert data["program"] is None

def test_care_massive_household_dynamic_math():
    """Test dynamic math for CARE household > 8. 
    10 people = base(111440) + 2*(11360) = 134160"""
    payload = {
        "county": "Other",
        "size": "10",
        "utility": "SoCalGas",
        "income": "134000", 
        "assistance": []
    }
    response = client.post("/api/evaluate-eligibility", json=payload)
    data = response.json()
    assert data["eligible"] is True
    assert data["program"] == "CARE"

def test_fera_massive_household_dynamic_math():
    """Test dynamic math for FERA household > 8. 
    10 people = base(139300) + 2*(14200) = 167700"""
    payload = {
        "county": "Kern County",
        "size": "10",
        "utility": "Southern California Edison (SCE)",
        "income": "167000", 
        "assistance": []
    }
    response = client.post("/api/evaluate-eligibility", json=payload)
    data = response.json()
    assert data["eligible"] is True
    assert data["program"] == "FERA"

def test_total_ineligibility():
    """Test that a high-income household receives an ineligible result."""
    payload = {
        "county": "Kern County",
        "size": "4",
        "utility": "PG&E",
        "income": "150000", 
        "assistance": []
    }
    response = client.post("/api/evaluate-eligibility", json=payload)
    data = response.json()
    assert data["eligible"] is False

def test_invalid_income_fallback():
    """Test that string inputs for income don't crash the server and result in ineligibility."""
    payload = {
        "county": "Kern County",
        "size": "4",
        "utility": "PG&E",
        "income": "I don't know", 
        "assistance": []
    }
    response = client.post("/api/evaluate-eligibility", json=payload)
    data = response.json()
    assert data["eligible"] is False