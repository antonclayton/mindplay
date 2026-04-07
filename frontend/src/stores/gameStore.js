import { create } from 'zustand';

const useGameStore = create((set, get) => ({
  // WebSocket reference
  ws: null,
  
  // Game state
  gameId: null,
  isHost: false,
  opponent: null,
  opponentStats: null,
  opponentLastMoves: [],
  
  // Round state
  currentRound: 0,
  myMove: null,
  opponentMove: null,
  roundResult: null,
  
  // Score
  myScore: 0,
  opponentScore: 0,
  
  // Session stats (for batch update at end)
  sessionStats: {
    totalGames: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    rockThrows: 0,
    paperThrows: 0,
    scissorsThrows: 0,
  },
  
  // My moves this game (for persisting to DB)
  myMovesThisGame: [],
  
  // Chat
  chatMessages: [],
  
  // Game status
  gameStatus: 'waiting', // waiting, playing, finished
  
  // Actions
  setWs: (ws) => set({ ws }),
  
  setGameId: (gameId) => set({ gameId }),
  
  setIsHost: (isHost) => set({ isHost }),
  
  setOpponent: (opponent) => set({ opponent }),
  
  setOpponentStats: (stats) => set({ opponentStats: stats }),
  
  setMyMove: (move) => set({ myMove: move }),
  
  incrementMove: (move) => set((state) => {
    const moveKey = `${move}Throws`;
    return {
      sessionStats: {
        ...state.sessionStats,
        [moveKey]: state.sessionStats[moveKey] + 1,
      },
      myMovesThisGame: [...state.myMovesThisGame, move],
    };
  }),
  
  setOpponentLastMoves: (moves) => set({ opponentLastMoves: moves }),
  
  getMyMovesThisGame: () => get().myMovesThisGame,
  
  resolveRound: (myMove, opponentMove, result) => set((state) => {
    const newState = {
      myMove: null,
      opponentMove: null,
      roundResult: result,
      currentRound: state.currentRound + 1,
      opponentLastMoves: [...state.opponentLastMoves.slice(-6), opponentMove],
    };
    
    if (result === 'win') {
      newState.myScore = state.myScore + 1;
    } else if (result === 'lose') {
      newState.opponentScore = state.opponentScore + 1;
    }
    
    return newState;
  }),
  
  endGame: (result) => set((state) => ({
    gameStatus: 'finished',
    sessionStats: {
      ...state.sessionStats,
      totalGames: state.sessionStats.totalGames + 1,
      wins: state.sessionStats.wins + (result === 'win' ? 1 : 0),
      losses: state.sessionStats.losses + (result === 'lose' ? 1 : 0),
      draws: state.sessionStats.draws + (result === 'draw' ? 1 : 0),
    },
  })),
  
  addChatMessage: (message) => set((state) => ({
    chatMessages: [...state.chatMessages, message],
  })),
  
  setGameStatus: (status) => set({ gameStatus: status }),
  
  startNewGame: () => set({
    currentRound: 0,
    myMove: null,
    opponentMove: null,
    roundResult: null,
    myScore: 0,
    opponentScore: 0,
    opponentLastMoves: [],
    myMovesThisGame: [],
    chatMessages: [],
    gameStatus: 'playing',
    sessionStats: {
      totalGames: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      rockThrows: 0,
      paperThrows: 0,
      scissorsThrows: 0,
    },
  }),
  
  resetGame: () => set({
    gameId: null,
    isHost: false,
    opponent: null,
    opponentStats: null,
    opponentLastMoves: [],
    myMovesThisGame: [],
    currentRound: 0,
    myMove: null,
    opponentMove: null,
    roundResult: null,
    myScore: 0,
    opponentScore: 0,
    chatMessages: [],
    gameStatus: 'waiting',
  }),
  
  resetSessionStats: () => set({
    sessionStats: {
      totalGames: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      rockThrows: 0,
      paperThrows: 0,
      scissorsThrows: 0,
    },
  }),
  
  getSessionStats: () => get().sessionStats,
}));

export default useGameStore;
