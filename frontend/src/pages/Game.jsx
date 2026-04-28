import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useGameStore from '../stores/gameStore';
import { Button } from '../components/Button';
import { MoveButton } from '../components/MoveButton';
import { Hand, Circle, Scissors } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function Game() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedMove, setSelectedMove] = useState(null);
  const [waitingForOpponent, setWaitingForOpponent] = useState(false);
  const [roundResult, setRoundResult] = useState(null);
  const [roundCountdown, setRoundCountdown] = useState(null);
  const [moveTimer, setMoveTimer] = useState(null);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef(null);
  const moveTimerRef = useRef(null);
  const forfeitHandledRef = useRef(false);

  const {
    ws,
    isHost,
    opponent,
    opponentStats,
    opponentLastMoves,
    myScore,
    opponentScore,
    chatMessages,
    gameStatus,
    incrementMove,
    resolveRound,
    endGame,
    addChatMessage,
    resetGame,
    getSessionStats,
    getMyMovesThisGame,
    startNewGame,
    setOpponentStats,
    setOpponentLastMoves,
    setIsHost,
  } = useGameStore();

  useEffect(() => {
    if (!ws) {
      navigate('/lobby');
      return;
    }

    const handleMessage = async (event) => {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case 'GAME_STARTING':
          startNewGame();
          setIsHost(message.isHost);
          setOpponentStats(message.opponent.stats);
          setOpponentLastMoves(message.opponent.lastMoves || []);
          setWaitingForOpponent(false);
          setSelectedMove(null);
          setRoundResult(null);
          break;
        case 'MOVE_ACCEPTED':
          setWaitingForOpponent(true);
          break;
        case 'OPPONENT_MOVED':
          break;
        case 'ROUND_RESULT':
          setWaitingForOpponent(false);
          setSelectedMove(null);
          if (moveTimerRef.current) {
            clearInterval(moveTimerRef.current);
            moveTimerRef.current = null;
          }
          setMoveTimer(null);
          setRoundResult({
            myMove: message.myMove,
            opponentMove: message.opponentMove,
            result: message.result,
          });
          resolveRound(message.myMove, message.opponentMove, message.result);
          setRoundCountdown(5);
          break;
        case 'GAME_OVER':
          if (moveTimerRef.current) {
            clearInterval(moveTimerRef.current);
            moveTimerRef.current = null;
          }
          setMoveTimer(null);
          endGame(message.result);
          batchUpdateStats();
          break;
        case 'ROUND_TIMER_START':
          setMoveTimer(message.seconds);
          if (moveTimerRef.current) {
            clearInterval(moveTimerRef.current);
          }
          moveTimerRef.current = setInterval(() => {
            setMoveTimer((prev) => {
              if (prev <= 1) {
                clearInterval(moveTimerRef.current);
                moveTimerRef.current = null;
                return null;
              }
              return prev - 1;
            });
          }, 1000);
          break;
        case 'CHAT_MESSAGE':
          addChatMessage({
            senderId: message.senderId,
            senderUsername: message.senderUsername,
            message: message.message,
            timestamp: message.timestamp,
          });
          break;
        case 'OPPONENT_FORFEIT':
          if (forfeitHandledRef.current) break;
          forfeitHandledRef.current = true;
          if (moveTimerRef.current) {
            clearInterval(moveTimerRef.current);
            moveTimerRef.current = null;
          }
          await updateForfeitStats('win');
          alert(message.message);
          resetGame();
          navigate('/lobby');
          break;
        case 'GAME_FORFEIT':
          if (forfeitHandledRef.current) break;
          forfeitHandledRef.current = true;
          if (moveTimerRef.current) {
            clearInterval(moveTimerRef.current);
            moveTimerRef.current = null;
          }
          await updateForfeitStats('lose');
          resetGame();
          navigate('/lobby');
          break;
        case 'LOBBY_CLOSED':
          if (forfeitHandledRef.current) break;
          resetGame();
          navigate('/lobby');
          break;
        case 'ERROR':
          console.error('Game error:', message.message);
          break;
      }
    };

    ws.addEventListener('message', handleMessage);

    return () => {
      ws.removeEventListener('message', handleMessage);
    };
  }, [ws, navigate, resolveRound, endGame, addChatMessage, startNewGame, setOpponentStats, setOpponentLastMoves, setIsHost]);


  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    if (roundCountdown === null) return;
    
    if (roundCountdown <= 0) {
      setRoundResult(null);
      setRoundCountdown(null);
      return;
    }
    
    const timer = setTimeout(() => {
      setRoundCountdown(roundCountdown - 1);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [roundCountdown]);

  const updateForfeitStats = async (result) => {
    const token = localStorage.getItem('token');
    const stats = {
      totalGames: 1,
      wins: result === 'win' ? 1 : 0,
      losses: result === 'lose' ? 1 : 0,
      draws: 0,
      rockThrows: 0,
      paperThrows: 0,
      scissorsThrows: 0,
    };
    const newMoves = getMyMovesThisGame();
    try {
      await fetch(`${API_URL}/api/users/me/stats`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ stats, newMoves }),
      });
    } catch (error) {
      console.error('Failed to update forfeit stats:', error);
    }
  };

  const batchUpdateStats = async () => {
    const stats = getSessionStats();
    const newMoves = getMyMovesThisGame();
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/api/users/me/stats`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ stats, newMoves }),
      });
      await response.json();
    } catch (error) {
      console.error('Failed to update stats:', error);
    }
  };

  const handleMove = (move) => {
    if (!ws || waitingForOpponent || gameStatus !== 'playing') return;
    setSelectedMove(move);
    incrementMove(move);
    ws.send(JSON.stringify({ type: 'SUBMIT_MOVE', move }));
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!ws || !chatInput.trim()) return;
    ws.send(JSON.stringify({ type: 'CHAT_MESSAGE', message: chatInput.trim() }));
    setChatInput('');
  };

  const handlePlayAgain = () => {
    if (ws) {
      ws.close();
    }
    resetGame();
    navigate('/lobby');
  };

  const handleLeaveGame = () => {
    if (ws && gameStatus === 'playing') {
      ws.send(JSON.stringify({ type: 'LEAVE_GAME' }));
    }
  };

  const calculatePercentage = (throws, total) => {
    if (total === 0) return 0;
    return Math.round((throws / total) * 100);
  };

  const totalThrows = opponentStats
    ? opponentStats.rockThrows + opponentStats.paperThrows + opponentStats.scissorsThrows
    : 0;

  const getMoveIcon = (move) => {
    const iconProps = { size: 48, strokeWidth: 2 };
    switch (move) {
      case 'rock': return <Circle {...iconProps} fill="currentColor" />;
      case 'paper': return <Hand {...iconProps} />;
      case 'scissors': return <Scissors {...iconProps} />;
      default: return '❓';
    }
  };

  const handlePlayAgainRequest = () => {
    if (ws) {
      ws.send(JSON.stringify({ type: 'PLAY_AGAIN' }));
    }
  };

  if (gameStatus === 'finished') {
    const finalResult = myScore > opponentScore ? 'You Win!' : 'You Lose!';
    return (
      <div style={styles.container}>
        <div style={styles.gameOverContainer}>
          <h1 style={styles.gameOverTitle}>{finalResult}</h1>
          <p style={styles.finalScore}>
            Final Score: {myScore} - {opponentScore}
          </p>
          <div style={styles.gameOverButtons}>
            <Button 
              onClick={handlePlayAgainRequest} 
              disabled={!isHost}
              variant="success"
              fullWidth={false}
              style={{ padding: '1rem 2rem', fontSize: '1.2rem' }}
            >
              Play Again
            </Button>
            <Button 
              onClick={handlePlayAgain} 
              variant="secondary"
              fullWidth={false}
              style={{ padding: '1rem 2rem', fontSize: '1.2rem' }}
            >
              Back to Lobby
            </Button>
          </div>
          {!isHost && <p style={styles.playAgainHint}>Waiting for host to start a new game...</p>}
        </div>
      </div>
    );
  }

  if (!opponent) {
    return (
      <div style={styles.container}>
        <p style={styles.waitingText}>Waiting for game to start...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.gameLayout}>
        {/* Left Column: Opponent Data Card + Leave Game */}
        <div style={styles.leftColumn}>
          <div style={styles.dataCard}>
            <div style={styles.opponentHeader}>
              <span style={styles.opponentHeaderIcon}>👤</span>
              <span style={styles.opponentHeaderText}>OPPONENT INTEL</span>
            </div>
            <div style={styles.opponentNameBox}>
              <span style={styles.opponentName}>{opponent.username}</span>
            </div>
          
          <div style={styles.statsSection}>
            <h3 style={styles.sectionTitle}>Lifetime Throw %</h3>
            {opponentStats && totalThrows > 0 ? (
              <div style={styles.percentages}>
                <div style={styles.percentageItem}>
                  <span style={styles.moveLabel}><Circle size={16} strokeWidth={2} fill="currentColor" style={{marginRight: '0.5rem'}} /> Rock</span>
                  <div style={styles.percentageBar}>
                    <div
                      style={{
                        ...styles.percentageFill,
                        width: `${calculatePercentage(opponentStats.rockThrows, totalThrows)}%`,
                        backgroundColor: '#e74c3c',
                      }}
                    />
                  </div>
                  <span style={styles.percentageText}>
                    {calculatePercentage(opponentStats.rockThrows, totalThrows)}%
                  </span>
                </div>
                <div style={styles.percentageItem}>
                  <span style={styles.moveLabel}><Hand size={16} strokeWidth={2} style={{marginRight: '0.5rem'}} /> Paper</span>
                  <div style={styles.percentageBar}>
                    <div
                      style={{
                        ...styles.percentageFill,
                        width: `${calculatePercentage(opponentStats.paperThrows, totalThrows)}%`,
                        backgroundColor: '#3498db',
                      }}
                    />
                  </div>
                  <span style={styles.percentageText}>
                    {calculatePercentage(opponentStats.paperThrows, totalThrows)}%
                  </span>
                </div>
                <div style={styles.percentageItem}>
                  <span style={styles.moveLabel}><Scissors size={16} strokeWidth={2} style={{marginRight: '0.5rem'}} /> Scissors</span>
                  <div style={styles.percentageBar}>
                    <div
                      style={{
                        ...styles.percentageFill,
                        width: `${calculatePercentage(opponentStats.scissorsThrows, totalThrows)}%`,
                        backgroundColor: '#2ecc71',
                      }}
                    />
                  </div>
                  <span style={styles.percentageText}>
                    {calculatePercentage(opponentStats.scissorsThrows, totalThrows)}%
                  </span>
                </div>
              </div>
            ) : (
              <p style={styles.noData}>No data available</p>
            )}
          </div>

          <div style={styles.statsSection}>
            <h3 style={styles.sectionTitle}>Win/Loss Record</h3>
            {opponentStats ? (
              <div style={styles.winLossRecord}>
                <div style={styles.recordItem}>
                  <span style={styles.recordLabel}>Wins</span>
                  <span style={styles.recordValueWin}>{opponentStats.wins || 0}</span>
                </div>
                <div style={styles.recordItem}>
                  <span style={styles.recordLabel}>Losses</span>
                  <span style={styles.recordValueLoss}>{opponentStats.losses || 0}</span>
                </div>
                <div style={styles.recordItem}>
                  <span style={styles.recordLabel}>Games</span>
                  <span style={styles.recordValue}>{opponentStats.totalGames || 0}</span>
                </div>
              </div>
            ) : (
              <p style={styles.noData}>No data available</p>
            )}
          </div>

          </div>

          <div style={styles.leaveGameBox}>
            <Button 
              onClick={handleLeaveGame} 
              variant="danger"
            >
              Leave Game (Forfeit)
            </Button>
          </div>
        </div>

        {/* Center: Game Area + Last 7 Moves */}
        <div style={styles.centerColumn}>
          <div style={styles.gameArea}>
            <div style={styles.scoreBoard}>
              <span style={styles.score}>You: {myScore}</span>
              <span style={styles.scoreDivider}>-</span>
              <span style={styles.score}>{opponent.username}: {opponentScore}</span>
            </div>

            {roundResult && (
              <div style={styles.roundResult}>
                <p style={styles.resultText}>
                  {roundResult.result === 'win' && '🎉 You won this round!'}
                  {roundResult.result === 'lose' && '😢 You lost this round!'}
                  {roundResult.result === 'draw' && '🤝 Draw!'}
                </p>
                <p style={styles.movesText}>
                  You: {getMoveIcon(roundResult.myMove)} vs {getMoveIcon(roundResult.opponentMove)} :Opponent
                </p>
                {roundCountdown !== null && (
                  <p style={styles.countdownText}>Next round in {roundCountdown}...</p>
                )}
              </div>
            )}

            {!roundResult && (
              <>
                {moveTimer !== null && (
                  <p style={{
                    ...styles.moveTimerText,
                    color: moveTimer <= 10 ? '#e74c3c' : '#4a90e2',
                  }}>
                    Time remaining: {moveTimer}s
                  </p>
                )}
                <p style={styles.instruction}>
                  {waitingForOpponent ? 'Waiting for opponent...' : 'Choose your move!'}
                </p>
                <div style={styles.moves}>
                  {['rock', 'paper', 'scissors'].map((move) => (
                    <MoveButton
                      key={move}
                      move={move}
                      onClick={() => handleMove(move)}
                      disabled={waitingForOpponent}
                      selected={selectedMove === move}
                      emoji={getMoveIcon(move)}
                    />
                  ))}
                </div>
              </>
            )}

            <p style={styles.winCondition}>First to 3 wins!</p>
          </div>

          {/* Last 7 Moves Section */}
          <div style={styles.lastMovesSection}>
            <h3 style={styles.lastMovesTitle}>Opponent's Last 7 Moves</h3>
            <div style={styles.lastMovesRow}>
              {opponentLastMoves.length > 0 ? (
                opponentLastMoves.map((move, index) => (
                  <div key={index} style={styles.moveWithNumber}>
                    <span style={styles.moveNumber}>{index + 1}</span>
                    <span style={{
                      ...styles.moveIconLarge,
                      ...(index === opponentLastMoves.length - 1 ? styles.latestMove : {})
                    }} title={move}>
                      {getMoveIcon(move)}
                    </span>
                  </div>
                ))
              ) : (
                <p style={styles.noMovesYet}>No moves yet - play a round!</p>
              )}
              {opponentLastMoves.length > 0 && (
                <span style={styles.moveOrderHintInline}>← oldest | newest →</span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Chat Window */}
        <div style={styles.chatContainer}>
          <h3 style={styles.chatTitle}>Chat</h3>
          <div style={styles.chatMessages}>
            {chatMessages.map((msg, index) => (
              <div
                key={index}
                style={{
                  ...styles.chatMessage,
                  ...(msg.senderId === user?.id ? styles.myMessage : styles.theirMessage),
                }}
              >
                <span style={styles.chatSender}>{msg.senderUsername}:</span>
                <span style={styles.chatText}>{msg.message}</span>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <form onSubmit={handleSendChat} style={styles.chatForm}>
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Type a message..."
              style={styles.chatInput}
              maxLength={500}
            />
            <Button 
              type="submit" 
              variant="primary"
              fullWidth={false}
              style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
            >
              Send
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minHeight: 'calc(100vh - 73px)',
    padding: '1rem',
    backgroundColor: '#0a0a0a',
    color: '#fff',
  },
  gameLayout: {
    display: 'flex',
    gap: '1.5rem',
    width: '100%',
  },
  leftColumn: {
    flex: '0 0 280px',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    height: 'calc(100vh - 120px)',
  },
  dataCard: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#1a1a1a',
    borderRadius: '12px',
    padding: '1.5rem',
    border: '2px solid #e74c3c',
    boxShadow: '0 0 20px rgba(231, 76, 60, 0.15)',
    overflow: 'auto',
  },
  leaveGameBox: {
    backgroundColor: '#1a1a1a',
    borderRadius: '12px',
    padding: '1rem',
    border: '1px solid #333',
  },
  opponentHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '0.75rem',
    marginBottom: '1rem',
    backgroundColor: '#e74c3c',
    borderRadius: '8px',
    color: '#fff',
  },
  opponentHeaderIcon: {
    fontSize: '1.2rem',
  },
  opponentHeaderText: {
    fontSize: '0.85rem',
    fontWeight: 'bold',
    letterSpacing: '0.15rem',
  },
  opponentNameBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '1rem',
    marginBottom: '1.5rem',
    backgroundColor: '#2a2a2a',
    borderRadius: '8px',
    border: '1px solid #444',
  },
  opponentName: {
    fontSize: '1.4rem',
    fontWeight: 'bold',
    color: '#fff',
  },
  centerColumn: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  statsSection: {
    marginBottom: '1.5rem',
  },
  sectionTitle: {
    fontSize: '1rem',
    color: '#888',
    marginBottom: '0.75rem',
    borderBottom: '1px solid #333',
    paddingBottom: '0.5rem',
  },
  winLossRecord: {
    display: 'flex',
    justifyContent: 'space-around',
    gap: '0.5rem',
  },
  recordItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.25rem',
  },
  recordLabel: {
    fontSize: '0.8rem',
    color: '#888',
  },
  recordValue: {
    fontSize: '1.2rem',
    fontWeight: 'bold',
    color: '#fff',
  },
  recordValueWin: {
    fontSize: '1.2rem',
    fontWeight: 'bold',
    color: '#28a745',
  },
  recordValueLoss: {
    fontSize: '1.2rem',
    fontWeight: 'bold',
    color: '#dc3545',
  },
  percentages: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  percentageItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  moveLabel: {
    width: '80px',
    fontSize: '0.9rem',
  },
  percentageBar: {
    flex: 1,
    height: '12px',
    backgroundColor: '#2a2a2a',
    borderRadius: '6px',
    overflow: 'hidden',
  },
  percentageFill: {
    height: '100%',
    borderRadius: '6px',
    transition: 'width 0.3s ease',
  },
  percentageText: {
    width: '40px',
    textAlign: 'right',
    fontSize: '0.9rem',
    color: '#aaa',
  },
  lastMoves: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },
  moveIcon: {
    fontSize: '1.5rem',
    padding: '0.25rem',
    backgroundColor: '#2a2a2a',
    borderRadius: '4px',
  },
  moveWithNumber: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.2rem',
  },
  moveNumber: {
    fontSize: '0.7rem',
    color: '#666',
  },
  moveOrderHint: {
    fontSize: '0.75rem',
    color: '#555',
    marginBottom: '0.5rem',
    fontStyle: 'italic',
  },
  latestMove: {
    border: '2px solid #4a90e2',
    boxShadow: '0 0 8px rgba(74, 144, 226, 0.5)',
  },
  noData: {
    color: '#666',
    fontStyle: 'italic',
    fontSize: '0.9rem',
  },
  gameArea: {
    flex: 4,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: '12px',
    padding: '2rem',
    border: '1px solid #333',
  },
  lastMovesSection: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: '12px',
    padding: '1rem',
    border: '1px solid #333',
  },
  lastMovesTitle: {
    fontSize: '1rem',
    color: '#888',
    marginBottom: '0.75rem',
  },
  lastMovesRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
  },
  moveIconLarge: {
    fontSize: '2rem',
    padding: '0.5rem',
    backgroundColor: '#2a2a2a',
    borderRadius: '8px',
  },
  noMovesYet: {
    color: '#555',
    fontStyle: 'italic',
  },
  moveOrderHintInline: {
    fontSize: '0.8rem',
    color: '#555',
    fontStyle: 'italic',
    marginLeft: '1rem',
  },
  scoreBoard: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '2rem',
    fontSize: '1.5rem',
    fontWeight: 'bold',
  },
  score: {
    color: '#fff',
  },
  scoreDivider: {
    color: '#666',
  },
  roundResult: {
    textAlign: 'center',
    padding: '2rem',
  },
  resultText: {
    fontSize: '1.5rem',
    marginBottom: '1rem',
  },
  movesText: {
    fontSize: '1.2rem',
    color: '#aaa',
  },
  countdownText: {
    fontSize: '1.5rem',
    color: '#4a90e2',
    marginTop: '1rem',
    fontWeight: 'bold',
  },
  moveTimerText: {
    fontSize: '1.3rem',
    fontWeight: 'bold',
    marginBottom: '0.5rem',
  },
  instruction: {
    fontSize: '1.2rem',
    color: '#aaa',
    marginBottom: '1.5rem',
  },
  moves: {
    display: 'flex',
    gap: '1.5rem',
    marginBottom: '2rem',
  },
  winCondition: {
    color: '#666',
    fontSize: '0.9rem',
  },
  chatContainer: {
    flex: '0 0 300px',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#1a1a1a',
    borderRadius: '12px',
    border: '1px solid #333',
    overflow: 'hidden',
  },
  chatTitle: {
    padding: '1rem',
    margin: 0,
    borderBottom: '1px solid #333',
    fontSize: '1rem',
    color: '#888',
  },
  chatMessages: {
    flex: 1,
    padding: '1rem',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  chatMessage: {
    padding: '0.5rem 0.75rem',
    borderRadius: '8px',
    maxWidth: '85%',
    wordBreak: 'break-word',
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#4a90e2',
  },
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#2a2a2a',
  },
  chatSender: {
    fontWeight: 'bold',
    marginRight: '0.5rem',
    fontSize: '0.85rem',
  },
  chatText: {
    fontSize: '0.9rem',
  },
  chatForm: {
    display: 'flex',
    padding: '0.75rem',
    borderTop: '1px solid #333',
    gap: '0.5rem',
  },
  chatInput: {
    flex: 1,
    padding: '0.5rem 0.75rem',
    backgroundColor: '#2a2a2a',
    border: '1px solid #444',
    borderRadius: '4px',
    color: '#fff',
    fontSize: '0.9rem',
  },
  waitingText: {
    fontSize: '1.2rem',
    color: '#aaa',
  },
  gameOverContainer: {
    textAlign: 'center',
    padding: '3rem',
  },
  gameOverTitle: {
    fontSize: '3rem',
    marginBottom: '1rem',
  },
  finalScore: {
    fontSize: '1.5rem',
    color: '#aaa',
    marginBottom: '2rem',
  },
  gameOverButtons: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
    marginBottom: '1rem',
  },
  playAgainHint: {
    fontSize: '0.85rem',
    color: '#666',
    fontStyle: 'italic',
  },
};
