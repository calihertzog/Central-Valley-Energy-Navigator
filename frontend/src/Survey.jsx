import { useState } from 'react';

// Here we define the questions. You can easily add more to this array later.
const questions = [
  {
    id: 'county',
    text: 'Which county do you live in?',
    options: ['Kern County', 'Tulare County', 'Other']
  },
  {
    id: 'utility',
    text: 'Who is your primary utility provider?',
    options: ['PG&E', 'Southern California Edison (SCE)', 'SoCalGas', 'Other / Unsure']
  },
  {
    id: 'income',
    text: 'What is your approximate annual household income?',
    options: ['Under $35,000', '$35,000 - $50,000', '$50,000 - $75,000', 'Over $75,000']
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