import { useState } from 'react';
import Survey from './Survey';
import logo from './assets/logo.png'; 
import './App.css';

function App() {
  const [isSurveyStarted, setIsSurveyStarted] = useState(false);
  const [surveyResults, setSurveyResults] = useState(null);

  // This matches the data structure coming back from your Python main.py
  const handleSurveyComplete = (data) => {
    console.log("Calculated Results from Backend:", data);
    setSurveyResults(data);
  };

  const handleRestart = () => {
    setSurveyResults(null);
    setIsSurveyStarted(false);
  };

  // --- View 1: Results Screen ---
  if (surveyResults) {
    return (
      <main className="container center-content">
        <img src={logo} alt="CRPE Logo" className="brand-logo" />
        
        <h2 style={{ color: '#244D73', marginTop: '20px' }}>
          {surveyResults.eligible ? "You're Eligible!" : "Evaluation Complete"}
        </h2>

        {/* Using the CSS class for layout, but keeping the dynamic border color inline */}
        <div 
          className="results-card" 
          style={{ borderLeft: `8px solid ${surveyResults.eligible ? '#4A8B39' : '#ccc'}` }}
        >
          <p>
            {surveyResults.message}
          </p>
          
          {surveyResults.discount && (
            <div className="benefit-tag">
              <strong>Benefit:</strong> {surveyResults.discount}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {surveyResults.eligible && (
            <button className="primary-btn" onClick={() => window.open('https://www.cpuc.ca.gov/care', '_blank')}>
              Apply Now
            </button>
          )}
          <button className="secondary-btn" onClick={handleRestart}>
            Start Over
          </button>
        </div>
      </main>
    );
  }

  // --- View 2: Active Survey ---
  if (isSurveyStarted) {
    return (
      <div className="container survey-active"> 
        <header>
          <img src={logo} alt="CRPE Logo" className="brand-logo" />
        </header>
        <Survey 
          onCancel={handleRestart} 
          onComplete={handleSurveyComplete} 
        />
      </div>
    );
  }

  // --- View 3: Welcome Screen ---
  return (
    <main className="container center-content">
      <header>
        <img src={logo} alt="CRPE Logo" className="brand-logo" />
        <h1 style={{ color: '#244D73' }}>San Joaquin Valley Energy Assistance Navigator</h1>
      </header>
      
      <section className="intro-text">
        <p>
          Kern and Tulare counties have some of the highest energy rates in the U.S. 
          California offers subsidy programs like <strong>CARE</strong> and <strong>FERA</strong> to help reduce your monthly bills.
        </p>
        <p>
          Take 60 seconds to answer a few questions and see if you qualify for a discount of up to 35%.
        </p>
      </section>

      <button className="primary-btn" onClick={() => setIsSurveyStarted(true)}>
        Begin Survey
      </button>
    </main>
  );
}

export default App;