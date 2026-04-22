import { useState } from 'react';
import Survey from './Survey';
import logo from './assets/logo.png'; // Make sure the logo is in src/assets/
import './App.css';

function App() {
  const [isSurveyStarted, setIsSurveyStarted] = useState(false);
  const [surveyResults, setSurveyResults] = useState(null);

  // Handle final data and send to Python backend
  const handleSurveyComplete = async (data) => {
    console.log("Final User Data:", data);
    setSurveyResults(data);

    try {
      const response = await fetch("http://localhost:8000/api/save-survey", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const backendMessage = await response.json();
        console.log("Success from Python:", backendMessage);
      } else {
        console.error("Backend returned an error. Status:", response.status);
      }
    } catch (error) {
      console.error("Error connecting to the backend:", error);
    }
  };

  if (surveyResults) {
    return (
      <main className="container center-content">
        <img src={logo} alt="CRPE Logo" className="brand-logo" />
        <h2 style={{ color: '#244D73' }}>Eligibility Results</h2>
        <p>Based on your answers, here are your matched programs...</p>
        <pre style={{ textAlign: 'left', background: '#ffffffff', padding: '1rem', borderRadius: '8px' }}>
          {JSON.stringify(surveyResults, null, 2)}
        </pre>
        <button className="secondary-btn" onClick={() => {
          setSurveyResults(null);
          setIsSurveyStarted(false);
        }}>
          Start Over
        </button>
      </main>
    );
  }

if (isSurveyStarted) {
  return (
    <div className="container survey-active"> 
      <header style={{ textAlign: 'center', marginTop: '1rem' }}>
        <img src={logo} alt="CRPE Logo" className="brand-logo" />
      </header>
      <Survey 
        onCancel={() => setIsSurveyStarted(false)} 
        onComplete={handleSurveyComplete} 
      />
    </div>
  );
}

  return (
    <main className="container center-content">
      <header>
        {/* CRPE Logo at the very top */}
        <img src={logo} alt="CRPE Logo" className="brand-logo" />
        <h1 style={{ color: '#244D73' }}>San Joaquin Valley Energy Assistance Navigator </h1>
      </header>
      
      <section className="intro-text">
        <p>
          Kern and Tulare counties have some of the highest energy rates in the U.S. 
          Fortunately, California offers numerous subsidy programs to help reduce energy costs and support clean energy adoption.
        </p>
        <p>
          Answer a few simple questions about your household to discover which utility, state, and regional programs you may qualify for.
        </p>
      </section>

      <button className="primary-btn" onClick={() => setIsSurveyStarted(true)}>
        Begin Survey
      </button>
    </main>
  );
}

export default App;