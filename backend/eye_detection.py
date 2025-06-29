# eye_detection.py
import dlib
import cv2
import numpy as np

# Initialize dlib's face detector and landmark predictor
detector = dlib.get_frontal_face_detector()
predictor = dlib.shape_predictor("shape_predictor_68_face_landmarks.dat")

# Indices for left and right eyes (dlib's 68-point model)
LEFT_EYE_INDICES = [36, 37, 38, 39, 40, 41]
RIGHT_EYE_INDICES = [42, 43, 44, 45, 46, 47]

def draw_eye_indicators(frame, landmarks):
    """Draw indicators around eyes on the main frame"""
    # Draw left eye indicator (green)
    left_points = np.array([(landmarks.part(i).x, landmarks.part(i).y) for i in LEFT_EYE_INDICES])
    cv2.polylines(frame, [left_points], True, (0, 255, 0), 2)
    cv2.putText(frame, "Left Eye", (left_points[0][0], left_points[0][1]-10), 
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
    
    # Draw right eye indicator (red)
    right_points = np.array([(landmarks.part(i).x, landmarks.part(i).y) for i in RIGHT_EYE_INDICES])
    cv2.polylines(frame, [right_points], True, (0, 0, 255), 2)
    cv2.putText(frame, "Right Eye", (right_points[0][0], right_points[0][1]-10), 
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)

def detect_eyes():
    cap = cv2.VideoCapture(0)  # Webcam
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = detector(gray)

        for face in faces:
            landmarks = predictor(gray, face)
            
            # Draw eye indicators on main frame
            draw_eye_indicators(frame, landmarks)
            
            # Extract and show eye regions (optional)
            left_eye = frame[
                min(p[1] for p in [(landmarks.part(i).x, landmarks.part(i).y) for i in LEFT_EYE_INDICES]):
                max(p[1] for p in [(landmarks.part(i).x, landmarks.part(i).y) for i in LEFT_EYE_INDICES]),
                min(p[0] for p in [(landmarks.part(i).x, landmarks.part(i).y) for i in LEFT_EYE_INDICES]):
                max(p[0] for p in [(landmarks.part(i).x, landmarks.part(i).y) for i in LEFT_EYE_INDICES])
            ]
            
            right_eye = frame[
                min(p[1] for p in [(landmarks.part(i).x, landmarks.part(i).y) for i in RIGHT_EYE_INDICES]):
                max(p[1] for p in [(landmarks.part(i).x, landmarks.part(i).y) for i in RIGHT_EYE_INDICES]),
                min(p[0] for p in [(landmarks.part(i).x, landmarks.part(i).y) for i in RIGHT_EYE_INDICES]):
                max(p[0] for p in [(landmarks.part(i).x, landmarks.part(i).y) for i in RIGHT_EYE_INDICES])
            ]
            
            # Optional: Show eye regions in separate windows
            cv2.imshow("Left Eye", left_eye)
            cv2.imshow("Right Eye", right_eye)

        # Show main camera feed with indicators
        cv2.imshow("Eye Detection", frame)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    detect_eyes()