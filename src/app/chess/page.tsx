export const dynamic = 'force-dynamic';
"use client";

import { useState, useCallback, useEffect } from "react";
import Navbar from "@/components/Navbar";
// ── Types ──────────────────────────────────────────────────────────────────
type Color = "white" | "black";
type PieceType = "king" | "queen" | "rook" | "bishop" | "knight" | "pawn";
interface Piece { type: PieceType; color: Color; }
type Square = Piece | null;
type Board = Square[][];
interface Position { row: number; col: number; }
interface Move { from: Position; to: Position; promotion?: PieceType; }
interface GameState {
  board: Board;
  turn: Color;
  castling: { white: { kingSide: boolean; queenSide: boolean }; black: { kingSide: boolean; queenSide: boolean } };
  enPassant: Position | null;
  status: "playing" | "check" | "checkmate" | "stalemate" | "draw";
  lastMove: Move | null;
  capturedWhite: Piece[];
  capturedBlack: Piece[];
  halfMoves: number;
  fullMoves: number;
}

// ── Unicode pieces ─────────────────────────────────────────────────────────
const GLYPHS: Record<Color, Record<PieceType, string>> = {
  white: { king: "♔", queen: "♕", rook: "♖", bishop: "♗", knight: "♘", pawn: "♙" },
  black: { king: "♚", queen: "♛", rook: "♜", bishop: "♝", knight: "♞", pawn: "♟" },
};

// ── Board helpers ──────────────────────────────────────────────────────────
function emptyBoard(): Board { return Array.from({ length: 8 }, () => Array(8).fill(null)); }

function initialBoard(): Board {
  const b = emptyBoard();
  const backRow: PieceType[] = ["rook","knight","bishop","queen","king","bishop","knight","rook"];
  for (let c = 0; c < 8; c++) {
    b[0][c] = { type: backRow[c], color: "black" };
    b[1][c] = { type: "pawn", color: "black" };
    b[6][c] = { type: "pawn", color: "white" };
    b[7][c] = { type: backRow[c], color: "white" };
  }
  return b;
}

function cloneBoard(b: Board): Board { return b.map(row => [...row]); }

function opponent(c: Color): Color { return c === "white" ? "black" : "white"; }

function inBounds(r: number, c: number): boolean { return r >= 0 && r < 8 && c >= 0 && c < 8; }

// ── Raw move generation (ignores check) ───────────────────────────────────
function rawMoves(board: Board, pos: Position, state: GameState): Position[] {
  const piece = board[pos.row][pos.col];
  if (!piece) return [];
  const { row: r, col: c } = pos;
  const moves: Position[] = [];

  const push = (nr: number, nc: number) => {
    if (inBounds(nr, nc)) {
      const target = board[nr][nc];
      if (!target || target.color !== piece.color) moves.push({ row: nr, col: nc });
    }
  };
  const slide = (dr: number, dc: number) => {
    let nr = r + dr, nc = c + dc;
    while (inBounds(nr, nc)) {
      const target = board[nr][nc];
      if (target) { if (target.color !== piece.color) moves.push({ row: nr, col: nc }); break; }
      moves.push({ row: nr, col: nc });
      nr += dr; nc += dc;
    }
  };

  switch (piece.type) {
    case "pawn": {
      const dir = piece.color === "white" ? -1 : 1;
      const startRow = piece.color === "white" ? 6 : 1;
      if (inBounds(r + dir, c) && !board[r + dir][c]) {
        moves.push({ row: r + dir, col: c });
        if (r === startRow && !board[r + 2 * dir][c]) moves.push({ row: r + 2 * dir, col: c });
      }
      for (const dc of [-1, 1]) {
        if (inBounds(r + dir, c + dc)) {
          const target = board[r + dir][c + dc];
          if (target && target.color !== piece.color) moves.push({ row: r + dir, col: c + dc });
          if (state.enPassant && state.enPassant.row === r + dir && state.enPassant.col === c + dc)
            moves.push({ row: r + dir, col: c + dc });
        }
      }
      break;
    }
    case "knight":
      for (const [dr, dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) push(r+dr, c+dc);
      break;
    case "bishop":
      for (const [dr, dc] of [[-1,-1],[-1,1],[1,-1],[1,1]]) slide(dr, dc);
      break;
    case "rook":
      for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) slide(dr, dc);
      break;
    case "queen":
      for (const [dr, dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) slide(dr, dc);
      break;
    case "king": {
      for (const [dr, dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) push(r+dr, c+dc);
      // Castling
      const castling = state.castling[piece.color];
      const backR = piece.color === "white" ? 7 : 0;
      if (r === backR && c === 4) {
        if (castling.kingSide && !board[backR][5] && !board[backR][6] &&
            board[backR][7]?.type === "rook" && board[backR][7]?.color === piece.color)
          moves.push({ row: backR, col: 6 });
        if (castling.queenSide && !board[backR][3] && !board[backR][2] && !board[backR][1] &&
            board[backR][0]?.type === "rook" && board[backR][0]?.color === piece.color)
          moves.push({ row: backR, col: 2 });
      }
      break;
    }
  }
  return moves;
}

// ── Is square attacked by color ────────────────────────────────────────────
function isAttacked(board: Board, pos: Position, byColor: Color, state: GameState): boolean {
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p && p.color === byColor) {
        const moves = rawMoves(board, { row: r, col: c }, state);
        if (moves.some(m => m.row === pos.row && m.col === pos.col)) return true;
      }
    }
  return false;
}

function findKing(board: Board, color: Color): Position | null {
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++)
      if (board[r][c]?.type === "king" && board[r][c]?.color === color) return { row: r, col: c };
  return null;
}

function isInCheck(board: Board, color: Color, state: GameState): boolean {
  const king = findKing(board, color);
  if (!king) return false;
  return isAttacked(board, king, opponent(color), state);
}

// ── Apply move and return new board + state ────────────────────────────────
function applyMove(state: GameState, move: Move): GameState {
  const { from, to } = move;
  const board = cloneBoard(state.board);
  const piece = board[from.row][from.col]!;
  const captured = board[to.row][to.col];
  const newCapturedWhite = [...state.capturedWhite];
  const newCapturedBlack = [...state.capturedBlack];
  if (captured) {
    if (captured.color === "white") newCapturedWhite.push(captured);
    else newCapturedBlack.push(captured);
  }

  let newEnPassant: Position | null = null;
  const newCastling = {
    white: { ...state.castling.white },
    black: { ...state.castling.black },
  };

  // En passant capture
  if (piece.type === "pawn" && state.enPassant &&
      to.row === state.enPassant.row && to.col === state.enPassant.col) {
    const capturedPawnRow = from.row;
    const ep = board[capturedPawnRow][to.col];
    if (ep) {
      if (ep.color === "white") newCapturedWhite.push(ep);
      else newCapturedBlack.push(ep);
    }
    board[capturedPawnRow][to.col] = null;
  }

  // En passant opportunity
  if (piece.type === "pawn" && Math.abs(to.row - from.row) === 2)
    newEnPassant = { row: (from.row + to.row) / 2, col: from.col };

  // Castling move
  if (piece.type === "king") {
    newCastling[piece.color].kingSide = false;
    newCastling[piece.color].queenSide = false;
    const backR = piece.color === "white" ? 7 : 0;
    if (from.col === 4 && to.col === 6) { board[backR][5] = board[backR][7]; board[backR][7] = null; }
    if (from.col === 4 && to.col === 2) { board[backR][3] = board[backR][0]; board[backR][0] = null; }
  }

  // Castling rights
  if (piece.type === "rook") {
    if (piece.color === "white") {
      if (from.col === 7) newCastling.white.kingSide = false;
      if (from.col === 0) newCastling.white.queenSide = false;
    } else {
      if (from.col === 7) newCastling.black.kingSide = false;
      if (from.col === 0) newCastling.black.queenSide = false;
    }
  }

  // Move piece
  board[to.row][to.col] = piece;
  board[from.row][from.col] = null;

  // Promotion
  if (piece.type === "pawn" && (to.row === 0 || to.row === 7))
    board[to.row][to.col] = { type: move.promotion ?? "queen", color: piece.color };

  const nextTurn = opponent(state.turn);
  const halfMoves = (captured || piece.type === "pawn") ? 0 : state.halfMoves + 1;
  const fullMoves = state.turn === "black" ? state.fullMoves + 1 : state.fullMoves;

  const tempState: GameState = {
    ...state,
    board,
    turn: nextTurn,
    castling: newCastling,
    enPassant: newEnPassant,
    lastMove: move,
    capturedWhite: newCapturedWhite,
    capturedBlack: newCapturedBlack,
    halfMoves,
    fullMoves,
    status: "playing",
  };

  const inCheck = isInCheck(board, nextTurn, tempState);
  const hasLegal = getLegalMoves(board, nextTurn, tempState).length > 0;
  let status: GameState["status"] = "playing";
  if (!hasLegal) status = inCheck ? "checkmate" : "stalemate";
  else if (halfMoves >= 100) status = "draw";
  else if (inCheck) status = "check";

  return { ...tempState, status };
}

// ── Legal moves (filtered for check) ──────────────────────────────────────
function legalMovesFor(board: Board, pos: Position, state: GameState): Position[] {
  const piece = board[pos.row][pos.col];
  if (!piece) return [];
  const raw = rawMoves(board, pos, state);
  return raw.filter(to => {
    const tempBoard = cloneBoard(board);
    // En passant
    if (piece.type === "pawn" && state.enPassant &&
        to.row === state.enPassant.row && to.col === state.enPassant.col)
      tempBoard[pos.row][to.col] = null;
    // Castling: check king doesn't pass through check
    if (piece.type === "king" && Math.abs(to.col - pos.col) === 2) {
      const dir = to.col > pos.col ? 1 : -1;
      const passThrough = { row: pos.row, col: pos.col + dir };
      const tempB2 = cloneBoard(board);
      if (isAttacked(board, pos, opponent(piece.color), state)) return false;
      if (isAttacked(board, passThrough, opponent(piece.color), state)) return false;
      tempB2[pos.row][to.col] = tempB2[pos.row][pos.col];
      tempB2[pos.row][pos.col] = null;
      if (piece.type === "king") {
        if (to.col === 6) { tempB2[pos.row][5] = tempB2[pos.row][7]; tempB2[pos.row][7] = null; }
        if (to.col === 2) { tempB2[pos.row][3] = tempB2[pos.row][0]; tempB2[pos.row][0] = null; }
      }
      return !isInCheck(tempB2, piece.color, state);
    }
    tempBoard[to.row][to.col] = tempBoard[pos.row][pos.col];
    tempBoard[pos.row][pos.col] = null;
    return !isInCheck(tempBoard, piece.color, state);
  });
}

function getLegalMoves(board: Board, color: Color, state: GameState): Move[] {
  const moves: Move[] = [];
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p && p.color === color) {
        const targets = legalMovesFor(board, { row: r, col: c }, state);
        for (const to of targets) {
          const isPromo = p.type === "pawn" && (to.row === 0 || to.row === 7);
          if (isPromo) {
            for (const promo of ["queen","rook","bishop","knight"] as PieceType[])
              moves.push({ from: { row: r, col: c }, to, promotion: promo });
          } else {
            moves.push({ from: { row: r, col: c }, to });
          }
        }
      }
    }
  return moves;
}

// ── Simple AI (material + position heuristic) ──────────────────────────────
const MATERIAL: Record<PieceType, number> = { king: 0, queen: 9, rook: 5, bishop: 3, knight: 3, pawn: 1 };

function evaluateBoard(board: Board): number {
  let score = 0;
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p) {
        const val = MATERIAL[p.type];
        score += p.color === "white" ? val : -val;
      }
    }
  return score;
}

function pickAIMove(state: GameState): Move | null {
  const moves = getLegalMoves(state.board, state.turn, state);
  if (!moves.length) return null;
  let best: Move | null = null;
  let bestScore = Infinity;
  for (const m of moves) {
    const next = applyMove(state, m);
    const score = evaluateBoard(next.board) + (Math.random() - 0.5) * 0.3;
    if (score < bestScore) { bestScore = score; best = m; }
  }
  return best;
}

// ── Initial state ──────────────────────────────────────────────────────────
function initialState(): GameState {
  const board = initialBoard();
  return {
    board,
    turn: "white",
    castling: { white: { kingSide: true, queenSide: true }, black: { kingSide: true, queenSide: true } },
    enPassant: null,
    status: "playing",
    lastMove: null,
    capturedWhite: [],
    capturedBlack: [],
    halfMoves: 0,
    fullMoves: 1,
  };
}

// ── Component ──────────────────────────────────────────────────────────────
export default function ChessGame() {
  const [state, setState] = useState<GameState>(initialState);
  const [selected, setSelected] = useState<Position | null>(null);
  const [legalDests, setLegalDests] = useState<Position[]>([]);
  const [promoModal, setPromoModal] = useState<{ from: Position; to: Position } | null>(null);
  const [mode, setMode] = useState<"pvp" | "ai">("pvp");
  const [history, setHistory] = useState<GameState[]>([]);
  const [flipped, setFlipped] = useState(false);

  const isGameOver = state.status === "checkmate" || state.status === "stalemate" || state.status === "draw";

  // AI move
  useEffect(() => {
    if (mode !== "ai" || state.turn !== "black" || isGameOver) return;
    const t = setTimeout(() => {
      const move = pickAIMove(state);
      if (move) {
        setHistory(h => [...h, state]);
        setState(s => applyMove(s, move));
      }
    }, 400);
    return () => clearTimeout(t);
  }, [state, mode, isGameOver]);

  const handleSquareClick = useCallback((row: number, col: number) => {
    if (isGameOver) return;
    if (mode === "ai" && state.turn === "black") return;

    const piece = state.board[row][col];
    const pos = { row, col };

    if (selected) {
      const isLegal = legalDests.some(d => d.row === row && d.col === col);
      if (isLegal) {
        const movingPiece = state.board[selected.row][selected.col];
        const isPromo = movingPiece?.type === "pawn" && (row === 0 || row === 7);
        if (isPromo) {
          setPromoModal({ from: selected, to: pos });
          setSelected(null); setLegalDests([]);
        } else {
          setHistory(h => [...h, state]);
          setState(s => applyMove(s, { from: selected, to: pos }));
          setSelected(null); setLegalDests([]);
        }
        return;
      }
      if (piece && piece.color === state.turn) {
        setSelected(pos);
        setLegalDests(legalMovesFor(state.board, pos, state));
        return;
      }
      setSelected(null); setLegalDests([]);
      return;
    }
    if (piece && piece.color === state.turn) {
      setSelected(pos);
      setLegalDests(legalMovesFor(state.board, pos, state));
    }
  }, [state, selected, legalDests, isGameOver, mode]);

  const handlePromotion = (promo: PieceType) => {
    if (!promoModal) return;
    setHistory(h => [...h, state]);
    setState(s => applyMove(s, { from: promoModal.from, to: promoModal.to, promotion: promo }));
    setPromoModal(null);
  };

  const undo = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setState(prev);
    setHistory(h => h.slice(0, -1));
    setSelected(null); setLegalDests([]);
  };

  const reset = () => {
    setState(initialState()); setHistory([]);
    setSelected(null); setLegalDests([]);
  };

  const FILES = ["a","b","c","d","e","f","g","h"];
  const RANKS = ["8","7","6","5","4","3","2","1"];

  const displayRows = flipped ? [0,1,2,3,4,5,6,7] : [7,6,5,4,3,2,1,0];
  const displayCols = flipped ? [7,6,5,4,3,2,1,0] : [0,1,2,3,4,5,6,7];

  const statusText = () => {
    if (state.status === "checkmate") return `Checkmate! ${opponent(state.turn) === "white" ? "White" : "Black"} wins!`;
    if (state.status === "stalemate") return "Stalemate — Draw!";
    if (state.status === "draw") return "Draw (50-move rule)";
    if (state.status === "check") return `${state.turn === "white" ? "White" : "Black"} is in check!`;
    return `${state.turn === "white" ? "White" : "Black"}'s turn`;
  };

  const capturedSort = (arr: Piece[]) =>
    [...arr].sort((a, b) => MATERIAL[b.type] - MATERIAL[a.type]);

  return (
    <>
    <Navbar />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --sq-light: #f0d9b5;
          --sq-dark: #b58863;
          --sq-sel: rgba(20,85,0,0.5);
          --sq-legal: rgba(20,85,0,0.25);
          --sq-last: rgba(205,210,106,0.6);
          --sq-check: rgba(220,38,38,0.55);
          --bg: #1a1a2e;
          --surface: #16213e;
          --surface2: #0f3460;
          --border: #2a2a4a;
          --text: #e8eaf2;
          --muted: #8888aa;
          --accent: #e94560;
          --accent2: #0f3460;
          --radius: 12px;
        }
        body { background: var(--bg); color: var(--text); font-family: 'DM Sans', sans-serif; }

        .chess-wrap {
          min-height: 100vh;
          display: flex; flex-direction: column; align-items: center;
          justify-content: flex-start;
          padding: 24px 12px 60px;
          background: var(--bg);
          background-image: radial-gradient(ellipse at 20% 0%, rgba(233,69,96,0.08) 0%, transparent 50%),
                            radial-gradient(ellipse at 80% 100%, rgba(15,52,96,0.3) 0%, transparent 50%);
        }

        .chess-title {
          font-family: 'Syne', sans-serif;
          font-size: clamp(1.6rem, 4vw, 2.4rem);
          font-weight: 800;
          letter-spacing: -0.03em;
          color: var(--text);
          margin-bottom: 6px;
        }
        .chess-title span { color: var(--accent); }

        /* Controls bar */
        .chess-controls {
          display: flex; gap: 8px; align-items: center;
          flex-wrap: wrap; justify-content: center;
          margin-bottom: 14px;
        }
        .ctrl-btn {
          padding: 7px 16px; border-radius: 8px;
          background: var(--surface2); color: var(--text);
          border: 1px solid var(--border);
          font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500;
          cursor: pointer; transition: all .15s;
        }
        .ctrl-btn:hover { background: #1a3a6e; border-color: #4a4a8a; }
        .ctrl-btn.active { background: var(--accent); border-color: var(--accent); color: #fff; }
        .ctrl-btn:disabled { opacity: .4; cursor: not-allowed; }

        /* Status bar */
        .chess-status {
          padding: 8px 20px; border-radius: 99px;
          background: var(--surface); border: 1px solid var(--border);
          font-size: 13px; font-weight: 600; color: var(--text);
          margin-bottom: 14px; transition: all .3s;
        }
        .chess-status.check { background: rgba(233,69,96,0.15); border-color: var(--accent); color: var(--accent); }
        .chess-status.checkmate { background: rgba(233,69,96,0.2); border-color: var(--accent); color: var(--accent); font-size: 15px; }
        .chess-status.stalemate, .chess-status.draw { background: rgba(255,200,0,0.1); border-color: #ffcc00; color: #ffcc00; }

        /* Game layout */
        .chess-layout {
          display: flex; gap: 16px; align-items: flex-start;
          flex-wrap: wrap; justify-content: center;
        }

        /* Side panel */
        .chess-side {
          width: 180px;
          display: flex; flex-direction: column; gap: 12px;
        }
        .side-card {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: var(--radius); padding: 12px 14px;
        }
        .side-label {
          font-size: 10px; font-weight: 700; letter-spacing: .12em;
          text-transform: uppercase; color: var(--muted); margin-bottom: 8px;
        }
        .player-row {
          display: flex; align-items: center; gap: 8px;
          padding: 7px 10px; border-radius: 8px;
          border: 1px solid var(--border); margin-bottom: 6px;
          transition: all .2s;
        }
        .player-row.active {
          border-color: var(--accent);
          background: rgba(233,69,96,0.08);
        }
        .player-dot { width: 14px; height: 14px; border-radius: 50%; border: 2px solid var(--border); flex-shrink: 0; }
        .player-dot.white { background: #f0d9b5; border-color: #b58863; }
        .player-dot.black { background: #2a2a2a; border-color: #555; }
        .player-name { font-size: 13px; font-weight: 500; }
        .player-check { font-size: 10px; color: var(--accent); font-weight: 700; margin-left: auto; }

        .captured-pieces { font-size: 16px; line-height: 1.4; min-height: 24px; word-break: break-all; }

        .move-count { font-size: 24px; font-weight: 700; color: var(--text); }
        .move-sub { font-size: 11px; color: var(--muted); margin-top: 2px; }

        /* Board container */
        .board-container { position: relative; }

        /* Board */
        .chess-board {
          display: grid;
          grid-template-columns: 22px repeat(8, 1fr);
          grid-template-rows: repeat(8, 1fr) 22px;
          border: 3px solid #2a2a4a;
          border-radius: 6px;
          overflow: hidden;
          user-select: none;
        }
        .rank-label, .file-label {
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 600; color: #8888aa;
          background: var(--surface);
        }
        .file-row { display: contents; }

        .sq {
          width: 68px; height: 68px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; position: relative;
          transition: filter .1s;
          font-size: 44px; line-height: 1;
        }
        .sq.light { background: var(--sq-light); }
        .sq.dark  { background: var(--sq-dark); }
        .sq.selected { background: var(--sq-sel) !important; }
        .sq.last-move { background: var(--sq-last) !important; }
        .sq.in-check { background: var(--sq-check) !important; }
        .sq:hover:not(.selected) { filter: brightness(1.08); }

        .legal-dot {
          position: absolute; width: 22px; height: 22px;
          border-radius: 50%; background: rgba(20,85,0,0.38);
          pointer-events: none; z-index: 1;
        }
        .legal-dot.capture {
          width: 100%; height: 100%; border-radius: 0;
          background: transparent;
          border: 4px solid rgba(20,85,0,0.4);
          box-sizing: border-box;
        }

        .piece { z-index: 2; transition: transform .1s; cursor: pointer; line-height: 1; }
        .sq:hover .piece { transform: scale(1.08); }

        /* Promo modal */
        .promo-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.7);
          display: flex; align-items: center; justify-content: center;
          z-index: 100;
        }
        .promo-card {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: var(--radius); padding: 24px;
          text-align: center;
        }
        .promo-title { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; margin-bottom: 16px; }
        .promo-pieces { display: flex; gap: 12px; justify-content: center; }
        .promo-piece {
          width: 60px; height: 60px;
          display: flex; align-items: center; justify-content: center;
          font-size: 40px; border-radius: 10px; cursor: pointer;
          background: var(--surface2); border: 2px solid var(--border);
          transition: all .15s;
        }
        .promo-piece:hover { border-color: var(--accent); background: rgba(233,69,96,0.12); transform: scale(1.1); }

        @media (max-width: 700px) {
          .sq { width: 42px; height: 42px; font-size: 28px; }
          .chess-side { width: 100%; flex-direction: row; flex-wrap: wrap; }
          .side-card { flex: 1; min-width: 140px; }
          .legal-dot { width: 14px; height: 14px; }
        }
        @media (max-width: 420px) {
          .sq { width: 36px; height: 36px; font-size: 22px; }
        }
      `}</style>

      <div className="chess-wrap">
        <h1 className="chess-title" style={{marginBottom:4}}>Chess<span>.</span></h1>
        <p style={{fontSize:13,color:"var(--muted)",marginBottom:16}}>Full rules · en passant · castling · promotion</p>

        {/* Controls */}
        <div className="chess-controls">
          <button className={`ctrl-btn ${mode==="pvp"?"active":""}`} onClick={()=>{ setMode("pvp"); reset(); }}>2 Players</button>
          <button className={`ctrl-btn ${mode==="ai"?"active":""}`} onClick={()=>{ setMode("ai"); reset(); }}>vs AI</button>
          <button className="ctrl-btn" onClick={()=>setFlipped(f=>!f)}>⟳ Flip</button>
          <button className="ctrl-btn" disabled={history.length===0} onClick={undo}>↩ Undo</button>
          <button className="ctrl-btn" onClick={reset}>New Game</button>
        </div>

        {/* Status */}
        <div className={`chess-status ${state.status}`}>{statusText()}</div>

        <div className="chess-layout">

          {/* Left panel */}
          <div className="chess-side">
            <div className="side-card">
              <div className="side-label">Players</div>
              <div className={`player-row ${state.turn==="white" && !isGameOver ? "active" : ""}`}>
                <div className="player-dot white" />
                <span className="player-name">White</span>
                {state.status==="check" && state.turn==="white" && <span className="player-check">CHECK</span>}
              </div>
              <div className={`player-row ${state.turn==="black" && !isGameOver ? "active" : ""}`}>
                <div className="player-dot black" />
                <span className="player-name">{mode==="ai"?"AI (Black)":"Black"}</span>
                {state.status==="check" && state.turn==="black" && <span className="player-check">CHECK</span>}
              </div>
            </div>
            <div className="side-card">
              <div className="side-label">Captured by White</div>
              <div className="captured-pieces">
                {capturedSort(state.capturedBlack).map((p,i)=>
                  <span key={i}>{GLYPHS.black[p.type]}</span>
                )}
              </div>
            </div>
            <div className="side-card">
              <div className="side-label">Captured by Black</div>
              <div className="captured-pieces">
                {capturedSort(state.capturedWhite).map((p,i)=>
                  <span key={i} style={{color:"#888"}}>{GLYPHS.white[p.type]}</span>
                )}
              </div>
            </div>
            <div className="side-card">
              <div className="move-count">Move {state.fullMoves}</div>
              <div className="move-sub">50-move rule: {state.halfMoves}/100</div>
            </div>
          </div>

          {/* Board */}
          <div className="board-container">
            <div className="chess-board">
              {displayRows.map((row, rowIdx) => (
                <>
                  {/* Rank label */}
                  <div key={`rank-${row}`} className="rank-label">
                    {flipped ? RANKS[7-row] : RANKS[row]}
                  </div>
                  {/* Squares */}
                  {displayCols.map((col, colIdx) => {
                    const isLight = (row + col) % 2 === 0;
                    const piece = state.board[row][col];
                    const isSel = selected?.row === row && selected?.col === col;
                    const isLegal = legalDests.some(d => d.row === row && d.col === col);
                    const isLastFrom = state.lastMove?.from.row === row && state.lastMove?.from.col === col;
                    const isLastTo = state.lastMove?.to.row === row && state.lastMove?.to.col === col;
                    const isCheck = state.status !== "playing" && state.status !== "check" ? false :
                      (piece?.type === "king" && piece?.color === state.turn && state.status === "check");
                    const hasCapture = isLegal && !!state.board[row][col];

                    let className = `sq ${isLight?"light":"dark"}`;
                    if (isSel) className += " selected";
                    else if (isCheck) className += " in-check";
                    else if (isLastFrom || isLastTo) className += " last-move";

                    return (
                      <div
                        key={`${row}-${col}`}
                        className={className}
                        onClick={() => handleSquareClick(row, col)}
                      >
                        {isLegal && !hasCapture && <div className="legal-dot" />}
                        {isLegal && hasCapture && <div className="legal-dot capture" />}
                        {piece && (
                          <span className="piece">
                            {GLYPHS[piece.color][piece.type]}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </>
              ))}
              {/* File labels */}
              <div className="rank-label" />
              {displayCols.map((col) => (
                <div key={`file-${col}`} className="file-label">
                  {FILES[col]}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Promotion modal */}
      {promoModal && (
        <div className="promo-overlay">
          <div className="promo-card">
            <div className="promo-title">Promote pawn to…</div>
            <div className="promo-pieces">
              {(["queen","rook","bishop","knight"] as PieceType[]).map(t => (
                <div key={t} className="promo-piece" onClick={() => handlePromotion(t)}
                  title={t.charAt(0).toUpperCase()+t.slice(1)}>
                  {GLYPHS[state.turn][t]}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
