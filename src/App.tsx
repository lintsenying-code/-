import React, { useState, useEffect, useCallback } from 'react';
import { Bomb, Flag, Clock, RotateCcw, Trophy, Skull, Cpu, Zap, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---

type Difficulty = 'beginner' | 'intermediate' | 'expert';

interface GameConfig {
  rows: number;
  cols: number;
  mines: number;
}

const DIFFICULTIES: Record<Difficulty, GameConfig> = {
  beginner: { rows: 9, cols: 9, mines: 10 },
  intermediate: { rows: 16, cols: 16, mines: 40 },
  expert: { rows: 16, cols: 30, mines: 99 },
};

interface Cell {
  row: number;
  col: number;
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  neighborMines: number;
}

type GameStatus = 'idle' | 'playing' | 'won' | 'lost';

// --- Components ---

export default function App() {
  const [difficulty, setDifficulty] = useState<Difficulty>('beginner');
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [status, setStatus] = useState<GameStatus>('idle');
  const [timer, setTimer] = useState(0);
  const [flagsUsed, setFlagsUsed] = useState(0);

  const config = DIFFICULTIES[difficulty];

  const initGrid = useCallback((rows: number, cols: number, mines: number) => {
    const newGrid: Cell[][] = [];
    for (let r = 0; r < rows; r++) {
      const row: Cell[] = [];
      for (let c = 0; c < cols; c++) {
        row.push({
          row: r,
          col: c,
          isMine: false,
          isRevealed: false,
          isFlagged: false,
          neighborMines: 0,
        });
      }
      newGrid.push(row);
    }

    let minesPlaced = 0;
    while (minesPlaced < mines) {
      const r = Math.floor(Math.random() * rows);
      const c = Math.floor(Math.random() * cols);
      if (!newGrid[r][c].isMine) {
        newGrid[r][c].isMine = true;
        minesPlaced++;
      }
    }

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!newGrid[r][c].isMine) {
          let count = 0;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const nr = r + dr;
              const nc = c + dc;
              if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && newGrid[nr][nc].isMine) {
                count++;
              }
            }
          }
          newGrid[r][c].neighborMines = count;
        }
      }
    }

    setGrid(newGrid);
    setStatus('idle');
    setTimer(0);
    setFlagsUsed(0);
  }, []);

  useEffect(() => {
    initGrid(config.rows, config.cols, config.mines);
  }, [difficulty, initGrid, config.rows, config.cols, config.mines]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === 'playing') {
      interval = setInterval(() => {
        setTimer((t) => t + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [status]);

  const revealCell = (r: number, c: number) => {
    if (status === 'won' || status === 'lost' || grid[r][c].isRevealed || grid[r][c].isFlagged) return;

    if (status === 'idle') setStatus('playing');

    const newGrid = [...grid.map((row) => [...row])];

    if (newGrid[r][c].isMine) {
      newGrid.forEach((row) =>
        row.forEach((cell) => {
          if (cell.isMine) cell.isRevealed = true;
        })
      );
      setGrid(newGrid);
      setStatus('lost');
      return;
    }

    const floodFill = (row: number, col: number) => {
      if (row < 0 || row >= config.rows || col < 0 || col >= config.cols || newGrid[row][col].isRevealed || newGrid[row][col].isFlagged) return;
      newGrid[row][col].isRevealed = true;
      if (newGrid[row][col].neighborMines === 0) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            floodFill(row + dr, col + dc);
          }
        }
      }
    };

    floodFill(r, c);

    let unrevealedNonMines = 0;
    newGrid.forEach((row) =>
      row.forEach((cell) => {
        if (!cell.isMine && !cell.isRevealed) unrevealedNonMines++;
      })
    );

    setGrid(newGrid);
    if (unrevealedNonMines === 0) setStatus('won');
  };

  const toggleFlag = (e: React.MouseEvent, r: number, c: number) => {
    e.preventDefault();
    if (status === 'won' || status === 'lost' || grid[r][c].isRevealed) return;

    const newGrid = [...grid.map((row) => [...row])];
    const isFlagged = !newGrid[r][c].isFlagged;
    newGrid[r][c].isFlagged = isFlagged;
    setGrid(newGrid);
    setFlagsUsed((prev) => (isFlagged ? prev + 1 : prev - 1));
    if (status === 'idle') setStatus('playing');
  };

  const resetGame = () => initGrid(config.rows, config.cols, config.mines);

  const getNumberColor = (n: number) => {
    const colors = [
      '',
      'text-cyan-400',
      'text-emerald-400',
      'text-[#ff0032]',
      'text-purple-400',
      'text-amber-400',
      'text-blue-400',
      'text-rose-400',
      'text-white',
    ];
    return colors[n] || 'text-white';
  };

  return (
    <div className="min-h-screen bg-[#0b0b0b] text-white font-display selection:bg-[#ff0032] selection:text-white">
      {/* ROG Header Decor */}
      <div className="h-1 bg-gradient-to-r from-transparent via-[#ff0032] to-transparent opacity-50" />
      
      <header className="border-b border-white/10 p-6 flex justify-between items-center bg-[#111111]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute -inset-1 bg-[#ff0032] blur opacity-20 animate-pulse" />
            <div className="relative p-2 bg-[#1a1a1a] border border-[#ff0032]/50 rog-border">
              <Cpu className="w-6 h-6 text-[#ff0032]" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-black italic tracking-tighter uppercase leading-none">
              ROG <span className="text-[#ff0032]">Minesweeper</span>
            </h1>
            <p className="text-[9px] font-mono text-[#ff0032] uppercase tracking-[0.4em] mt-1 opacity-80">
              For Those Who Dare
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 sm:gap-8">
          <div className="flex flex-col items-end">
            <span className="text-[8px] font-mono text-[#ff0032] uppercase tracking-widest mb-1">Mines Left</span>
            <div className="flex items-center gap-2 px-4 py-1 bg-[#1a1a1a] border-l-2 border-[#ff0032] font-mono italic text-xl font-bold">
              <Zap className="w-3 h-3 text-[#ff0032]" />
              {(config.mines - flagsUsed).toString().padStart(2, '0')}
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[8px] font-mono text-[#ff0032] uppercase tracking-widest mb-1">System Time</span>
            <div className="flex items-center gap-2 px-4 py-1 bg-[#1a1a1a] border-l-2 border-[#ff0032] font-mono italic text-xl font-bold">
              <Clock className="w-3 h-3 text-[#ff0032]" />
              {timer.toString().padStart(3, '0')}
            </div>
          </div>
          <button 
            onClick={resetGame}
            className="group relative p-3 bg-[#1a1a1a] border border-white/10 hover:border-[#ff0032] transition-all rog-border"
          >
            <RotateCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500 text-[#ff0032]" />
          </button>
        </div>
      </header>

      <main className="p-4 sm:p-10 max-w-7xl mx-auto flex flex-col items-center gap-10">
        {/* Difficulty Selector */}
        <div className="flex flex-wrap justify-center gap-3">
          {(Object.keys(DIFFICULTIES) as Difficulty[]).map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={`px-8 py-2 text-[10px] font-bold uppercase tracking-[0.2em] transition-all rog-border
                ${difficulty === d 
                  ? 'bg-[#ff0032] text-white rog-glow' 
                  : 'bg-[#1a1a1a] text-white/40 border border-white/10 hover:border-[#ff0032]/50 hover:text-white'
                }`}
            >
              {d}
            </button>
          ))}
        </div>

        {/* Game Board Container */}
        <div className="relative group">
          {/* Cyber Decor Corners */}
          <div className="absolute -top-4 -left-4 w-8 h-8 border-t-2 border-l-2 border-[#ff0032] opacity-50" />
          <div className="absolute -bottom-4 -right-4 w-8 h-8 border-b-2 border-r-2 border-[#ff0032] opacity-50" />
          
          <div className="relative p-2 bg-[#111111] border border-white/10 shadow-2xl overflow-auto max-w-[95vw]">
            <div 
              className="grid gap-1 p-1 bg-[#0b0b0b]"
              style={{ 
                gridTemplateColumns: `repeat(${config.cols}, minmax(32px, 1fr))`,
                width: 'fit-content'
              }}
            >
              {grid.map((row, r) => (
                row.map((cell, c) => (
                  <motion.button
                    key={`${r}-${c}`}
                    whileHover={{ scale: cell.isRevealed ? 1 : 1.08 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => revealCell(r, c)}
                    onContextMenu={(e) => toggleFlag(e, r, c)}
                    className={`
                      w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-sm font-mono font-bold transition-all
                      ${cell.isRevealed 
                        ? 'bg-[#1a1a1a] border border-white/5' 
                        : 'bg-[#222222] border border-white/10 hover:bg-[#2a2a2a] hover:border-[#ff0032]/40'
                      }
                      ${status === 'lost' && cell.isMine && 'bg-[#ff0032]/20 border-[#ff0032]'}
                    `}
                  >
                    <AnimatePresence mode="wait">
                      {cell.isRevealed ? (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="flex items-center justify-center w-full h-full"
                        >
                          {cell.isMine ? (
                            <Bomb className="w-5 h-5 text-[#ff0032] drop-shadow-[0_0_8px_rgba(255,0,50,0.8)]" />
                          ) : (
                            cell.neighborMines > 0 && (
                              <span className={`${getNumberColor(cell.neighborMines)} drop-shadow-[0_0_5px_rgba(255,255,255,0.2)]`}>
                                {cell.neighborMines}
                              </span>
                            )
                          )}
                        </motion.div>
                      ) : cell.isFlagged ? (
                        <motion.div
                          initial={{ scale: 0, y: -5 }}
                          animate={{ scale: 1, y: 0 }}
                          exit={{ scale: 0 }}
                        >
                          <Flag className="w-4 h-4 text-[#ff0032] fill-[#ff0032]" />
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </motion.button>
                ))
              ))}
            </div>

            {/* Status Overlay */}
            <AnimatePresence>
              {(status === 'won' || status === 'lost') && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 backdrop-blur-sm"
                >
                  <motion.div
                    initial={{ scale: 0.8, rotateX: 45 }}
                    animate={{ scale: 1, rotateX: 0 }}
                    className="bg-[#111111] border-2 border-[#ff0032] p-10 rog-border text-center rog-glow"
                  >
                    {status === 'won' ? (
                      <>
                        <Trophy className="w-16 h-16 text-emerald-400 mx-auto mb-6 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]" />
                        <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-2">Mission <span className="text-emerald-400">Success</span></h2>
                        <p className="text-[10px] font-mono text-white/50 mb-8 uppercase tracking-[0.3em]">Clearance Time: {timer}s</p>
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="w-16 h-16 text-[#ff0032] mx-auto mb-6 drop-shadow-[0_0_15px_rgba(255,0,50,0.5)]" />
                        <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-2">System <span className="text-[#ff0032]">Breached</span></h2>
                        <p className="text-[10px] font-mono text-white/50 mb-8 uppercase tracking-[0.3em]">Critical Failure Detected</p>
                      </>
                    )}
                    <button
                      onClick={resetGame}
                      className="w-full py-4 bg-[#ff0032] text-white font-black uppercase tracking-[0.2em] italic hover:brightness-125 transition-all rog-border"
                    >
                      Reboot System
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer Info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 w-full max-w-4xl border-t border-white/5 pt-10">
          <div className="space-y-2">
            <span className="text-[9px] font-mono text-[#ff0032] uppercase tracking-widest block">Core Protocol</span>
            <p className="text-xs text-white/40 leading-relaxed uppercase">
              Identify and isolate all explosive nodes within the grid. Precision is mandatory.
            </p>
          </div>
          <div className="space-y-2">
            <span className="text-[9px] font-mono text-[#ff0032] uppercase tracking-widest block">Input Mapping</span>
            <div className="flex gap-4 text-[10px] font-mono uppercase">
              <div className="flex flex-col">
                <span className="text-white">L-Click</span>
                <span className="text-white/30">Scan</span>
              </div>
              <div className="flex flex-col">
                <span className="text-white">R-Click</span>
                <span className="text-white/30">Flag</span>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <span className="text-[9px] font-mono text-[#ff0032] uppercase tracking-widest block">System Status</span>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-mono text-emerald-500 uppercase">Online</span>
            </div>
          </div>
        </div>
      </main>

      <footer className="p-8 flex flex-col items-center gap-4 opacity-30">
        <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <p className="text-[8px] font-mono uppercase tracking-[0.5em]">
          Republic of Gamers // Minesweeper Division
        </p>
      </footer>
    </div>
  );
}
