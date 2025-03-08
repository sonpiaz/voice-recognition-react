import React from 'react';
import './App.css';
import VoiceRecognition from './components/VoiceRecognition';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Voice Recognition App</h1>
      </header>
      <main>
        <div className="container">
          <VoiceRecognition />
        </div>
      </main>
    </div>
  );
}

export default App;