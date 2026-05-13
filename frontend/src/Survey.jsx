import { useState } from 'react';

const programs = [
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
];

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
    text: 'Are you enrolled in any of the following programs?',
    options: ['Yes', 'No']
  }
];

export default function Survey({ onCancel, onComplete }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});

  const currentQuestion = questions[currentIndex];

  const handleSelect = (option) => {
    // Update the answers object with the selection for the current question ID
    setAnswers({ ...answers, [currentQuestion.id]: option });
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // If it's the last question, send the collected data back up to App.jsx
      onComplete(answers);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else {
      // If on the first question, go back to the Home screen
      onCancel();
    }
  };

  return (
    <div className="survey-container">
      <div className="progress-tracker">
        <p>Question {currentIndex + 1} of {questions.length}</p>
      </div>

      <h2 className="question-text">{currentQuestion.text}</h2>

      {currentQuestion.id === 'assistance' && (
        <ul className="programs-list">
          {programs.map((program, index) => (
            <li key={index} className="program-item">
              {program}
            </li>
          ))}
        </ul>
      )}

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

      <div className="nav-buttons">
        <button className="secondary-btn" onClick={handlePrev}>
          {currentIndex === 0 ? 'Back to Home' : 'Previous'}
        </button>
        <button 
          className="primary-btn" 
          onClick={handleNext}
          disabled={!answers[currentQuestion.id]} // Prevents moving forward without answering
        >
          {currentIndex === questions.length - 1 ? 'See Results' : 'Next'}
        </button>
      </div>
    </div>
  );
}