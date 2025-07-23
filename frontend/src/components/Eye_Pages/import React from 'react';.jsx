import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import EyeTrackingAnalysis from './Eye_Tracking';
import * as EyeTrackUtils from '../utils/Eye_Track';

// frontend/src/components/Eye_Pages/Eye_Tracking.test.jsx

// Mock external dependencies
jest.mock('axios');
jest.mock('react-hot-toast');
jest.mock('jspdf');
jest.mock('jspdf-autotable');
jest.mock('react-webcam', () => {
  return React.forwardRef((props, ref) => {
    React.useImperativeHandle(ref, () => ({
      getScreenshot: jest.fn(() => 'data:image/jpeg;base64,mock-screenshot')
    }));
    return <div data-testid="webcam">Mock Webcam</div>;
  });
});

// Mock Eye_Track utilities
jest.mock('../utils/Eye_Track', () => ({
  analyzeLighting: jest.fn(),
  analyzeDistance: jest.fn(),
  validateEnvironment: jest.fn(),
  getEnvironmentStatusColor: jest.fn(),
  getStatusColor: jest.fn(),
  validateTestConditions: jest.fn(),
  generateEyeTrackingPDF: jest.fn()
}));

// Mock CSS import
jest.mock('../../CSS/Eye_Tracking.css', () => ({}));

const mockedAxios = axios;
const mockedToast = toast;
const mockedJsPDF = jsPDF;

describe('EyeTrackingAnalysis Component', () => {
  let mockAxiosInstance;
  let user;

  beforeEach(() => {
    user = userEvent.setup();
    
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });

    // Mock sessionStorage
    Object.defineProperty(window, 'sessionStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });

    // Mock axios instance
    mockAxiosInstance = {
      post: jest.fn(),
      get: jest.fn(),
      defaults: { headers: {} }
    };
    mockedAxios.create = jest.fn(() => mockAxiosInstance);

    // Mock toast methods
    mockedToast.success = jest.fn();
    mockedToast.error = jest.fn();
    mockedToast.loading = jest.fn(() => 'toast-id');
    mockedToast.dismiss = jest.fn();

    // Mock jsPDF
    mockedJsPDF.mockImplementation(() => ({
      text: jest.fn(),
      save: jest.fn(),
      addPage: jest.fn(),
      setFontSize: jest.fn(),
      setFont: jest.fn(),
      autoTable: jest.fn()
    }));

    // Mock Eye_Track utilities
    EyeTrackUtils.analyzeLighting.mockReturnValue({
      status: 'optimal',
      value: 75,
      message: 'Good lighting'
    });
    
    EyeTrackUtils.analyzeDistance.mockReturnValue({
      status: 'optimal',
      value: 80,
      message: 'Good distance'
    });
    
    EyeTrackUtils.validateEnvironment.mockReturnValue({
      distance: { status: 'optimal', value: 80, message: 'Position OK' },
      lighting: { status: 'optimal', value: 75, message: 'Lighting OK' },
      faceDetected: true,
      isValidEnvironment: true
    });

    EyeTrackUtils.validateTestConditions.mockReturnValue({
      isValid: true,
      errors: []
    });

    EyeTrackUtils.generateEyeTrackingPDF.mockImplementation(
      (reportData, onProgress, onSuccess, onError) => {
        setTimeout(() => onSuccess('PDF generated successfully!'), 100);
        return Promise.resolve();
      }
    );

    // Mock URL.createObjectURL and revokeObjectURL
    global.URL.createObjectURL = jest.fn(() => 'mock-url');
    global.URL.revokeObjectURL = jest.fn();
    
    // Mock Blob
    global.Blob = jest.fn(() => ({ type: 'text/plain' }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Component Initialization', () => {
    test('renders without crashing', () => {
      render(<EyeTrackingAnalysis />);
      expect(screen.getByText('Eye Analysis')).toBeInTheDocument();
    });

    test('shows authentication required message when no token', () => {
      window.localStorage.getItem.mockReturnValue(null);
      window.sessionStorage.getItem.mockReturnValue(null);
      
      render(<EyeTrackingAnalysis />);
      expect(screen.getByText('Authentication Required')).toBeInTheDocument();
      expect(screen.getByText('Please log in to access the eye analysis system.')).toBeInTheDocument();
    });

    test('initializes with auth token from localStorage', () => {
      window.localStorage.getItem.mockReturnValue('mock-token');
      
      render(<EyeTrackingAnalysis />);
      expect(screen.getByText('🔒 Authenticated Session')).toBeInTheDocument();
    });

    test('initializes with auth token from loginData', () => {
      window.localStorage.getItem.mockImplementation((key) => {
        if (key === 'loginData') {
          return JSON.stringify({ access_token: 'login-data-token' });
        }
        return null;
      });
      
      render(<EyeTrackingAnalysis />);
      expect(screen.getByText('🔒 Authenticated Session')).toBeInTheDocument();
    });

    test('renders all test steps correctly', () => {
      window.localStorage.getItem.mockReturnValue('mock-token');
      
      render(<EyeTrackingAnalysis />);
      
      expect(screen.getByText('Setup')).toBeInTheDocument();
      expect(screen.getByText('Ear Detection')).toBeInTheDocument();
      expect(screen.getByText('Pupil Analysis')).toBeInTheDocument();
      expect(screen.getByText('Blink Detection')).toBeInTheDocument();
      expect(screen.getByText('Results')).toBeInTheDocument();
    });
  });

  describe('Environment Validation', () => {
    test('displays environment status during setup step', () => {
      window.localStorage.getItem.mockReturnValue('mock-token');
      
      render(<EyeTrackingAnalysis />);
      
      expect(screen.getByText('Lighting')).toBeInTheDocument();
      expect(screen.getByText('Position')).toBeInTheDocument();
    });

    test('shows ready indicator when environment is valid', async () => {
      window.localStorage.getItem.mockReturnValue('mock-token');
      
      render(<EyeTrackingAnalysis />);
      
      // Wait for environment check to complete
      await waitFor(() => {
        expect(screen.getByText('✓ Ready to begin')).toBeInTheDocument();
      });
    });

    test('shows force environment ready button when environment invalid', () => {
      window.localStorage.getItem.mockReturnValue('mock-token');
      
      EyeTrackUtils.validateEnvironment.mockReturnValue({
        distance: { status: 'too_far', value: 20, message: 'Too far' },
        lighting: { status: 'too_dark', value: 30, message: 'Too dark' },
        faceDetected: false,
        isValidEnvironment: false
      });
      
      render(<EyeTrackingAnalysis />);
      
      expect(screen.getByText('🔧 Force Environment Ready')).toBeInTheDocument();
    });

    test('forces environment ready when button clicked', async () => {
      window.localStorage.getItem.mockReturnValue('mock-token');
      
      EyeTrackUtils.validateEnvironment.mockReturnValue({
        distance: { status: 'too_far', value: 20, message: 'Too far' },
        lighting: { status: 'too_dark', value: 30, message: 'Too dark' },
        faceDetected: false,
        isValidEnvironment: false
      });
      
      render(<EyeTrackingAnalysis />);
      
      const forceButton = screen.getByText('🔧 Force Environment Ready');
      await user.click(forceButton);
      
      expect(mockedToast.success).toHaveBeenCalledWith('Environment set to ready!', { duration: 2000 });
    });
  });

  describe('Session Management', () => {
    test('creates session when starting analysis', async () => {
      window.localStorage.getItem.mockReturnValue('mock-token');
      mockAxiosInstance.post.mockResolvedValue({
        data: { session_id: 'test-session-123', user_id: 'user-456' }
      });
      
      render(<EyeTrackingAnalysis />);
      
      const beginButton = screen.getByText('Begin Analysis');
      await user.click(beginButton);
      
      await waitFor(() => {
        expect(mockAxiosInstance.post).toHaveBeenCalledWith('/session/create');
        expect(mockedToast.success).toHaveBeenCalledWith('Session created successfully!', { duration: 2000 });
      });
    });

    test('handles session creation failure', async () => {
      window.localStorage.getItem.mockReturnValue('mock-token');
      mockAxiosInstance.post.mockRejectedValue(new Error('Session creation failed'));
      
      render(<EyeTrackingAnalysis />);
      
      const beginButton = screen.getByText('Begin Analysis');
      await user.click(beginButton);
      
      await waitFor(() => {
        expect(mockedToast.error).toHaveBeenCalledWith('Failed to create session', { duration: 3000 });
      });
    });

    test('handles 401 error during session creation', async () => {
      window.localStorage.getItem.mockReturnValue('mock-token');
      mockAxiosInstance.post.mockRejectedValue({
        response: { status: 401 }
      });
      
      render(<EyeTrackingAnalysis />);
      
      const beginButton = screen.getByText('Begin Analysis');
      await user.click(beginButton);
      
      await waitFor(() => {
        expect(mockedToast.error).toHaveBeenCalledWith('Please log in again', { duration: 3000 });
      });
    });

    test('displays session ID when session is created', async () => {
      window.localStorage.getItem.mockReturnValue('mock-token');
      mockAxiosInstance.post.mockResolvedValue({
        data: { session_id: 'test-session-123456789', user_id: 'user-456' }
      });
      
      render(<EyeTrackingAnalysis />);
      
      const beginButton = screen.getByText('Begin Analysis');
      await user.click(beginButton);
      
      await waitFor(() => {
        expect(screen.getByText('Session: 23456789')).toBeInTheDocument();
      });
    });
  });

  describe('Test Execution', () => {
    beforeEach(() => {
      window.localStorage.getItem.mockReturnValue('mock-token');
      mockAxiosInstance.post.mockImplementation((url) => {
        if (url === '/session/create') {
          return Promise.resolve({
            data: { session_id: 'test-session-123', user_id: 'user-456' }
          });
        }
        if (url.includes('/test/')) {
          return Promise.resolve({
            data: {
              left_ear_score: 0.85,
              right_ear_score: 0.82,
              left_pupil_mm: 3.2,
              right_pupil_mm: 3.1,
              total_blinks: 15,
              result: 'Test completed',
              user_id: 'user-456'
            }
          });
        }
        return Promise.resolve({ data: {} });
      });
    });

    test('runs ear detection test successfully', async () => {
      render(<EyeTrackingAnalysis />);
      
      // Start analysis
      const beginButton = screen.getByText('Begin Analysis');
      await user.click(beginButton);
      
      await waitFor(() => {
        expect(screen.getByText('Start Ear Detection')).toBeInTheDocument();
      });
      
      // Start ear detection test
      const startTestButton = screen.getByText('Start Ear Detection');
      await user.click(startTestButton);
      
      await waitFor(() => {
        expect(mockAxiosInstance.post).toHaveBeenCalledWith(
          '/test/ear-detection',
          expect.objectContaining({
            test_type: 'ear-detection',
            duration: 3000
          })
        );
      });
    });

    test('runs pupil dilation test successfully', async () => {
      render(<EyeTrackingAnalysis />);
      
      // Navigate to pupil test (simulate completing ear detection)
      const beginButton = screen.getByText('Begin Analysis');
      await user.click(beginButton);
      
      await waitFor(() => {
        const startTestButton = screen.getByText('Start Ear Detection');
        fireEvent.click(startTestButton);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Start Pupil Analysis')).toBeInTheDocument();
      });
      
      const pupilTestButton = screen.getByText('Start Pupil Analysis');
      await user.click(pupilTestButton);
      
      await waitFor(() => {
        expect(mockAxiosInstance.post).toHaveBeenCalledWith(
          '/test/pupil-dilation',
          expect.objectContaining({
            test_type: 'pupil-dilation',
            duration: 5000
          })
        );
      });
    });

    test('handles test failure gracefully', async () => {
      mockAxiosInstance.post.mockImplementation((url) => {
        if (url === '/session/create') {
          return Promise.resolve({
            data: { session_id: 'test-session-123', user_id: 'user-456' }
          });
        }
        if (url.includes('/test/')) {
          return Promise.reject(new Error('Test failed'));
        }
        return Promise.resolve({ data: {} });
      });
      
      render(<EyeTrackingAnalysis />);
      
      const beginButton = screen.getByText('Begin Analysis');
      await user.click(beginButton);
      
      await waitFor(() => {
        const startTestButton = screen.getByText('Start Ear Detection');
        fireEvent.click(startTestButton);
      });
      
      await waitFor(() => {
        expect(mockedToast.error).toHaveBeenCalledWith('ear-detection test failed', { duration: 3000 });
      });
    });
  });

  describe('Report Generation', () => {
    beforeEach(() => {
      window.localStorage.getItem.mockReturnValue('mock-token');
    });

    test('generates simple text report successfully', async () => {
      // Mock document methods
      const mockClick = jest.fn();
      const mockAppendChild = jest.fn();
      const mockRemoveChild = jest.fn();
      
      const mockElement = {
        href: '',
        download: '',
        style: { display: '' },
        click: mockClick
      };
      
      jest.spyOn(document, 'createElement').mockReturnValue(mockElement);
      jest.spyOn(document.body, 'appendChild').mockImplementation(mockAppendChild);
      jest.spyOn(document.body, 'removeChild').mockImplementation(mockRemoveChild);
      
      render(<EyeTrackingAnalysis />);
      
      // Simulate reaching results step
      const component = screen.getByTestId('eye-tracking-container') || screen.getByText('Eye Analysis').closest('div');
      
      // Use act to update component state to step 4
      act(() => {
        // Simulate having completed all tests
        fireEvent.click(screen.getByText('Begin Analysis'));
      });
      
      // Wait for results step and click simple report button
      await waitFor(() => {
        const simpleReportButton = screen.queryByText('📋 Simple Report');
        if (simpleReportButton) {
          fireEvent.click(simpleReportButton);
        }
      });
      
      // Should attempt to create download
      expect(global.Blob).toHaveBeenCalledWith(
        [expect.stringContaining('OPTISCAN EYE ANALYSIS REPORT')],
        { type: 'text/plain;charset=utf-8' }
      );
    });

    test('generates PDF report successfully', async () => {
      render(<EyeTrackingAnalysis />);
      
      // Simulate being at results step
      act(() => {
        fireEvent.click(screen.getByText('Begin Analysis'));
      });
      
      await waitFor(() => {
        const pdfButton = screen.queryByText('📄 PDF Report');
        if (pdfButton) {
          fireEvent.click(pdfButton);
        }
      });
      
      await waitFor(() => {
        expect(EyeTrackUtils.generateEyeTrackingPDF).toHaveBeenCalledWith(
          expect.objectContaining({
            sessionId: null,
            testResults: expect.any(Object),
            finalAnalysis: null
          }),
          expect.any(Function),
          expect.any(Function),
          expect.any(Function)
        );
      });
    });

    test('handles PDF generation failure', async () => {
      EyeTrackUtils.generateEyeTrackingPDF.mockImplementation(
        (reportData, onProgress, onSuccess, onError) => {
          setTimeout(() => onError('PDF generation failed'), 100);
          return Promise.reject(new Error('PDF failed'));
        }
      );
      
      render(<EyeTrackingAnalysis />);
      
      act(() => {
        fireEvent.click(screen.getByText('Begin Analysis'));
      });
      
      await waitFor(() => {
        const pdfButton = screen.queryByText('📄 PDF Report');
        if (pdfButton) {
          fireEvent.click(pdfButton);
        }
      });
      
      await waitFor(() => {
        expect(mockedToast.error).toHaveBeenCalled();
      });
    });
  });

  describe('Reset Functionality', () => {
    test('resets all test data when reset button clicked', async () => {
      window.localStorage.getItem.mockReturnValue('mock-token');
      
      render(<EyeTrackingAnalysis />);
      
      // Simulate being at results step
      act(() => {
        fireEvent.click(screen.getByText('Begin Analysis'));
      });
      
      await waitFor(() => {
        const resetButton = screen.queryByText('New Analysis');
        if (resetButton) {
          fireEvent.click(resetButton);
        }
      });
      
      await waitFor(() => {
        expect(mockedToast.success).toHaveBeenCalledWith('Ready for new analysis', { duration: 2000 });
        expect(screen.getByText('Begin Analysis')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    test('displays error banner when error occurs', () => {
      window.localStorage.getItem.mockReturnValue(null);
      
      render(<EyeTrackingAnalysis />);
      
      // Trigger authentication error
      const checkAuthButton = screen.getByText('Check Authentication');
      fireEvent.click(checkAuthButton);
      
      expect(screen.getByText(/Authentication required/)).toBeInTheDocument();
    });

    test('allows dismissing error banner', async () => {
      window.localStorage.getItem.mockReturnValue('mock-token');
      
      render(<EyeTrackingAnalysis />);
      
      // Manually trigger an error state
      act(() => {
        // This would normally be triggered by an error in the component
        const errorElement = screen.queryByText('×');
        if (errorElement) {
          fireEvent.click(errorElement);
        }
      });
    });
  });

  describe('Authentication Error Handling', () => {
    test('clears token on 401 error', async () => {
      window.localStorage.getItem.mockReturnValue('mock-token');
      mockAxiosInstance.post.mockRejectedValue({
        response: { status: 401 }
      });
      
      render(<EyeTrackingAnalysis />);
      
      const beginButton = screen.getByText('Begin Analysis');
      await user.click(beginButton);
      
      await waitFor(() => {
        expect(window.localStorage.removeItem).toHaveBeenCalledWith('token');
        expect(window.sessionStorage.removeItem).toHaveBeenCalledWith('token');
      });
    });
  });

  describe('Metrics Display', () => {
    test('shows live metrics after starting analysis', async () => {
      window.localStorage.getItem.mockReturnValue('mock-token');
      mockAxiosInstance.post.mockResolvedValue({
        data: { session_id: 'test-session-123', user_id: 'user-456' }
      });
      
      render(<EyeTrackingAnalysis />);
      
      const beginButton = screen.getByText('Begin Analysis');
      await user.click(beginButton);
      
      await waitFor(() => {
        expect(screen.getByText('Live Metrics')).toBeInTheDocument();
        expect(screen.getByText('Left Ear')).toBeInTheDocument();
        expect(screen.getByText('Right Ear')).toBeInTheDocument();
        expect(screen.getByText('Left Pupil')).toBeInTheDocument();
        expect(screen.getByText('Right Pupil')).toBeInTheDocument();
      });
    });
  });
});