import React, { useState, useEffect, useRef } from 'react';
import './VoiceRecognition.css';

const VoiceRecognition = () => {
  // States
  const [isListening, setIsListening] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [language, setLanguage] = useState('vi-VN'); // Mặc định tiếng Việt
  const [error, setError] = useState('');
  const [browserSupported, setBrowserSupported] = useState(true);
  const [status, setStatus] = useState('Sẵn sàng');

  // Refs
  const recognitionRef = useRef(null);
  
  // Kiểm tra trình duyệt có hỗ trợ Web Speech API không
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setBrowserSupported(false);
      setError('Trình duyệt của bạn không hỗ trợ Web Speech API. Vui lòng sử dụng Chrome, Edge hoặc Safari phiên bản mới nhất.');
    }
  }, []);

  // Khởi tạo và thiết lập recognition object
  useEffect(() => {
    if (browserSupported) {
      // Tạo đối tượng SpeechRecognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();

      // Cấu hình
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = language;

      // Xử lý sự kiện kết quả
      recognitionRef.current.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        setTranscript((prev) => {
          // Chỉ thêm finalTranscript nếu nó có giá trị
          if (finalTranscript) {
            return prev + finalTranscript;
          }
          // Ngược lại, trả về transcript hiện tại + interim
          return prev.replace(/🔄.*$/g, '') + (interimTranscript ? `🔄 ${interimTranscript}` : '');
        });
      };

      // Xử lý lỗi
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setError(`Lỗi: ${event.error}`);
        
        if (event.error === 'not-allowed') {
          setError('Vui lòng cấp quyền truy cập microphone cho trang web này');
        } else if (event.error === 'audio-capture') {
          setError('Không tìm thấy microphone. Vui lòng kiểm tra thiết bị của bạn');
        } else if (event.error === 'network') {
          setError('Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet của bạn');
        }

        stopListening();
      };

      // Xử lý khi recognition kết thúc
      recognitionRef.current.onend = () => {
        // Nếu đang nghe và không tạm dừng, khởi động lại
        if (isListening && !isPaused) {
          recognitionRef.current.start();
          setStatus('Đang nghe...');
        } else if (isPaused) {
          setStatus('Đã tạm dừng');
        } else {
          setStatus('Đã dừng');
        }
      };

      // Xử lý khi recognition bắt đầu
      recognitionRef.current.onstart = () => {
        setStatus('Đang nghe...');
      };

      // Cleanup khi component unmount
      return () => {
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
      };
    }
  }, [browserSupported, language, isListening, isPaused]);

  // Cập nhật ngôn ngữ khi thay đổi
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = language;
    }
  }, [language]);

  // Bắt đầu nghe
  const startListening = () => {
    setError('');
    setIsListening(true);
    setIsPaused(false);
    try {
      recognitionRef.current.start();
    } catch (error) {
      // Xử lý trường hợp đã start rồi
      console.log('Recognition already started', error);
    }
  };

  // Tạm dừng nghe
  const pauseListening = () => {
    if (isListening) {
      recognitionRef.current.stop();
      setIsPaused(true);
    }
  };

  // Dừng nghe
  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    setIsPaused(false);
  };

  // Xóa transcript
  const clearTranscript = () => {
    setTranscript('');
  };

  // Xử lý thay đổi ngôn ngữ
  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    
    // Nếu đang nghe, khởi động lại với ngôn ngữ mới
    if (isListening) {
      stopListening();
      setTimeout(startListening, 100);
    }
  };

  return (
    <div className={`voice-recognition ${isListening && !isPaused ? 'recording' : ''}`}>
      <h2>Nhận dạng giọng nói
        {isListening && <span className="recording-indicator"></span>}
      </h2>
      
      {/* Language selector */}
      <div className="language-selector">
        <label htmlFor="language-select">Chọn ngôn ngữ: </label>
        <select 
          id="language-select" 
          value={language}
          onChange={handleLanguageChange}
          disabled={isListening && !isPaused}
        >
          <option value="vi-VN">Tiếng Việt</option>
          <option value="en-US">English (US)</option>
          <option value="en-GB">English (UK)</option>
        </select>
      </div>

      {/* Control buttons */}
      <div className="controls">
        <button 
          className="start-btn" 
          onClick={startListening} 
          disabled={isListening && !isPaused || !browserSupported}
        >
          {isPaused ? 'Tiếp tục' : 'Bắt đầu'}
        </button>
        <button 
          className="pause-btn" 
          onClick={pauseListening} 
          disabled={!isListening || isPaused || !browserSupported}
        >
          Tạm dừng
        </button>
        <button 
          className="stop-btn" 
          onClick={stopListening} 
          disabled={!isListening && !isPaused || !browserSupported}
        >
          Dừng
        </button>
        <button 
          onClick={clearTranscript}
          disabled={!transcript}
        >
          Xóa
        </button>
      </div>

      {/* Status & error display */}
      <div className="status-text">
        Trạng thái: {status}
      </div>
      {error && <div className="error-message">{error}</div>}
      
      {/* Unsupported browser message */}
      {!browserSupported && (
        <div className="error-message">
          <p>Trình duyệt của bạn không hỗ trợ Web Speech API.</p>
          <p>Vui lòng sử dụng Google Chrome, Microsoft Edge hoặc Safari phiên bản mới nhất.</p>
        </div>
      )}

      {/* Transcript display */}
      <div className="transcript-container">
        <h3>Văn bản nhận dạng:</h3>
        <div className="transcript">{transcript || 'Chưa có văn bản...'}</div>
      </div>

      {/* Instructions */}
      <div className="instructions">
        <h3>Hướng dẫn:</h3>
        <ul>
          <li>Nhấn <strong>Bắt đầu</strong> để bắt đầu nhận dạng giọng nói</li>
          <li>Nhấn <strong>Tạm dừng</strong> để tạm dừng nhận dạng</li>
          <li>Nhấn <strong>Dừng</strong> để kết thúc phi��n nhận dạng</li>
          <li>Nhấn <strong>Xóa</strong> để xóa văn bản đã nhận dạng</li>
          <li>Chọn ngôn ngữ phù hợp từ danh sách để cải thiện độ chính xác</li>
        </ul>
      </div>
    </div>
  );
};

export default VoiceRecognition;