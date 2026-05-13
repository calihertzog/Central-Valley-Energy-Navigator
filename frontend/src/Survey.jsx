import { useState } from 'react';

const questions = [
  {
    id: 'county',
    text: 'Which county do you live in?',
    options: ['Kern County', 'Tulare County', 'Other']
  },
  {
    id: 'size',
    text: 'How many persons in your household?',
    options: ['1-2', '3', '4', '5', '6', '7', '8', 'more than 8']
  },
  {
    id: 'utility',
    text: 'Who is your primary utility provider?',
    options: ['PG&E', 'Southern California Edison (SCE)', 'SoCalGas', 'Other / Unsure']
  },
  {
    id: 'income',
    text: 'What is your approximate annual household income?',
    options: ['Under $42,000', '$42,000 - $53,000', '$53,000 - $64,000', '$64,000 - $75,000', '$75,000 - $84,000', '$84,000 - $97,000', '$97,000 - $108,000', 'Over $108,000']
  },
  {
    id: 'assistance',
    text: 'Are you enrolled in any of the following programs? (Select all that apply)',
    type: 'checkbox',
    options: [
      "Medicaid/Medi-Cal",
      "Women, Infants, and Children Program (WIC)",
      "Healthy Families A & B",
      "National School Lunch Program (NSLP) - Free Lunch",
      "Food Stamps/SNAP",
      "Low Income Home Energy Assistance Program (LIHEAP)",
      "Head Start Income Eligible (Tribal Only)",
      "Supplemental Security Income (SSI)",
      "Bureau of Indian Affairs General Assistance",
      "Temporary Assistance for Needy Families (TANF) or Tribal TANF"
    ]
  }
];

export default function Survey({ onCancel, onComplete }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const currentQuestion = questions[currentIndex];

  const handleSelect = (option) => {
    setAnswers({ ...answers, [currentQuestion.id]: option });
  };

  const handleCheckboxToggle = (option) => {
    const currentSelections = answers[currentQuestion.id] || [];
    let newSelections = currentSelections.includes(option)
      ? currentSelections.filter(item => item !== option)
      : [...currentSelections, option];
    setAnswers({ ...answers, [currentQuestion.id]: newSelections });
  };

  const handleNext = async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setIsLoading(true);
      try {

        const BACKEND_URL = "https://central-valley-energy-navigator.onrender.com";
        
        const payload = {
          ...answers,
          assistance: answers.assistance || []
        };

        const response = await fetch(`${BACKEND_URL}/api/evaluate-eligibility`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error('Failed to fetch results');

        const result = await response.json();
        onComplete(result); 
      } catch (error) {
        console.error("Error:", error);
        alert("The server is waking up. Please wait a few seconds and try clicking 'See Results' again.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handlePrev = () => {
    currentIndex > 0 ? setCurrentIndex(currentIndex - 1) : onCancel();
  };

  const isNextDisabled = currentQuestion.type === 'checkbox' 
    ? false 
    : !answers[currentQuestion.id];

  return (
    <div className="survey-container">
      <div className="progress-tracker">
        <p style={{ textTransform: 'uppercase', letterSpacing: '1px', color: '#666' }}>
          Question {currentIndex + 1} of {questions.length}
        </p>
      </div>

      <h2 className="question-text">{currentQuestion.text}</h2>

      {currentQuestion.type === 'checkbox' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left', margin: '20px auto', maxWidth: '650px', fontSize: '1.15rem', color: '#333' }}>
          {currentQuestion.options.map((option) => (
            <label key={option} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer', lineHeight: '1.4' }}>
              <input 
                type="checkbox" 
                checked={(answers[currentQuestion.id] || []).includes(option)}
                onChange={() => handleCheckboxToggle(option)}
                style={{ marginTop: '4px', transform: 'scale(1.6)', cursor: 'pointer', accentColor: '#4A8B39' }} 
              />
              <span>{option}</span>
            </label>
          ))}
        </div>
      ) : (
        <div className="options-grid">
          {currentQuestion.options.map((option) => (
            <button
              key={option}
              className={`option-btn ${answers[currentQuestion.id] === option ? 'selected' : ''}`}
              onClick={() => handleSelect(option)}
            >
              {option}
            </button>
          ))}
        </div>
      )}

      <div className="nav-buttons">
        <button className="secondary-btn" onClick={handlePrev} disabled={isLoading}>
          {currentIndex === 0 ? 'Back to Home' : 'Previous'}
        </button>
        <button className="primary-btn" onClick={handleNext} disabled={isNextDisabled || isLoading}>
          {isLoading ? 'Processing...' : (currentIndex === questions.length - 1 ? 'See Results' : 'Next')}
        </button>
      </div>
    </div>
  );
}