from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.responses import JSONResponse
from utils.mediapipe_eye_tracking import MediaPipeEyeTracker
import json
import logging
from datetime import datetime
from typing import List, Dict, Any

logger = logging.getLogger(__name__)
router = APIRouter()

# Initialize eye tracker
eye_tracker = MediaPipeEyeTracker()

@router.websocket("/ws/eye-tracking")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    metrics_history = []
    
    try:
        while True:
            # Receive image data from frontend
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Decode and process frame
            frame = eye_tracker.decode_image(message['image'])
            if frame is not None:
                # Process frame
                metrics = eye_tracker.process_frame(frame)
                metrics['timestamp'] = datetime.now().isoformat()
                metrics_history.append(metrics)
                
                # Keep only last 100 frames for analysis
                if len(metrics_history) > 100:
                    metrics_history = metrics_history[-100:]
                
                # Analyze metrics
                analysis = eye_tracker.analyze_metrics(metrics_history[-50:])
                
                # Send response back to frontend
                response = {
                    'current_metrics': metrics,
                    'analysis': analysis,
                    'history_count': len(metrics_history)
                }
                
                await websocket.send_text(json.dumps(response))
            
    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        await websocket.close()

@router.post("/analyze-batch")
async def analyze_batch_data(data: Dict[str, Any]):
    """Analyze a batch of eye tracking data"""
    try:
        metrics_history = data.get('metrics', [])
        
        if not metrics_history:
            raise HTTPException(status_code=400, detail="No metrics data provided")
        
        # Analyze the data
        analysis = eye_tracker.analyze_metrics(metrics_history)
        
        # Calculate additional statistics
        valid_metrics = [m for m in metrics_history if m.get('detected', False)]
        
        if valid_metrics:
            avg_left_ear = sum(m['left_ear'] for m in valid_metrics) / len(valid_metrics)
            avg_right_ear = sum(m['right_ear'] for m in valid_metrics) / len(valid_metrics)
            avg_left_pupil = sum(m['left_pupil'] for m in valid_metrics) / len(valid_metrics)
            avg_right_pupil = sum(m['right_pupil'] for m in valid_metrics) / len(valid_metrics)
            
            stats = {
                'avg_left_ear': avg_left_ear,
                'avg_right_ear': avg_right_ear,
                'avg_left_pupil': avg_left_pupil,
                'avg_right_pupil': avg_right_pupil,
                'detection_rate': len(valid_metrics) / len(metrics_history),
                'total_frames': len(metrics_history)
            }
        else:
            stats = {
                'avg_left_ear': 0, 'avg_right_ear': 0,
                'avg_left_pupil': 0, 'avg_right_pupil': 0,
                'detection_rate': 0, 'total_frames': len(metrics_history)
            }
        
        return JSONResponse({
            'status': analysis,
            'statistics': stats,
            'recommendations': get_recommendations(analysis)
        })
        
    except Exception as e:
        logger.error(f"Error in batch analysis: {e}")
        raise HTTPException(status_code=500, detail="Analysis failed")

def get_recommendations(status: str) -> List[str]:
    """Get recommendations based on analysis status"""
    recommendations = {
        'Normal': [
            'Continue regular eye health checkups',
            'Maintain good screen time habits',
            'Take regular breaks from screen work'
        ],
        'Opioid': [
            'Consult healthcare provider about medication effects',
            'Monitor for other symptoms',
            'Consider alternative pain management if applicable'
        ],
        'Stimulant': [
            'Monitor caffeine intake',
            'Ensure adequate rest and sleep',
            'Consider reducing stimulant consumption'
        ],
        'Neurological': [
            'Seek immediate neurological evaluation',
            'Monitor symptoms closely',
            'Keep detailed symptom log'
        ]
    }
    return recommendations.get(status, ['Consult healthcare provider for further evaluation'])