import { useState, useEffect } from 'react';
import axios from 'axios';

const ColorBlindTest = () => {
  const [imageList, setImageList] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    axios.get("http://localhost:8000/api/plates")
      .then(res => {
        setImageList(res.data.plates);
      })
      .catch(err => {
        console.error("Error fetching image list:", err);
      });
  }, []);

  const handleSubmit = () => {
    const currentFile = imageList[currentIndex];
    // const correctLabel = currentFile.split('_')[0];
    const correctLabel = imageList[currentIndex].label.toString();

    if (userAnswer === correctLabel) {
      setFeedback('✅ Correct!');
    } else {
      setFeedback(`❌ Incorrect! It was ${correctLabel}`);
    }

    setTimeout(() => {
      setUserAnswer('');
      setFeedback('');
      setCurrentIndex((prev) => (prev + 1) % imageList.length);
    }, 1500);
  };

  if (imageList.length === 0) return <p>Loading images...</p>;

  return (
    <div className="text-center mt-10">

      {/* <img
        // src={`http://localhost:8000/api/plates/ashihara/${imageList[currentIndex].filename}`}
        // src={`http://localhost:8000/api/plates/ashihara/${imageList[currentIndex].filename}`}

        alt="Ishihara Plate"
        className="mx-auto mb-4 w-64 h-64 object-contain"
      /> */}

      {/* <img
        src={`http://localhost:8000${imageList[currentIndex].url}`}
        alt="Ishihara Plate"
        className="mx-auto mb-4 w-64 h-64 object-contain"
      /> */}
      <img
        src={`http://localhost:8000${imageList[currentIndex].url}`}  // ✅ image.url = "/images/filename.png"
        alt="Ishihara Plate"
        className="mx-auto mb-4 w-64 h-64 object-contain"
      />




      {/* <input
        type="number"
        className="border px-4 py-2 text-lg"
        placeholder="Enter number"
        value={userAnswer}
        onChange={(e) => setUserAnswer(e.target.value)}
      /> */}
      <input
        type="number"
        id="user-answer"
        name="user-answer"
        className="border px-4 py-2 text-lg"
        placeholder="Enter number"
        value={userAnswer}
        onChange={(e) => setUserAnswer(e.target.value)}
        autoComplete="off" // optional
      />

      <button onClick={handleSubmit} className="ml-4 px-4 py-2 bg-blue-500 text-white">
        Submit
      </button>
      {feedback && <p className="mt-4 text-xl">{feedback}</p>}
    </div>
  );
};

export default ColorBlindTest;
