import { createContext, useContext, useState, useRef, useEffect } from 'react';

const PlayerContext = createContext();

export const PlayerProvider = ({ children }) => {
  // Состояние плеера
  const [currentTrack, setCurrentTrack] = useState(null); 
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 100
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  
  // Аудио элемент
  const audioRef = useRef(null);

  // Запуск трека (текста)
  const playTrack = (track, audioUrl) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    const audio = new Audio(audioUrl);
    audio.playbackRate = playbackRate;
    audioRef.current = audio;
    
    setCurrentTrack(track);
    setIsPlaying(true);

    // Подписки на события
    audio.onplay = () => setIsPlaying(true);
    audio.onpause = () => setIsPlaying(false);
    audio.onended = () => {
      setIsPlaying(false);
      setProgress(100);
    };
    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime);
      setDuration(audio.duration || 0);
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };
    
    audio.play();
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play();
    }
  };

  const seek = (percent) => {
    if (audioRef.current && duration) {
      const newTime = (percent / 100) * duration;
      audioRef.current.currentTime = newTime;
      setProgress(percent);
    }
  };

  const changeSpeed = () => {
    const speeds = [1.0, 1.25, 1.5, 2.0, 0.8];
    const currentIndex = speeds.indexOf(playbackRate);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    
    setPlaybackRate(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  return (
    <PlayerContext.Provider value={{
      currentTrack,
      isPlaying,
      progress,
      currentTime,
      duration,
      playbackRate,
      playTrack,
      togglePlay,
      seek,
      changeSpeed
    }}>
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => useContext(PlayerContext);
