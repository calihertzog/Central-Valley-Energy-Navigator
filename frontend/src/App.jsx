import { useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import Survey from './Survey';
import logo from './assets/logo.png'; 
import './App.css';

function App() {
  const { t, i18n } = useTranslation();
  const [isSurveyStarted, setIsSurveyStarted] = useState(false);
  const [surveyResults, setSurveyResults] = useState(null);

  const handleSurveyComplete = (data) => {
    console.log("Calculated Results from Backend:", data);
    setSurveyResults(data);
  };

  const handleRestart = () => {
    setSurveyResults(null);
    setIsSurveyStarted(false);
  };

  // Language Toggle Function
  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'es' : 'en';
    i18n.changeLanguage(newLang);
  };

  // Reusable language toggle button component
  const LanguageToggle = () => (
    <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%', padding: '10px' }}>
      <button 
        onClick={toggleLanguage} 
        style={{ background: 'none', border: 'none', color: '#244D73', cursor: 'pointer', textDecoration: 'underline' }}
      >
        {i18n.language === 'en' ? 'Español' : 'English'}
      </button>
    </div>
  );

  // --- View 1: Results Screen ---
  if (surveyResults) {
    return (
      <main className="container center-content">
        <LanguageToggle />
        <img src={logo} alt="CRPE Logo" className="brand-logo" />
        
        <h2 style={{ color: '#244D73', marginTop: '20px' }}>
          {surveyResults.eligible ? t('app.eligible') : t('app.complete')}
        </h2>

        <div 
          className="results-card" 
          style={{ borderLeft: `8px solid ${surveyResults.eligible ? '#4A8B39' : '#ccc'}` }}
        >
          <p>{surveyResults.message}</p>
          
          {surveyResults.discount && (
            <div className="benefit-tag">
              <strong>{t('app.benefit')}</strong> {surveyResults.discount}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {surveyResults.eligible && (
            <button className="primary-btn" onClick={() => window.open('https://www.cpuc.ca.gov/care', '_blank')}>
              {t('app.apply')}
            </button>
          )}
          <button className="secondary-btn" onClick={handleRestart}>
            {t('app.startOver')}
          </button>
        </div>
      </main>
    );
  }

  // --- View 2: Active Survey ---
  if (isSurveyStarted) {
    return (
      <div className="container survey-active"> 
        <LanguageToggle />
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
      <LanguageToggle />
      <header>
        <img src={logo} alt="CRPE Logo" className="brand-logo" />
        <h1 style={{ color: '#244D73' }}>{t('app.title')}</h1>
      </header>
      
      <section className="intro-text">
        <p>
          <Trans i18nKey="app.intro1">
            Kern and Tulare counties have some of the highest energy rates in the United States. 
            California offers subsidy programs like <strong>CARE</strong> and <strong>FERA</strong> to help reduce your monthly bills.
          </Trans>
        </p>
        <p>
          {t('app.intro2')}
        </p>
      </section>

      <button className="primary-btn" onClick={() => setIsSurveyStarted(true)}>
        {t('app.begin')}
      </button>
    </main>
  );
}

export default App;