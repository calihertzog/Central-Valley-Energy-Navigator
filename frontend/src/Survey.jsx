import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function Survey({ onCancel, onComplete }) {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [resultData, setResultData] = useState(null); 

  const questions = [
    {
      id: 'county',
      text: t('survey.q_county.text'),
      options: [
        { value: 'Kern County', label: t('survey.q_county.kern') },
        { value: 'Tulare County', label: t('survey.q_county.tulare') },
        { value: 'Other', label: t('survey.q_county.other') }
      ]
    },
    {
      id: 'size',
      text: t('survey.q_size.text'),
      type: 'number',
      placeholder: 'e.g. 4'
    },
    {
      id: 'utility',
      text: t('survey.q_utility.text'),
      options: [
        { value: 'PG&E', label: 'PG&E' },
        { value: 'Southern California Edison (SCE)', label: 'Southern California Edison (SCE)' },
        { value: 'SoCalGas', label: 'SoCalGas' },
        { value: 'Other / Unsure', label: t('survey.q_utility.other') }
      ]
    },
    {
      id: 'income',
      text: t('survey.q_income.text'),
      type: 'number',
      placeholder: 'e.g. 50000'
    },
    {
      id: 'assistance',
      text: t('survey.q_assistance.text'),
      type: 'checkbox',
      options: [
        { value: "Medicaid/Medi-Cal", label: t('survey.q_assistance.mediCal') },
        { value: "Women, Infants, and Children Program (WIC)", label: t('survey.q_assistance.wic') },
        { value: "Healthy Families A & B", label: t('survey.q_assistance.healthyFamilies') },
        { value: "National School Lunch Program (NSLP) - Free Lunch", label: t('survey.q_assistance.nslp') },
        { value: "Food Stamps/SNAP", label: t('survey.q_assistance.snap') },
        { value: "Low Income Home Energy Assistance Program (LIHEAP)", label: t('survey.q_assistance.liheap') },
        { value: "Head Start Income Eligible (Tribal Only)", label: t('survey.q_assistance.headStart') },
        { value: "Supplemental Security Income (SSI)", label: t('survey.q_assistance.ssi') },
        { value: "Bureau of Indian Affairs General Assistance", label: t('survey.q_assistance.bia') },
        { value: "Temporary Assistance for Needy Families (TANF) or Tribal TANF", label: t('survey.q_assistance.tanf') }
      ]
    }
  ];

  const currentQuestion = questions[currentIndex];

  const handleSelect = (optionValue) => {
    setAnswers({ ...answers, [currentQuestion.id]: optionValue });
  };

  const handleCheckboxToggle = (optionValue) => {
    const currentSelections = answers[currentQuestion.id] || [];
    let newSelections = currentSelections.includes(optionValue)
      ? currentSelections.filter(item => item !== optionValue)
      : [...currentSelections, optionValue];
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
        setResultData(result); // Set result to trigger the results view
        if (onComplete) onComplete(result); 
      } catch (error) {
        console.error("Error:", error);
        alert(t('survey.alert'));
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handlePrev = () => {
    currentIndex > 0 ? setCurrentIndex(currentIndex - 1) : onCancel();
  };

  // Render the results screen if data was successfully fetched
  if (resultData) {
    return (
      <div className="survey-container">
        <h2 className="question-text" style={{ textAlign: 'center' }}>
          {resultData.eligible 
            ? t('survey.eligible_title', 'Great news! You may be eligible.') 
            : t('survey.ineligible_title', 'Eligibility Results')}
        </h2>
        
        <div style={{ textAlign: 'center', margin: '30px auto', maxWidth: '650px', fontSize: '1.15rem', color: '#333' }}>
          <p style={{ lineHeight: '1.6' }}>{t(resultData.messageKey)}</p>
          
          {resultData.eligible && (
            <div style={{ 
              marginTop: '30px', 
              padding: '25px', 
              backgroundColor: '#f0fdf4', 
              border: '2px solid #4A8B39', 
              borderRadius: '8px' 
            }}>
              <h3 style={{ color: '#4A8B39', fontSize: '1.5rem', margin: '0 0 10px 0' }}>
                {resultData.program}
              </h3>
              <p style={{ margin: 0, fontWeight: 'bold' }}>
                {t(resultData.discountKey)}
              </p>
            </div>
          )}
        </div>

        <div className="nav-buttons" style={{ justifyContent: 'center' }}>
          <button className="primary-btn" onClick={onCancel}>
            {t('survey.close', 'Close & Return Home')}
          </button>
        </div>
      </div>
    );
  }

  const isNextDisabled = currentQuestion.type === 'checkbox' 
    ? false 
    : !answers[currentQuestion.id];

  return (
    <div className="survey-container">
      <div className="progress-tracker">
        <p style={{ textTransform: 'uppercase', letterSpacing: '1px', color: '#666' }}>
          {t('survey.progress', { current: currentIndex + 1, total: questions.length })}
        </p>
      </div>

      <h2 className="question-text">{currentQuestion.text}</h2>

      {currentQuestion.type === 'number' ? (
        <div style={{ textAlign: 'center', margin: '20px auto' }}>
          <input 
            type="number" 
            min="1" // Prevents negative numbers or zero
            placeholder={currentQuestion.placeholder} // Dynamically pulls placeholder
            value={answers[currentQuestion.id] || ''}
            onChange={(e) => handleSelect(e.target.value)}
            style={{ 
              padding: '12px', 
              fontSize: '1.2rem', 
              width: '100%', 
              maxWidth: '300px',
              borderRadius: '8px',
              border: '2px solid #244D73'
            }}
          />
        </div>
      ) : currentQuestion.type === 'checkbox' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left', margin: '20px auto', maxWidth: '650px', fontSize: '1.15rem', color: '#333' }}>
          {currentQuestion.options.map((option) => (
            <label key={option.value} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer', lineHeight: '1.4' }}>
              <input 
                type="checkbox" 
                checked={(answers[currentQuestion.id] || []).includes(option.value)}
                onChange={() => handleCheckboxToggle(option.value)}
                style={{ marginTop: '4px', transform: 'scale(1.6)', cursor: 'pointer', accentColor: '#4A8B39' }} 
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      ) : (
        <div className="options-grid">
          {currentQuestion.options.map((option) => (
            <button
              key={option.value}
              className={`option-btn ${answers[currentQuestion.id] === option.value ? 'selected' : ''}`}
              onClick={() => handleSelect(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}

      <div className="nav-buttons">
        <button className="secondary-btn" onClick={handlePrev} disabled={isLoading}>
          {currentIndex === 0 ? t('survey.backToHome') : t('survey.previous')}
        </button>
        <button className="primary-btn" onClick={handleNext} disabled={isNextDisabled || isLoading}>
          {isLoading ? t('survey.processing') : (currentIndex === questions.length - 1 ? t('survey.seeResults') : t('survey.next'))}
        </button>
      </div>
    </div>
  );
}