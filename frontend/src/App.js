import React, { useState, useEffect } from 'react';
import './App.css';
import io from 'socket.io-client';

const QUESTION_DURATION = 20;
const socket = io('http://localhost:3001');

function App() {
  const [gameState, setGameState] = useState('menu');
  const [playerName, setPlayerName] = useState('');
  const [gameCode, setGameCode] = useState('');
  const [players, setPlayers] = useState([]);
  const [question, setQuestion] = useState(null);
  const [message, setMessage] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [timeLeft, setTimeLeft] = useState(QUESTION_DURATION);
  const [timer, setTimer] = useState(null);
  const [questionStartTime, setQuestionStartTime] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [questionCount, setQuestionCount] = useState(0);
  const MAX_QUESTIONS = 10;

  useEffect(() => {
    console.log("État actuel du gameCode:", gameCode);

    socket.on("connect", () => {
      console.log("Socket connecté avec succès");
    });

    socket.on("gameCreated", ({ gameCode, players }) => {
      console.log("Game created avec code:", gameCode);
      setGameCode(gameCode);
      setPlayers(players);
      setGameState('lobby');
      setIsHost(true);
    });

    socket.on("playerJoined", ({ players }) => {
      console.log("Joueurs mis à jour:", players);
      setPlayers(players);
    });

    socket.on("question", (questionData) => {
      console.log("Nouvelle question reçue");
      setQuestionCount(prev => prev + 1);
      setQuestion(questionData);
      setMessage('');
      setGameState('game');
      setQuestionStartTime(Date.now());
      setSelectedAnswer(null);
      
      if (timer) {
        clearInterval(timer);
        setTimer(null);
      }

      setTimeLeft(QUESTION_DURATION);
      
      const newTimer = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(newTimer);
            socket.emit("checkAnswer", {
              gameCode,
              questionId: questionData.id,
              reponseChoisie: 0,
              responseTime: QUESTION_DURATION
            });
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);

      setTimer(newTimer);
    });

    socket.on("answerResult", ({ playerName, correct, message, players }) => {
      setMessage(`${playerName}: ${message}`);
      setPlayers(players);
      
      if (questionCount >= MAX_QUESTIONS) {
        setGameState('gameOver');
        if (timer) {
          clearInterval(timer);
          setTimer(null);
        }
      }
    });

    return () => {
      socket.off("connect");
      socket.off("gameCreated");
      socket.off("playerJoined");
      socket.off("question");
      socket.off("answerResult");
      if (timer) {
        clearInterval(timer);
        setTimer(null);
      }
    };
  }, [gameCode]);

  const createGame = () => {
    if (playerName) {
      socket.emit("createGame", playerName);
    }
  };

  const joinGame = () => {
    if (playerName && gameCode) {
      socket.emit("joinGame", { gameCode, playerName });
    }
  };

  const startGame = () => {
    socket.emit("startGame", gameCode);
  };

  const checkAnswer = (reponseChoisie) => {

    if (timer) {
      clearInterval(timer);
      setTimer(null);
    }
    
    setSelectedAnswer(reponseChoisie);
    const responseTime = (Date.now() - questionStartTime) / 1000;
    socket.emit("checkAnswer", {
      gameCode,
      questionId: question.id,
      reponseChoisie,
      responseTime
    });
  };

  const getAnswerClassName = (index) => {
    const isSelected = selectedAnswer === index;
    const isCorrect = isSelected && question.bonne_reponse === index;
    
    let className = 'answer-button';
    if (isSelected) {
      className += isCorrect ? ' correct' : ' incorrect';
    }
    return className;
  };

  // Menu principal
  if (gameState === 'menu') {
    return (
      <div className="App">
        <div className="menu-container">
          <h1>Quiz Histoire</h1>
          <input
            type="text"
            placeholder="Votre nom"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
          />
          <div className="menu-buttons">
            <button onClick={createGame}>Créer une partie</button>
            <div className="join-game">
              <input
                type="text"
                placeholder="Code de la partie"
                value={gameCode}
                onChange={(e) => setGameCode(e.target.value.toUpperCase())}
              />
              <button onClick={joinGame}>Rejoindre</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Lobby d'attente
  if (gameState === 'lobby') {
    return (
      <div className="App">
        <div className="waiting-room">
          <h2>Salle d'attente</h2>
          <p>Code de la partie: {gameCode}</p>
          <h3>Joueurs:</h3>
          <ul>
            {players.map((player) => (
              <li key={player.id}>{player.name} - {player.score || 0} points</li>
            ))}
          </ul>
          {isHost && <button onClick={startGame}>Démarrer la partie</button>}
        </div>
      </div>
    );
  }

  // Jeu
  if (gameState === 'gameOver') {
    return (
      <div className="App">
        <div className="game-over-container">
          <h1>Fin de la partie !</h1>
          <div className="final-scores">
            <h2>Scores finaux</h2>
            {players
              .sort((a, b) => (b.score || 0) - (a.score || 0))
              .map((player, index) => (
                <div key={player.id} className={`player-score ${index === 0 ? 'winner' : ''}`}>
                  <span className="rank">{index + 1}</span>
                  <span className="player-name">{player.name}</span>
                  <span className="player-points">{player.score || 0} points</span>
                </div>
              ))}
          </div>
          <button 
            className="new-game-button"
            onClick={() => {
              setGameState('menu');
              setQuestionCount(0);
              setPlayers([]);
              setQuestion(null);
              setMessage('');
            }}
          >
            Nouvelle Partie
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <div className="game-container">
        <h1>Quiz Histoire</h1>
        <div className="game-info">
          <p>Temps restant: {timeLeft}s</p>
          <div className="players-list">
            {players.map((player) => (
              <p key={player.id}>
                {player.name}: {player.score || 0} points
                {player.hasAnswered ? " ✓" : ""}
              </p>
            ))}
          </div>
        </div>
        
        {question && (
          <div className="question-container">
            <h2 className="question-title">{question.question}</h2>
            <div className="answers-grid">
              {[1, 2, 3, 4].map((index) => (
                <button
                  key={index}
                  onClick={() => checkAnswer(index)}
                  className={getAnswerClassName(index)}
                  disabled={timeLeft === 0 || selectedAnswer !== null}
                >
                  {question[`reponse${index}`]}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {message && <p className="message">{message}</p>}
      </div>
    </div>
  );
}

export default App;
