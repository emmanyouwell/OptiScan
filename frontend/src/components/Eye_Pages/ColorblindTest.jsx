import { useState, useEffect } from 'react';
import axios from 'axios';
import UserNavBar from '../layouts/UserNavBar';
import '../../CSS/ColorBlindTest.css'; // Import the CSS file

const MAX_PLATES = 14;

const ColorBlindTest = () => {
  const [imageList, setImageList] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [predictedNumber, setPredictedNumber] = useState('');
  const [answers, setAnswers] = useState([]);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [loadingPrediction, setLoadingPrediction] = useState(false);

  useEffect(() => {
    axios.get("http://localhost:8000/api/plates")
      .then(res => {
        const shuffled = [...res.data.plates];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        setImageList(shuffled.slice(0, MAX_PLATES));
      })
      .catch(err => {
        console.error("Error fetching image list:", err);
      });
  }, []);

  useEffect(() => {
    if (imageList.length === 0) return;
    const fetchAndPredict = async () => {
      setLoadingPrediction(true);
      setPredictedNumber('');
      setUserAnswer('');
      try {
        const imgUrl = `http://localhost:8000${imageList[currentIndex].url}`;
        const imgRes = await fetch(imgUrl);
        const imgBlob = await imgRes.blob();
        const fd = new FormData();
        fd.append('file', imgBlob, imageList[currentIndex].filename);

        const res = await axios.post(
          'http://localhost:8000/api/colorblindness/predict',
          fd,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        setPredictedNumber(res.data.predicted_number?.toString() ?? '');
      } catch (err) {
        setPredictedNumber('');
        setUserAnswer('');
      }
      setLoadingPrediction(false);
    };
    fetchAndPredict();
  }, [currentIndex, imageList.length]);

  const handleSubmit = () => {
    const currentFile = imageList[currentIndex];
    const correctLabel = currentFile.label.toString();
    const isCorrect = userAnswer === correctLabel;

    setAnswers(prev => [
      ...prev,
      {
        plate_number: currentIndex + 1,
        correct_answer: correctLabel,
        user_answer: userAnswer,
        is_correct: isCorrect
      }
    ]);

    if (currentIndex + 1 < MAX_PLATES) {
      setCurrentIndex(prev => prev + 1);
    } else {
      analyzeAndSave();
    }
  };

  const typeMap = {
    "1": "protanopia",
    "2": "deuteranopia",
    "3": "tritanopia"
  };

  const analyzeAndSave = async () => {
    setShowAnalysis(true);

    const typeCounts = { protanopia: 0, deuteranopia: 0, tritanopia: 0 };
    const allAnswers = [
      ...answers,
      {
        plate_number: MAX_PLATES,
        correct_answer: imageList[MAX_PLATES - 1].label.toString(),
        user_answer: userAnswer,
        is_correct: userAnswer === imageList[MAX_PLATES - 1].label.toString()
      }
    ];

    allAnswers.forEach((ans, idx) => {
      if (!ans.is_correct) {
        const plate = imageList[idx];
        const typeId = plate.type?.toString();
        const hiddenType = typeMap[typeId];
        if (hiddenType) typeCounts[hiddenType]++;
      }
    });

    let suspected_type = "normal";
    let maxCount = 0;
    Object.entries(typeCounts).forEach(([type, count]) => {
      if (count > maxCount) {
        maxCount = count;
        suspected_type = type;
      }
    });
    if (maxCount < 3) suspected_type = "normal";

    const total_wrong = allAnswers.filter(a => !a.is_correct).length;
    const total_correct = allAnswers.filter(a => a.is_correct).length;

    let userId = null;
    try {
      const userData = localStorage.getItem("user");
      if (userData) {
        const userObj = JSON.parse(userData);
        const candidateId = userObj?.id || userObj?.id || null;
        if (candidateId && /^[0-9a-fA-F]{24}$/.test(candidateId)) {
          userId = candidateId;
        }
      }
    } catch (error) {
      console.error("Error parsing user data from localStorage:", error);
      alert("Error retrieving user data. Please login again.");
      return;
    }
    if (!userId) {
      alert("Error: User ID is invalid or missing. Please login again.");
      return;
    }

    const payload = {
      user_id: userId,
      plates: allAnswers,
      suspected_type,
      confidence: Math.max(0, 100 - total_wrong * 7),
      device_info: { os: window.navigator.platform }
    };

    setAnalysis({
      suspected_type,
      confidence: payload.confidence,
      total_correct,
      total_wrong
    });

    try {
      await axios.post("http://localhost:8000/api/colorblindness/save-result", payload);
    } catch (e) {
      console.error("Error saving results:", e);
      alert("Error saving results. Please try again later.");
    }
  };

  const handleNumpadClick = (num) => {
    setUserAnswer(prev => prev + num);
  };

  const handleClear = () => {
    setUserAnswer('');
  };

  if (imageList.length === 0) {
    return <div className="colorblind-loading">Loading images...</div>;
  }

  if (showAnalysis && analysis) {
    return (
      <>
      <UserNavBar />
      <div className="colorblind-analysis-container">
        <div className="colorblind-analysis-card">
          <h2 className="colorblind-analysis-title">Test Complete!</h2>
          <div className="colorblind-analysis-content">
            <div className="colorblind-analysis-item">
              <span className="colorblind-analysis-label">Suspected Type:</span>{' '}
              <span className="colorblind-analysis-value">{analysis.suspected_type}</span>
            </div>
            <div className="colorblind-analysis-item">
              <span className="colorblind-analysis-label">Confidence:</span>{' '}
              <span className="colorblind-analysis-value">{analysis.confidence}%</span>
            </div>
            <div className="colorblind-analysis-item">
              <span className="colorblind-analysis-label">Correct:</span>{' '}
              <span className="colorblind-analysis-value">{analysis.total_correct} / {MAX_PLATES}</span>
            </div>
            <div className="colorblind-analysis-item">
              <span className="colorblind-analysis-label">Incorrect:</span>{' '}
              <span className="colorblind-analysis-value">{analysis.total_wrong}</span>
            </div>
          </div>
        </div>
      </div>
      </>
    );
  }

  return (
    <>
      <UserNavBar />
      <div className="colorblind-container">
        <div className="colorblind-test-card">
          <div className="colorblind-image-section">
            <img
              src={`http://localhost:8000${imageList[currentIndex].url}`}
              alt="Ishihara Plate"
              className="colorblind-image"
            />
            <div className="colorblind-answer-display">
              Your Answer: <span className="colorblind-answer-text">{userAnswer}</span>
            </div>
            <div className="colorblind-plate-counter">
              Plate {currentIndex + 1} of {MAX_PLATES}
            </div>
          </div>
          
          <div className="colorblind-controls-section">
            <div className="colorblind-numpad">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <button
                  key={num}
                  className="colorblind-numpad-button"
                  onClick={() => handleNumpadClick(num.toString())}
                >
                  {num}
                </button>
              ))}
              <div></div>
              <button
                className="colorblind-numpad-button"
                onClick={() => handleNumpadClick("0")}
              >
                0
              </button>
              <div></div>
            </div>
            
            <div className="colorblind-action-buttons">
              <button
                onClick={handleClear}
                className="colorblind-btn colorblind-btn-clear"
              >
                Clear
              </button>
              <button
                onClick={handleSubmit}
                className="colorblind-btn colorblind-btn-submit"
                disabled={userAnswer === ''}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ColorBlindTest;