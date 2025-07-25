import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import UserNavBar from '../layouts/UserNavBar';
import '../../CSS/ColorBlindResult.css';

const ColorBlindResult = () => {
    const [testResult, setTestResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showDetailedResults, setShowDetailedResults] = useState(false);
    const [generatingPDF, setGeneratingPDF] = useState(false);

    useEffect(() => {
        fetchLatestTestResult();
    }, []);

    const fetchLatestTestResult = async () => {
        try {
            let userId = null;
            try {
                const userData = localStorage.getItem("user");
                if (userData) {
                    const userObj = JSON.parse(userData);
                    userId = userObj?.id || null;
                }
            } catch (error) {
                setError("Error retrieving user data. Please login again.");
                setLoading(false);
                return;
            }

            if (!userId) {
                setError("User ID not found. Please login again.");
                setLoading(false);
                return;
            }

            const response = await axios.get(`http://localhost:8000/api/colorblindness/results/${userId}`);
            setTestResult(response.data);
            setLoading(false);
        } catch (err) {
            setError("Error loading test results. Please try again later.");
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZone: 'Asia/Manila'
        });
    };

    const getImageBase64 = (url) => {
        return new Promise((resolve) => {
            try {
                const img = new Image();
                img.crossOrigin = 'anonymous';

                img.onload = () => {
                    try {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');

                        canvas.width = img.width;
                        canvas.height = img.height;

                        ctx.drawImage(img, 0, 0);

                        const dataURL = canvas.toDataURL('image/png');
                        resolve(dataURL);
                    } catch (canvasError) {
                        console.error('Error converting image to base64:', canvasError);
                        resolve(null);
                    }
                };

                img.onerror = (error) => {
                    console.error('Error loading image:', error);
                    resolve(null);
                };


                img.src = url;

            } catch (error) {
                console.error('Error in getImageBase64:', error);
                resolve(null);
            }
        });
    };

    const generatePDF = async () => {
        try {
            setGeneratingPDF(true);

            const doc = new jsPDF();

            // Header
            doc.setFontSize(20);
            doc.setTextColor(0, 123, 255);
            doc.text('COLORBLIND TEST RESULT', 105, 20, { align: 'center' });

            // Test date
            doc.setFontSize(12);
            doc.setTextColor(100, 100, 100);
            doc.text(`Test Date: ${formatDate(testResult.test_date)}`, 105, 30, { align: 'center' });

            // Results summary
            doc.setFontSize(14);
            doc.setTextColor(0, 0, 0);

            const correctAnswers = testResult.plates?.filter(plate => plate.is_correct).length || 0;
            const incorrectAnswers = testResult.plates?.filter(plate => !plate.is_correct).length || 0;
            const totalPlates = testResult.plates?.length || 14;

            doc.text(`Suspected Type: ${testResult.suspected_type}`, 20, 50);
            doc.text(`Confidence: ${testResult.confidence}%`, 20, 65);
            doc.text(`Correct: ${correctAnswers}/${totalPlates}`, 120, 50);
            doc.text(`Incorrect: ${incorrectAnswers}`, 120, 65);

            if (testResult.plates && testResult.plates.length > 0) {
                const tableData = [];

                const imagePromises = testResult.plates.map((plate) => {
                    if (plate.image_url) {
                        return getImageBase64(plate.image_url).then(imageBase64 => ({
                            plateNumber: plate.plate_number,
                            imageBase64
                        }));
                    }
                    return Promise.resolve({ plateNumber: plate.plate_number, imageBase64: null });
                });

                const imageResults = await Promise.all(imagePromises);
                const imageMap = new Map(imageResults.map(result => [result.plateNumber, result.imageBase64]));

                testResult.plates.forEach((plate) => {
                    const imageBase64 = imageMap.get(plate.plate_number);

                    tableData.push([
                        plate.plate_number.toString(),
                        imageBase64 ? 'Image' : 'No Image',
                        plate.correct_answer || 'N/A',
                        plate.user_answer || 'No Answer',
                        plate.is_correct ? 'CORRECT' : 'INCORRECT'
                    ]);
                });

                // Split table data before and after plate 8
                const tableDataBefore8 = [];
                const tableDataFrom8 = [];

                testResult.plates.forEach((plate) => {
                    const imageBase64 = imageMap.get(plate.plate_number);
                    const row = [
                        plate.plate_number.toString(),
                        imageBase64 ? 'Image' : 'No Image',
                        plate.correct_answer || 'N/A',
                        plate.user_answer || 'No Answer',
                        plate.is_correct ? 'CORRECT' : 'INCORRECT'
                    ];

                    if (plate.plate_number < 8) {
                        tableDataBefore8.push(row);
                    } else {
                        tableDataFrom8.push(row);
                    }
                });

                const drawTable = (tableData, startY) => {
                    autoTable(doc, {
                        head: [['Plate No.', 'Image', 'Correct', 'Your Answer', 'Result']],
                        body: tableData,
                        startY,
                        theme: 'grid',
                        tableWidth: 'wrap',
                        margin: { horizontal: (doc.internal.pageSize.getWidth() - 125) / 2 },
                        headStyles: {
                            fillColor: [0, 123, 255],
                            textColor: [255, 255, 255],
                            fontSize: 10
                        },
                        styles: {
                            fontSize: 9,
                            cellPadding: 3,
                            overflow: 'linebreak',
                            minCellHeight: 24
                        },
                        columnStyles: {
                            0: { cellWidth: 20 },
                            1: { cellWidth: 25 },
                            2: { cellWidth: 25 },
                            3: { cellWidth: 30 },
                            4: { cellWidth: 25 }
                        },
                        didDrawCell: function (data) {
                            if (data.column.index === 1 && data.section === 'body') {
                                const plateNumber = parseInt(data.row.raw[0]);
                                const imageBase64 = imageMap.get(plateNumber);

                                if (imageBase64) {
                                    try {
                                        const imgWidth = 20;
                                        const imgHeight = 20;
                                        const centerX = data.cell.x + (data.cell.width - imgWidth) / 2;
                                        const centerY = data.cell.y + (data.cell.height - imgHeight) / 2;

                                        doc.addImage(imageBase64, 'PNG', centerX, centerY, imgWidth, imgHeight);
                                    } catch (imgError) {
                                        console.error('Error adding image to PDF:', imgError);
                                    }
                                }
                            }
                        }
                    });
                };

              
                drawTable(tableDataBefore8, 80);
                doc.addPage();
                drawTable(tableDataFrom8, 20);

                // autoTable(doc, {
                //     head: [['Plate No.', 'Image', 'Correct', 'Your Answer', 'Result']],
                //     body: tableData,
                //     startY: 80,
                //     theme: 'grid',
                //     tableWidth: 'wrap',
                //     margin: { horizontal: (doc.internal.pageSize.getWidth() - 125) / 2 },
                //     headStyles: {
                //         fillColor: [0, 123, 255],
                //         textColor: [255, 255, 255],
                //         fontSize: 10
                //     },
                //     styles: {
                //         fontSize: 9,
                //         cellPadding: 3,
                //         overflow: 'linebreak',
                //         minCellHeight: 24 
                //     },
                //     columnStyles: {
                //         0: { cellWidth: 20 },
                //         1: { cellWidth: 25 }, 
                //         2: { cellWidth: 25 },
                //         3: { cellWidth: 30 },
                //         4: { cellWidth: 25 }
                //     },
                //     didDrawCell: function (data) {
                //         if (data.column.index === 1 && data.section === 'body') {
                //             const plateNumber = parseInt(data.row.raw[0]);
                //             const imageBase64 = imageMap.get(plateNumber);

                //             if (imageBase64) {
                //                 try {
                //                     const imgWidth = 20;
                //                     const imgHeight = 20;


                //                     const centerX = data.cell.x + (data.cell.width - imgWidth) / 2;
                //                     const centerY = data.cell.y + (data.cell.height - imgHeight) / 2;

                //                     doc.addImage(
                //                         imageBase64,
                //                         'PNG',
                //                         centerX,
                //                         centerY,
                //                         imgWidth,
                //                         imgHeight
                //                     );
                //                 } catch (imgError) {
                //                     console.error('Error adding image to PDF:', imgError);
                //                 }
                //             }
                //         }
                //     }
                // });

            }

            const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 20 : 100;
            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            doc.text(
                'Note: This is a screening test only. For a definitive diagnosis, please consult with an eye care professional.',
                20,
                finalY,
                { maxWidth: 170 }
            );


            const fileName = `colorblind-test-result-${new Date().getTime()}.pdf`;
            doc.save(fileName);

        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Error generating PDF. Please try again.');
        } finally {
            setGeneratingPDF(false);
        }
    };

    if (loading) {
        return (
            <>
                <UserNavBar />
                <div className="colorblind-loading">Loading test results...</div>
            </>
        );
    }

    if (error) {
        return (
            <>
                <UserNavBar />
                <div className="colorblind-analysis-container">
                    <div className="colorblind-analysis-card">
                        <h2 className="colorblind-title" style={{ color: '#dc3545' }}>Error</h2>
                        <p>{error}</p>
                    </div>
                </div>
            </>
        );
    }

    if (!testResult) {
        return (
            <>
                <UserNavBar />
                <div className="colorblind-analysis-container">
                    <div className="colorblind-analysis-card">
                        <h2 className="colorblind-title">No Results Found</h2>
                        <p>No test results found. Please take the test first.</p>
                    </div>
                </div>
            </>
        );
    }

    const correctAnswers = testResult.plates?.filter(plate => plate.is_correct).length || 0;
    const incorrectAnswers = testResult.plates?.filter(plate => !plate.is_correct).length || 0;
    const totalPlates = testResult.plates?.length || 14;

    return (
        <>
            <UserNavBar />
            <div className="colorblind-analysis-container">
                <div className="colorblind-analysis-card">
                    <h1 className="colorblind-title">COLORBLIND TEST RESULT</h1>
                    <p className="colorblind-date">Test Date: {formatDate(testResult.test_date)}</p>

                    <div className="colorblind-result-grid">
                        <div>
                            <span className="result-label">Suspected Type:</span>
                            <span className="result-value">{testResult.suspected_type}</span>
                        </div>
                        <div>
                            <span className="result-label">Confidence:</span>
                            <span className="result-value">{testResult.confidence}%</span>
                        </div>
                        <div>
                            <span className="result-label">Correct:</span>
                            <span className="result-value result-correct">{correctAnswers}/{totalPlates}</span>
                        </div>
                        <div>
                            <span className="result-label">Incorrect:</span>
                            <span className="result-value result-incorrect">{incorrectAnswers}</span>
                        </div>
                    </div>

                    <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                        <button
                            onClick={() => setShowDetailedResults(!showDetailedResults)}
                            className="result-button"
                        >
                            {showDetailedResults ? 'Hide Detailed Result' : 'Show Detailed Result'}
                        </button>
                    </div>

                    {showDetailedResults && (
                        <div className="result-table-wrapper">
                            <table className="result-table">
                                <thead>
                                    <tr>
                                        <th>PLATE NO.</th>
                                        <th>IMAGE</th>
                                        <th>CORRECT</th>
                                        <th>YOUR ANSWER</th>
                                        <th>RESULT</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {testResult.plates.map((plate, index) => (
                                        <tr key={index}>
                                            <td>{plate.plate_number}</td>
                                            <td>
                                                {plate.image_url ? (
                                                    <img
                                                        src={plate.image_url}
                                                        alt={`Plate ${plate.plate_number}`}
                                                        style={{ width: '50px', height: '50px', borderRadius: '50%' }}
                                                    />
                                                ) : (
                                                    'No Image'
                                                )}
                                            </td>
                                            <td>{plate.correct_answer}</td>
                                            <td>{plate.user_answer || 'No Answer'}</td>
                                            <td>
                                                <span className={`result-badge ${plate.is_correct ? 'badge-correct' : 'badge-incorrect'}`}>
                                                    {plate.is_correct ? 'CORRECT' : 'INCORRECT'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div className="colorblind-info">
                        <h4>What do these results mean?</h4>
                        {testResult.suspected_type === 'normal' ? (
                            <p>Your results suggest normal color vision. You were able to correctly identify most or all of the numbers in the Ishihara color plates.</p>
                        ) : (
                            <>
                                <p>
                                    <strong>{testResult.suspected_type.charAt(0).toUpperCase() + testResult.suspected_type.slice(1)}</strong> is a type of color vision deficiency where certain colors may appear similar or difficult to distinguish.
                                </p>
                                <p style={{ fontSize: '0.9em', fontStyle: 'italic' }}>
                                    Note: This is a screening test only. For a definitive diagnosis, please consult with an eye care professional.
                                </p>
                            </>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button
                            onClick={() => window.location.href = '/colorblind-test'}
                            className="result-button retake-button"
                        >
                            RETAKE TEST
                        </button>
                        <button
                            onClick={generatePDF}
                            className="result-button pdf-button"
                            disabled={generatingPDF}
                        >
                            {generatingPDF ? 'GENERATING PDF...' : 'PDF RESULT'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ColorBlindResult;