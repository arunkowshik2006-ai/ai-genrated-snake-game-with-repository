import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Terminal } from 'lucide-react';

const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_DIRECTION = { x: 0, y: -1 };
const GAME_SPEED = 100;

const TRACKS = [
  { id: 1, title: 'SYS.CORRUPTION_LOOP', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: 2, title: 'VOID_RESONANCE.WAV', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { id: 3, title: 'SECTOR_7_AMBIENCE', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
];

function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);
  useEffect(() => {
    if (delay !== null) {
      const id = setInterval(() => savedCallback.current(), delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}

export default function App() {
  // Game State
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [food, setFood] = useState({ x: 15, y: 5 });
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isGameStarted, setIsGameStarted] = useState(false);
  
  const lastDirectionRef = useRef(INITIAL_DIRECTION);

  // Music State
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);

  const generateFood = useCallback((currentSnake: {x: number, y: number}[]) => {
    let newFood;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
      const isOccupied = currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
      if (!isOccupied) break;
    }
    return newFood;
  }, []);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    lastDirectionRef.current = INITIAL_DIRECTION;
    setFood(generateFood(INITIAL_SNAKE));
    setScore(0);
    setGameOver(false);
    setIsGameStarted(true);
  };

  const moveSnake = useCallback(() => {
    if (gameOver || !isGameStarted) return;

    setSnake(prevSnake => {
      const head = prevSnake[0];
      const newHead = { x: head.x + direction.x, y: head.y + direction.y };

      // Wall collision
      if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
        setGameOver(true);
        return prevSnake;
      }

      // Self collision
      if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
        setGameOver(true);
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // Food collision
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore(s => s + 10);
        setFood(generateFood(newSnake));
      } else {
        newSnake.pop();
      }

      lastDirectionRef.current = direction;
      return newSnake;
    });
  }, [direction, food, gameOver, isGameStarted, generateFood]);

  useInterval(moveSnake, (gameOver || !isGameStarted) ? null : GAME_SPEED);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }
      
      if (!isGameStarted && e.key === 'Enter') {
        setIsGameStarted(true);
        return;
      }

      if (gameOver && e.key === 'Enter') {
        resetGame();
        return;
      }

      if (!isGameStarted || gameOver) return;

      setDirection(prev => {
        let newDir = prev;
        switch (e.key) {
          case 'ArrowUp': case 'w': case 'W': newDir = { x: 0, y: -1 }; break;
          case 'ArrowDown': case 's': case 'S': newDir = { x: 0, y: 1 }; break;
          case 'ArrowLeft': case 'a': case 'A': newDir = { x: -1, y: 0 }; break;
          case 'ArrowRight': case 'd': case 'D': newDir = { x: 1, y: 0 }; break;
        }
        const lastDir = lastDirectionRef.current;
        if (newDir.x === -lastDir.x && newDir.y === -lastDir.y) {
          return prev;
        }
        return newDir;
      });
    };
    window.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGameStarted, gameOver]);

  // Music Player Effects & Handlers
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(console.error);
      }
      setIsPlaying(!isPlaying);
    }
  };

  const nextTrack = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
  };

  const prevTrack = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
  };

  useEffect(() => {
    if (isPlaying && audioRef.current) {
      audioRef.current.play().catch(console.error);
    }
  }, [currentTrackIndex, isPlaying]);

  return (
    <div className="min-h-screen bg-[#050505] text-[#00ffff] flex flex-col items-center justify-between p-4 md:p-8 font-['VT323'] overflow-hidden screen-tear relative">
      <div className="static-noise" />
      <div className="scanline" />
      <div className="absolute inset-0 crt-grid pointer-events-none" />

      {/* Header */}
      <header className="w-full max-w-4xl flex justify-between items-end py-4 border-b-4 border-[#ff00ff] z-10">
        <div className="flex items-center gap-4">
          <Terminal size={32} className="text-[#ff00ff]" />
          <h1 className="text-4xl md:text-5xl font-black tracking-widest glitch-text" data-text="SYSTEM.SNAKE_PROTOCOL">
            SYSTEM.SNAKE_PROTOCOL
          </h1>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-lg text-[#ff00ff] tracking-widest mb-1">DATA_EXTRACTED</span>
          <div className="text-4xl font-bold drop-shadow-[0_0_8px_#00ffff]">
            {score.toString().padStart(4, '0')}
          </div>
        </div>
      </header>

      {/* Main Game Area */}
      <main className="flex-1 flex items-center justify-center w-full my-6 z-10">
        <div className="relative p-2 bg-[#050505] border-4 border-[#00ffff] shadow-[0_0_20px_rgba(0,255,255,0.4)]">
          
          <div className="bg-[#050505] p-1">
            <div
              className="grid gap-[1px] bg-[#ff00ff]/20 border-2 border-[#ff00ff]/50"
              style={{
                gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
                width: 'min(80vw, 500px)',
                height: 'min(80vw, 500px)'
              }}
            >
              {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
                const x = i % GRID_SIZE;
                const y = Math.floor(i / GRID_SIZE);
                const isSnake = snake.some(segment => segment.x === x && segment.y === y);
                const isHead = snake[0].x === x && snake[0].y === y;
                const isFood = food.x === x && food.y === y;

                return (
                  <div
                    key={i}
                    className={`w-full h-full transition-none ${
                      isHead
                        ? 'bg-[#00ffff] shadow-[0_0_10px_#00ffff] z-10 relative'
                        : isSnake
                        ? 'bg-[#00ffff] opacity-80'
                        : isFood
                        ? 'bg-[#ff00ff] shadow-[0_0_15px_#ff00ff] animate-pulse'
                        : 'bg-transparent'
                    }`}
                  />
                );
              })}
            </div>
          </div>

          {/* Overlays */}
          {gameOver && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#050505]/90 border-4 border-[#ff00ff] z-20 backdrop-blur-sm">
              <h2 
                className="text-6xl md:text-8xl text-[#ff00ff] mb-4 drop-shadow-[0_0_15px_#ff00ff] tracking-widest glitch-text glitch-text-magenta"
                data-text="CRITICAL_FAILURE"
              >
                CRITICAL_FAILURE
              </h2>
              <p className="text-[#00ffff] mb-8 text-2xl tracking-widest">YIELD: <span className="text-[#ff00ff] font-bold">{score}</span></p>
              <button
                onClick={resetGame}
                className="group flex items-center gap-3 px-8 py-4 bg-[#050505] border-2 border-[#00ffff] text-[#00ffff] hover:bg-[#00ffff] hover:text-[#050505] transition-none shadow-[0_0_15px_rgba(0,255,255,0.5)] text-3xl tracking-widest uppercase"
              >
                <span className="glitch-text" data-text="EXECUTE: REBOOT">EXECUTE: REBOOT</span>
              </button>
            </div>
          )}
          {!isGameStarted && !gameOver && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#050505]/90 border-4 border-[#00ffff] z-20 backdrop-blur-sm">
              <button
                onClick={() => setIsGameStarted(true)}
                className="px-10 py-4 bg-[#050505] border-2 border-[#ff00ff] text-[#ff00ff] hover:bg-[#ff00ff] hover:text-[#050505] transition-none shadow-[0_0_20px_rgba(255,0,255,0.5)] text-4xl tracking-widest uppercase mb-8"
              >
                <span className="glitch-text glitch-text-magenta" data-text="EXECUTE: INIT">EXECUTE: INIT</span>
              </button>
              <p className="text-[#00ffff] text-xl tracking-widest animate-pulse">AWAITING_INPUT...</p>
              <div className="flex gap-4 mt-8">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 border-2 border-[#00ffff] flex items-center justify-center text-xl text-[#00ffff]">W</div>
                  <div className="flex gap-2">
                    <div className="w-10 h-10 border-2 border-[#00ffff] flex items-center justify-center text-xl text-[#00ffff]">A</div>
                    <div className="w-10 h-10 border-2 border-[#00ffff] flex items-center justify-center text-xl text-[#00ffff]">S</div>
                    <div className="w-10 h-10 border-2 border-[#00ffff] flex items-center justify-center text-xl text-[#00ffff]">D</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer Music Player */}
      <footer className="w-full max-w-4xl bg-[#050505] border-4 border-[#00ffff] p-4 md:p-6 shadow-[0_0_30px_rgba(0,255,255,0.2)] flex flex-col md:flex-row items-center justify-between gap-6 z-10 relative">
        
        <div className="flex items-center gap-4 w-full md:w-1/3">
          <div className="relative w-16 h-16 border-2 border-[#ff00ff] flex items-center justify-center shrink-0 bg-[#050505]">
            <div 
              className="absolute inset-2 border border-[#00ffff]"
              style={{ 
                animation: isPlaying ? 'spin 2s steps(4) infinite' : 'none' 
              }} 
            />
            <div className="w-4 h-4 bg-[#ff00ff]" />
          </div>
          <div className="overflow-hidden">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm text-[#050505] bg-[#00ffff] px-2 py-0.5 tracking-widest uppercase">
                SIGNAL_INTERCEPT
              </span>
              {isPlaying && (
                <div className="flex gap-1 items-end h-4">
                  <div className="w-1 bg-[#ff00ff] animate-[bounce_0.5s_infinite_0.1s]" style={{ height: '60%' }} />
                  <div className="w-1 bg-[#ff00ff] animate-[bounce_0.5s_infinite_0.3s]" style={{ height: '100%' }} />
                  <div className="w-1 bg-[#ff00ff] animate-[bounce_0.5s_infinite_0.2s]" style={{ height: '40%' }} />
                </div>
              )}
            </div>
            <p className="text-xl truncate text-[#00ffff] tracking-widest">
              {TRACKS[currentTrackIndex].title}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-8 w-full md:w-1/3">
          <button 
            onClick={prevTrack} 
            className="text-[#ff00ff] hover:text-[#00ffff] hover:scale-110 transition-none"
          >
            <SkipBack size={32} fill="currentColor" />
          </button>
          <button
            onClick={togglePlay}
            className="w-16 h-16 flex items-center justify-center border-2 border-[#00ffff] text-[#00ffff] hover:bg-[#00ffff] hover:text-[#050505] transition-none shadow-[0_0_15px_rgba(0,255,255,0.3)]"
          >
            {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
          </button>
          <button 
            onClick={nextTrack} 
            className="text-[#ff00ff] hover:text-[#00ffff] hover:scale-110 transition-none"
          >
            <SkipForward size={32} fill="currentColor" />
          </button>
        </div>

        <div className="flex items-center gap-4 w-full md:w-1/3 justify-end">
          <button onClick={() => setVolume(v => v === 0 ? 0.5 : 0)} className="text-[#00ffff] hover:text-[#ff00ff] transition-none">
            {volume === 0 ? <VolumeX size={28} /> : <Volume2 size={28} />}
          </button>
          <div className="relative w-32 h-4 border-2 border-[#00ffff] bg-[#050505] cursor-pointer flex items-center">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div 
              className="h-full bg-[#ff00ff]"
              style={{ width: `${volume * 100}%` }}
            />
          </div>
        </div>

        <audio
          ref={audioRef}
          src={TRACKS[currentTrackIndex].url}
          onEnded={nextTrack}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
      </footer>
    </div>
  );
}
