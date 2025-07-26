
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Crown, Swords, Shield, Repeat } from 'lucide-react';

const PIECES = {
  wP: '♙', wR: '♖', wN: '♘', wB: '♗', wQ: '♕', wK: '♔',
  bP: '♟', bR: '♜', bN: '♞', bB: '♝', bQ: '♛', bK: '♚',
};

const PieceIcon = ({ piece }) => {
  const isWhite = piece === piece.toUpperCase();
  return (
    <span className={`text-4xl md:text-5xl ${isWhite ? 'text-slate-100' : 'text-slate-800'}`}>
      {PIECES[piece]}
    </span>
  );
};

const initialBoard = [
  ['bR', 'bN', 'bB', 'bQ', 'bK', 'bB', 'bN', 'bR'],
  ['bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP'],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  ['wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP'],
  ['wR', 'wN', 'wB', 'wQ', 'wK', 'wB', 'wN', 'wR'],
];

const ChessGame = () => {
  const [board, setBoard] = useState(JSON.parse(JSON.stringify(initialBoard)));
  const [turn, setTurn] = useState('w');
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [gameState, setGameState] = useState('playing'); // playing, check, checkmate, stalemate
  const [lastMove, setLastMove] = useState(null);
  const [captured, setCaptured] = useState({ w: [], b: [] });
  const [kingInCheck, setKingInCheck] = useState(null);

  const getKingPosition = useCallback((color, currentBoard) => {
    const king = color + 'K';
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (currentBoard[r][c] === king) {
          return { row: r, col: c };
        }
      }
    }
    return null;
  }, []);

  const isSquareAttacked = useCallback((row, col, attackerColor, currentBoard) => {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = currentBoard[r][c];
        if (piece && piece.charAt(0) === attackerColor) {
          const moves = getPieceMoves(piece, r, c, currentBoard, true);
          if (moves.some(move => move.row === row && move.col === col)) {
            return true;
          }
        }
      }
    }
    return false;
  }, []);

  const isKingInCheck = useCallback((kingColor, currentBoard) => {
    const kingPos = getKingPosition(kingColor, currentBoard);
    if (!kingPos) return false;
    const opponentColor = kingColor === 'w' ? 'b' : 'w';
    return isSquareAttacked(kingPos.row, kingPos.col, opponentColor, currentBoard);
  }, [getKingPosition, isSquareAttacked]);

  const getPieceMoves = useCallback((piece, row, col, currentBoard, isForAttackCheck = false) => {
    const moves = [];
    const color = piece.charAt(0);
    const type = piece.charAt(1);
    const opponentColor = color === 'w' ? 'b' : 'w';

    const addMove = (r, c) => {
      if (r >= 0 && r < 8 && c >= 0 && c < 8) {
        if (currentBoard[r][c] === null) {
          moves.push({ row: r, col: c });
          return true;
        }
        if (currentBoard[r][c].charAt(0) === opponentColor) {
          moves.push({ row: r, col: c });
        }
      }
      return false;
    };

    const addLineMoves = (dr, dc) => {
      let r = row + dr;
      let c = col + dc;
      while (r >= 0 && r < 8 && c >= 0 && c < 8) {
        if (currentBoard[r][c] === null) {
          moves.push({ row: r, col: c });
        } else {
          if (currentBoard[r][c].charAt(0) === opponentColor) {
            moves.push({ row: r, col: c });
          }
          break;
        }
        r += dr;
        c += dc;
      }
    };

    switch (type) {
      case 'P':
        const dir = color === 'w' ? -1 : 1;
        const startRow = color === 'w' ? 6 : 1;
        // Forward 1
        if (row + dir >= 0 && row + dir < 8 && currentBoard[row + dir][col] === null) {
          moves.push({ row: row + dir, col: col });
          // Forward 2
          if (row === startRow && currentBoard[row + 2 * dir][col] === null) {
            moves.push({ row: row + 2 * dir, col: col });
          }
        }
        // Capture
        [-1, 1].forEach(dc => {
          const r = row + dir;
          const c = col + dc;
          if (r >= 0 && r < 8 && c >= 0 && c < 8 && currentBoard[r][c] && (isForAttackCheck || currentBoard[r][c].charAt(0) === opponentColor)) {
            moves.push({ row: r, col: c });
          }
        });
        break;
      case 'R':
        addLineMoves(1, 0); addLineMoves(-1, 0); addLineMoves(0, 1); addLineMoves(0, -1);
        break;
      case 'N':
        [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]].forEach(([dr, dc]) => addMove(row + dr, col + dc));
        break;
      case 'B':
        addLineMoves(1, 1); addLineMoves(1, -1); addLineMoves(-1, 1); addLineMoves(-1, -1);
        break;
      case 'Q':
        addLineMoves(1, 0); addLineMoves(-1, 0); addLineMoves(0, 1); addLineMoves(0, -1);
        addLineMoves(1, 1); addLineMoves(1, -1); addLineMoves(-1, 1); addLineMoves(-1, -1);
        break;
      case 'K':
        [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]].forEach(([dr, dc]) => addMove(row + dr, col + dc));
        break;
      default: break;
    }
    return moves;
  }, []);

  const getValidMovesForPiece = useCallback((piece, row, col, currentBoard) => {
    const potentialMoves = getPieceMoves(piece, row, col, currentBoard);
    const color = piece.charAt(0);
    return potentialMoves.filter(move => {
      const tempBoard = JSON.parse(JSON.stringify(currentBoard));
      tempBoard[move.row][move.col] = piece;
      tempBoard[row][col] = null;
      return !isKingInCheck(color, tempBoard);
    });
  }, [getPieceMoves, isKingInCheck]);

  const hasAnyValidMoves = useCallback((color, currentBoard) => {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = currentBoard[r][c];
        if (piece && piece.charAt(0) === color) {
          if (getValidMovesForPiece(piece, r, c, currentBoard).length > 0) {
            return true;
          }
        }
      }
    }
    return false;
  }, [getValidMovesForPiece]);

  const handleSquareClick = useCallback((row, col) => {
    if (gameState !== 'playing' && gameState !== 'check') return;

    const piece = board[row][col];

    if (selectedPiece) {
      const isValidMove = validMoves.some(m => m.row === row && m.col === col);
      if (isValidMove) {
        const newBoard = JSON.parse(JSON.stringify(board));
        const newCaptured = { ...captured };

        const targetPiece = newBoard[row][col];
        if (targetPiece) {
          const capturedColor = targetPiece.charAt(0);
          const capturedSide = capturedColor === 'w' ? 'b' : 'w';
          newCaptured[capturedSide] = [...newCaptured[capturedSide], targetPiece];
        }
        
        newBoard[row][col] = newBoard[selectedPiece.row][selectedPiece.col];
        newBoard[selectedPiece.row][selectedPiece.col] = null;

        // Pawn promotion
        if (newBoard[row][col] === 'wP' && row === 0) newBoard[row][col] = 'wQ';
        if (newBoard[row][col] === 'bP' && row === 7) newBoard[row][col] = 'bQ';

        setBoard(newBoard);
        setCaptured(newCaptured);
        setLastMove({ from: { row: selectedPiece.row, col: selectedPiece.col }, to: { row, col } });
        setSelectedPiece(null);
        setValidMoves([]);
        setTurn(turn === 'w' ? 'b' : 'w');

        const nextTurn = turn === 'w' ? 'b' : 'w';
        if (isKingInCheck(nextTurn, newBoard)) {
          setKingInCheck(nextTurn);
          if (!hasAnyValidMoves(nextTurn, newBoard)) {
            setGameState('checkmate');
          } else {
            setGameState('check');
          }
        } else {
          setKingInCheck(null);
          if (!hasAnyValidMoves(nextTurn, newBoard)) {
            setGameState('stalemate');
          } else {
            setGameState('playing');
          }
        }
      } else {
        setSelectedPiece(null);
        setValidMoves([]);
      }
    } else if (piece && piece.charAt(0) === turn) {
      setSelectedPiece({ piece, row, col });
      setValidMoves(getValidMovesForPiece(piece, row, col, board));
    }
  }, [board, selectedPiece, validMoves, gameState, turn, captured, getValidMovesForPiece, hasAnyValidMoves, isKingInCheck]);

  const resetGame = () => {
    setBoard(JSON.parse(JSON.stringify(initialBoard)));
    setTurn('w');
    setSelectedPiece(null);
    setValidMoves([]);
    setGameState('playing');
    setLastMove(null);
    setCaptured({ w: [], b: [] });
    setKingInCheck(null);
  };

  const getStatusMessage = useMemo(() => {
    switch (gameState) {
      case 'check':
        return `${turn === 'w' ? 'White' : 'Black'} is in check!`;
      case 'checkmate':
        return `Checkmate! ${turn === 'b' ? 'White' : 'Black'} wins!`;
      case 'stalemate':
        return 'Stalemate! The game is a draw.';
      default:
        return `${turn === 'w' ? 'White' : 'Black'}'s Turn`;
    }
  }, [gameState, turn]);
  
  const CapturedPiecesPanel = ({ pieces, color }) => (
    <div className="flex-1 p-2 md:p-4 bg-slate-800 rounded-lg">
      <h3 className="text-lg font-bold text-slate-300 mb-2">{color === 'w' ? 'White' : 'Black'} has captured:</h3>
      <div className="flex flex-wrap gap-1">
        {pieces.map((p, i) => <PieceIcon key={`${p}-${i}`} piece={p} />)}
        {pieces.length === 0 && <p className="text-slate-400 italic">No pieces captured</p>}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-2 sm:p-4 font-sans">
      <div className="w-full max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-center items-start gap-4">
          <div className="w-full md:w-auto flex flex-col items-center">
            <div className="bg-slate-800 p-3 rounded-t-lg w-full max-w-xl lg:max-w-2xl text-center">
              <h2 className="text-2xl font-bold text-emerald-400">{getStatusMessage}</h2>
            </div>
            <div className="w-full max-w-xl lg:max-w-2xl aspect-square grid grid-cols-8 shadow-2xl rounded-b-lg overflow-hidden">
              {board.map((row, r) =>
                row.map((piece, c) => {
                  const isLight = (r + c) % 2 === 0;
                  const isSelected = selectedPiece && selectedPiece.row === r && selectedPiece.col === c;
                  const isValidMove = validMoves.some(m => m.row === r && m.col === c);
                  const isLastMove = lastMove && ((lastMove.from.row === r && lastMove.from.col === c) || (lastMove.to.row === r && lastMove.to.col === c));
                  const isCheckedKing = kingInCheck && board[r][c] === kingInCheck + 'K';

                  return (
                    <div
                      key={`${r}-${c}`}
                      onClick={() => handleSquareClick(r, c)}
                      className={`relative flex items-center justify-center cursor-pointer transition-colors duration-200 
                      ${isLight ? 'bg-slate-300' : 'bg-slate-500'}
                      ${isSelected ? 'bg-emerald-500/80' : ''}
                      ${isLastMove ? (isLight ? 'bg-yellow-300/70' : 'bg-yellow-400/70') : ''}
                      `}
                      role="button"
                      aria-label={`Square ${String.fromCharCode(65 + c)}${8 - r}${piece ? `, ${PIECES[piece]}` : ', empty'}`}
                    >
                      {piece && <PieceIcon piece={piece} />}
                      {isValidMove && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className={`w-1/3 h-1/3 rounded-full ${board[r][c] ? 'bg-red-500/50' : 'bg-emerald-500/50'}`}></div>
                        </div>
                      )}
                      {isCheckedKing && (
                        <div className="absolute inset-0 bg-red-600/60 animate-pulse"></div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
            <div className="mt-4 flex gap-4 w-full max-w-xl lg:max-w-2xl">
              <button
                onClick={resetGame}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 ease-in-out flex items-center justify-center gap-2 text-lg"
              >
                <Repeat size={24} /> New Game
              </button>
            </div>
          </div>

          <div className="w-full md:w-64 flex md:flex-col gap-4 mt-4 md:mt-0">
             <CapturedPiecesPanel pieces={captured.b} color="w" />
             <CapturedPiecesPanel pieces={captured.w} color="b" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChessGame;
