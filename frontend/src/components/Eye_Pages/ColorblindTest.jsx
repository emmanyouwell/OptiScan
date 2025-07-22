import { useState, useEffect } from 'react';
import axios from 'axios';

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

  // Fetch and predict when plate changes
  useEffect(() => {
    if (imageList.length === 0) return;
    const fetchAndPredict = async () => {
      setLoadingPrediction(true);
      setPredictedNumber('');
      setUserAnswer('');
      try {
        // Fetch image as blob
        const imgUrl = `http://localhost:8000${imageList[currentIndex].url}`;
        const imgRes = await fetch(imgUrl);
        const imgBlob = await imgRes.blob();
        const fd = new FormData();
        fd.append('file', imgBlob, imageList[currentIndex].filename);

        // Send to backend for prediction
        const res = await axios.post(
          'http://localhost:8000/api/colorblindness/predict',
          fd,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        setPredictedNumber(res.data.predicted_number?.toString() ?? '');
        setUserAnswer(res.data.predicted_number?.toString() ?? '');
      } catch (err) {
        setPredictedNumber('');
        setUserAnswer('');
      }
      setLoadingPrediction(false);
    };
    fetchAndPredict();
    // eslint-disable-next-line
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

  const analyzeAndSave = async () => {
    setShowAnalysis(true);

    const wrong = answers.filter(a => !a.is_correct).length + (userAnswer !== imageList[MAX_PLATES - 1].label.toString() ? 1 : 0);
    let suspected_type = "normal";
    if (wrong > 4) suspected_type = "protanopia";

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
      //
    }
    if (!userId) {
      alert("Error: User ID is invalid or missing. Please login again.");
      return;
    }

    const payload = {
      user_id: userId,
      plates: [
        ...answers,
        {
          plate_number: MAX_PLATES,
          correct_answer: imageList[MAX_PLATES - 1].label.toString(),
          user_answer: userAnswer,
          is_correct: userAnswer === imageList[MAX_PLATES - 1].label.toString()
        }
      ],
      suspected_type,
      confidence: Math.max(0, 100 - wrong * 7),
      device_info: { os: window.navigator.platform }
    };

    setAnalysis({
      suspected_type,
      confidence: payload.confidence,
      total_correct: payload.plates.filter(p => p.is_correct).length,
      total_wrong: payload.plates.filter(p => !p.is_correct).length
    });

    try {
      // await axios.post("http://localhost:8000/api/colorblindness/predict", payload); 
      await axios.post("http://localhost:8000/api/colorblindness/save-result", payload); // <-- FIXED ENDPOINT
    } catch (e) {
      // handle error
    }
  };

// const analyzeAndSave = async () => {
//   setShowAnalysis(true);

//   const wrong = answers.filter(a => !a.is_correct).length + (userAnswer !== imageList[MAX_PLATES - 1].label.toString() ? 1 : 0);
//   let suspected_type = "normal";
//   if (wrong > 4) suspected_type = "protanopia";

//   // Get user id from localStorage (as in Login.jsx)
//   let userId = null;
//   try {
//     const userData = localStorage.getItem("user");
//     if (userData) {
//       const userObj = JSON.parse(userData);
//       userId = userObj.id || userObj._id || null;
//       if (!userId || !/^[0-9a-fA-F]{24}$/.test(userId)) {
//         userId = null;
//       }
//     }
//   } catch (error) {
//     userId = null;
//   }
//   if (!userId) {
//     alert("Error: User ID is invalid or missing. Please login again.");
//     return;
//   }

//   const payload = {
//     user_id: userId,
//     plates: [
//       ...answers,
//       {
//         plate_number: MAX_PLATES,
//         correct_answer: imageList[MAX_PLATES - 1].label.toString(),
//         user_answer: userAnswer,
//         is_correct: userAnswer === imageList[MAX_PLATES - 1].label.toString()
//       }
//     ],
//     suspected_type,
//     confidence: Math.max(0, 100 - wrong * 7),
//     device_info: { os: window.navigator.platform }
//   };

//   setAnalysis({
//     suspected_type,
//     confidence: payload.confidence,
//     total_correct: payload.plates.filter(p => p.is_correct).length,
//     total_wrong: payload.plates.filter(p => !p.is_correct).length
//   });

//   try {
//     await axios.post("http://localhost:8000/api/colorblindness/save-result", payload);
//   } catch (e) {
//     // handle error
//   }
// };
  const handleNumpadClick = (num) => {
    setUserAnswer(prev => prev + num);
  };

  const handleClear = () => {
    setUserAnswer('');
  };

  if (imageList.length === 0) return <p style={{ fontSize: "2em", textAlign: "center" }}>Loading images...</p>;

  if (showAnalysis && analysis) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #e0eafc 0%, #cfdef3 100%)"
      }}>
        <div style={{
          background: "#fff",
          borderRadius: "32px",
          boxShadow: "0 8px 32px rgba(60,60,60,0.15)",
          padding: "48px 64px",
          textAlign: "center"
        }}>
          <h2>Test Complete!</h2>
          <p style={{ fontSize: "1.3em" }}>
            <b>Suspected Type:</b> {analysis.suspected_type}
            <br />
            <b>Confidence:</b> {analysis.confidence}%
            <br />
            <b>Correct:</b> {analysis.total_correct} / {MAX_PLATES}
            <br />
            <b>Incorrect:</b> {analysis.total_wrong}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #e0eafc 0%, #cfdef3 100%)"
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "60px",
        background: "#fff",
        borderRadius: "32px",
        boxShadow: "0 8px 32px rgba(60,60,60,0.15)",
        padding: "48px 64px"
      }}>
        <div>
          <img
            src={`http://localhost:8000${imageList[currentIndex].url}`}
            alt="Ishihara Plate"
            style={{
              width: "420px",
              height: "420px",
              objectFit: "contain",
              border: "3px solid #b3b3b3",
              background: "#fff",
              borderRadius: "24px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.07)"
            }}
          />
          <div style={{
            marginTop: "18px",
            fontSize: "1.6em",
            textAlign: "center",
            fontWeight: 500,
            letterSpacing: "1px"
          }}>
            <span>
              Predicted: <b>{loadingPrediction ? "..." : predictedNumber}</b>
            </span>
            <br />
            <span>
              Your Answer: <span style={{ color: "#222" }}>{userAnswer}</span>
            </span>
          </div>
          <div style={{ textAlign: "center", marginTop: "10px", color: "#888" }}>
            Plate {currentIndex + 1} of {MAX_PLATES}
          </div>
        </div>
        <div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 90px)",
            gridTemplateRows: "repeat(4, 90px)",
            gap: "18px",
            marginBottom: "24px"
          }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button
                key={num}
                style={{
                  fontSize: "2.2em",
                  width: "90px",
                  height: "90px",
                  borderRadius: "18px",
                  border: "2px solid #888",
                  background: "#000000ff",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                  transition: "background 0.2s"
                }}
                onClick={() => handleNumpadClick(num.toString())}
              >
                {num}
              </button>
            ))}
            <div></div>
            <button
              style={{
                fontSize: "2.2em",
                width: "90px",
                height: "90px",
                borderRadius: "18px",
                border: "2px solid #888",
                background: "#000000ff",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                transition: "background 0.2s"
              }}
              onClick={() => handleNumpadClick("0")}
            >
              0
            </button>
            <div></div>
          </div>
          <div style={{ display: "flex", gap: "18px", justifyContent: "center" }}>
            <button
              onClick={handleClear}
              style={{
                padding: "14px 32px",
                fontSize: "1.3em",
                borderRadius: "10px",
                border: "2px solid #e23c3c",
                background: "#ffecec",
                color: "#e23c3c",
                fontWeight: 600,
                cursor: "pointer",
                transition: "background 0.2s"
              }}
            >
              Clear
            </button>
            <button
              onClick={handleSubmit}
              style={{
                padding: "14px 32px",
                fontSize: "1.3em",
                borderRadius: "10px",
                border: "2px solid #1bc41b",
                background: "#eaffea",
                color: "#1bc41b",
                fontWeight: 600,
                cursor: userAnswer === '' ? "not-allowed" : "pointer",
                opacity: userAnswer === '' ? 0.6 : 1,
                transition: "background 0.2s"
              }}
              disabled={userAnswer === ''}
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColorBlindTest;