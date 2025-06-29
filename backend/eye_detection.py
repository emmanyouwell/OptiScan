# eye_detection.py
import dlib
import cv2
import numpy as np

# Initialize dlib's face detector and landmark predictor
detector = dlib.get_frontal_face_detector()
predictor = dlib.shape_predictor("shape_predictor_68_face_landmarks.dat")

def get_eye_region(frame, landmarks, eye_indices):
    """Extract eye region based on landmarks"""
    points = np.array([(landmarks.part(i).x, landmarks.part(i).y) for i in eye_indices])
    x, y, w, h = cv2.boundingRect(points)
    eye = frame[y:y+h, x:x+w]
    return eye

# Indices for left and right eyes (dlib's 68-point model)
LEFT_EYE_INDICES = [36, 37, 38, 39, 40, 41]
RIGHT_EYE_INDICES = [42, 43, 44, 45, 46, 47]

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

            # Extract left and right eyes
            left_eye = get_eye_region(frame, landmarks, LEFT_EYE_INDICES)
            right_eye = get_eye_region(frame, landmarks, RIGHT_EYE_INDICES)

            # Show eye regions
            cv2.imshow("Left Eye", left_eye)
            cv2.imshow("Right Eye", right_eye)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    detect_eyes()