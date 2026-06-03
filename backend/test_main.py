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

def test_care_to_fera_transition_exact_dollar():
    """Test what happens when income is exactly $1 over the CARE limit.
    Size 3 CARE limit is $54,640. $54,641 should trigger FERA for electric utilities."""
    payload = {
        "county": "Tulare County",
        "size": "3",
        "utility": "PG&E",
        "income": "54641",
        "assistance": []
    }
    response = client.post("/api/evaluate-eligibility", json=payload)
    data = response.json()
    assert data["eligible"] is True
    assert data["program"] == "FERA"

def test_care_exceeded_wrong_utility_for_fera():
    """Test income $1 over CARE limit, but using a non-electric utility.
    Because SoCalGas does not offer FERA, this should result in total ineligibility."""
    payload = {
        "county": "Kern County",
        "size": "3",
        "utility": "SoCalGas",
        "income": "54641", 
        "assistance": []
    }
    response = client.post("/api/evaluate-eligibility", json=payload)
    data = response.json()
    assert data["eligible"] is False
    assert data["program"] is None

def test_fera_upper_boundary_exact_dollar():
    """Test exactly $1 over the FERA limit. 
    Size 1-2 FERA limit is $54,100. $54,101 should be completely ineligible."""
    payload = {
        "county": "Kern County",
        "size": "2",
        "utility": "Southern California Edison (SCE)",
        "income": "54101",
        "assistance": []
    }
    response = client.post("/api/evaluate-eligibility", json=payload)
    data = response.json()
    assert data["eligible"] is False

def test_decimal_income_handling():
    """Test that the backend correctly handles exact decimal incomes (cents).
    CARE limit for size 4 is $66,000. $66,000.50 should push them into FERA."""
    payload = {
        "county": "Tulare County",
        "size": "4",
        "utility": "PG&E",
        "income": "66000.50",
        "assistance": []
    }
    response = client.post("/api/evaluate-eligibility", json=payload)
    data = response.json()
    assert data["eligible"] is True
    assert data["program"] == "FERA"

def test_zero_or_negative_income():
    """Test edge cases where a user might enter 0 or a negative number for income."""
    payload = {
        "county": "Kern County",
        "size": "4",
        "utility": "SoCalGas",
        "income": "0", # Extreme low income
        "assistance": []
    }
    response = client.post("/api/evaluate-eligibility", json=payload)
    data = response.json()
    assert data["eligible"] is True
    assert data["program"] == "CARE"

def test_legacy_string_size_fallback():
    """Test that if the frontend ever sends the old '1-2' string, the backend calculates it properly."""
    payload = {
        "county": "Kern County",
        "size": "1-2",
        "utility": "PG&E",
        "income": "50000", # Above CARE size 1-2 limit (43280), below FERA size 1-2 limit (54100)
        "assistance": []
    }
    response = client.post("/api/evaluate-eligibility", json=payload)
    data = response.json()
    assert data["eligible"] is True
    assert data["program"] == "FERA"

def test_size_1_and_size_2_equivalence():
    """Test that sending '1' and '2' mathematically route to the exact same '1-2' tier limit."""
    payload_1 = {
        "county": "Kern County",
        "size": "1",
        "utility": "PG&E",
        "income": "43280",
        "assistance": []
    }
    payload_2 = {
        "county": "Kern County",
        "size": "2",
        "utility": "PG&E",
        "income": "43280",
        "assistance": []
    }
    res_1 = client.post("/api/evaluate-eligibility", json=payload_1).json()
    res_2 = client.post("/api/evaluate-eligibility", json=payload_2).json()
    
    # Both should exactly qualify for CARE at the $43,280 threshold
    assert res_1["eligible"] is True and res_1["program"] == "CARE"
    assert res_2["eligible"] is True and res_2["program"] == "CARE"

def test_other_utility_fera_rejection():
    """Test that selecting 'Other / Unsure' acts strictly like a non-electric provider and rejects FERA."""
    payload = {
        "county": "Kern County",
        "size": "4",
        "utility": "Other / Unsure",
        "income": "80000", # Fits in FERA range
        "assistance": []
    }
    response = client.post("/api/evaluate-eligibility", json=payload)
    data = response.json()
    assert data["eligible"] is False # FERA requires PG&E or SCE