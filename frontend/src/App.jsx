import { useState } from 'react';
import Survey from './Survey';
import './App.css';

function App() {
  const [isSurveyStarted, setIsSurveyStarted] = useState(false);
  const [surveyResults, setSurveyResults] = useState(null);

  // This will handle the final data once the user finishes all 10 questions
// Change this function to be async
  const handleSurveyComplete = async (data) => {
    console.log("Final User Data:", data);
    setSurveyResults(data); // Show the results on the screen immediately

    try {
      // Send the POST request to your Python backend
      const response = await fetch("http://localhost:8000/api/save-survey", {
        method: "POST", // Specify the HTTP method
        headers: {
          "Content-Type": "application/json", // Tell the backend we are sending JSON
        },
        body: JSON.stringify(data), // Convert the JavaScript object to a JSON string
      });

      // Check if the backend received it successfully
      if (response.ok) {
        const backendMessage = await response.json();
        console.log("Success from Python:", backendMessage);
      } else {
        console.error("Backend returned an error. Status:", response.status);
      }
    } catch (error) {
      // This catches network errors (e.g., if your Python server isn't running)
      console.error("Error connecting to the backend:", error);
    }
  };

  if (surveyResults) {
    return (
      <main className="container center-content">
        <h2>Eligibility Results</h2>
        <p>Based on your answers, here are your matched programs...</p>
        <pre style={{textAlign: 'left'}}>{JSON.stringify(surveyResults, null, 2)}</pre>
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
      <Survey 
        onCancel={() => setIsSurveyStarted(false)} 
        onComplete={handleSurveyComplete} 
      />
    );
  }

  return (
    <main className="container center-content">
      <header>
        <h1>San Joaquin Valley Energy Assistance Navigator</h1>
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