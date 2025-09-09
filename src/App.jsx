
import React, { useState, useRef, useEffect } from "react";
import "./App.css";

function App() {
  const [activePage, setActivePage] = useState("home");
  const [playlist, setPlaylist] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [librarySongs, setLibrarySongs] = useState([]);
  const [currentSongIndex, setCurrentSongIndex] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [recentSearches, setRecentSearches] = useState([]);

  const audioRef = useRef(null);

  const songs = [
    {
      id: 1,
      title: "Thuli Thuli BGM",
      artist: "Yuvan Shankar Raja",
      genre: "Love BGM",
      duration: "2:45",
      image:
        "https://m.media-amazon.com/images/M/MV5BZmM3NDRlNjgtN2VlNy00OGQyLWI1NGItMjk2ZjM1YmQ2ZTdmXkEyXkFqcGc@._V1_.jpg",
      audio: "https://pagalworld.com.se/files/download/id/1464",
    },
    // ... rest of your songs (2-10)
  ];

  const togglePlaylist = (song) => {
    if (playlist.find((s) => s.id === song.id)) {
      setPlaylist(playlist.filter((s) => s.id !== song.id));
    } else {
      setPlaylist([...playlist, song]);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery) return;

    setRecentSearches((prev) =>
      prev.includes(searchQuery) ? prev : [...prev, searchQuery]
    );

    const localMatches = librarySongs.filter(
      (song) =>
        song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        song.artist.toLowerCase().includes(searchQuery.toLowerCase())
    );

    let onlineMatches = [];
    try {
      const response = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(
          searchQuery
        )}&entity=song&limit=10`
      );
      const data = await response.json();
      onlineMatches = data.results.map((item) => ({
        id: item.trackId,
        title: item.trackName,
        artist: item.artistName,
        genre: item.primaryGenreName,
        image: item.artworkUrl100,
        audio: item.previewUrl,
      }));
    } catch (error) {
      console.error("Error fetching from iTunes:", error);
    }

    setSearchResults([...localMatches, ...onlineMatches]);
    setActivePage("search");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  const clearHistory = () => setRecentSearches([]);

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const newSongs = files.map((file, index) => ({
      id: `local-${index}-${file.name}`,
      title: file.name.replace(/\.[^/.]+$/, ""),
      artist: "Local File",
      genre: "Unknown",
      image: "https://via.placeholder.com/100",
      audio: URL.createObjectURL(file),
    }));
    setLibrarySongs([...librarySongs, ...newSongs]);
  };

  const playSong = (songList, index) => {
    setCurrentSongIndex({ list: songList, index });
    setIsPlaying(true);
  };

  const playNext = () => {
    if (!currentSongIndex) return;
    const { list, index } = currentSongIndex;
    const newIndex = (index + 1) % list.length;
    setCurrentSongIndex({ list, index: newIndex });
    setIsPlaying(true);
  };

  const playPrevious = () => {
    if (!currentSongIndex) return;
    const { list, index } = currentSongIndex;
    const newIndex = (index - 1 + list.length) % list.length;
    setCurrentSongIndex({ list, index: newIndex });
    setIsPlaying(true);
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleVolumeChange = (e) => {
    const newVolume = e.target.value;
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      setProgress((audio.currentTime / audio.duration) * 100 || 0);
      setCurrentTime(audio.currentTime);
      setDuration(audio.duration);
    };

    audio.addEventListener("timeupdate", updateProgress);
    return () => audio.removeEventListener("timeupdate", updateProgress);
  }, [currentSongIndex]);

  const handleSeek = (e) => {
    const newTime = (e.target.value / 100) * audioRef.current.duration;
    audioRef.current.currentTime = newTime;
    setProgress(e.target.value);
  };

  const formatTime = (secs) => {
    if (isNaN(secs)) return "0:00";
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const currentSong =
    currentSongIndex && currentSongIndex.list[currentSongIndex.index];

  // 🎹 Keyboard shortcuts (space works in search now)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = document.activeElement.tagName.toLowerCase();
      if (tag === "input" || tag === "textarea") return; // Ignore typing
      if (!currentSong) return;

      switch (e.key.toLowerCase()) {
        case " ":
          e.preventDefault();
          togglePlayPause();
          break;
        case "arrowright":
          playNext();
          break;
        case "arrowleft":
          playPrevious();
          break;
        case "arrowup":
          setVolume((v) => {
            const newV = Math.min(1, v + 0.1);
            if (audioRef.current) audioRef.current.volume = newV;
            return newV;
          });
          break;
        case "arrowdown":
          setVolume((v) => {
            const newV = Math.max(0, v - 0.1);
            if (audioRef.current) audioRef.current.volume = newV;
            return newV;
          });
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentSong, isPlaying]);

  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.play().catch((err) =>
        console.warn("Autoplay blocked, user interaction needed:", err)
      );
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, currentSong]);

  const renderSongs = (list, source) => (
    <div className={source === "playlist" ? "playlist-list" : "songs-grid"}>
      {list.map((song, index) => {
        const isCurrent = currentSong && currentSong.id === song.id;
        return (
          <div
            key={song.id}
            className={source === "playlist" ? "playlist-item" : "song-card"}
          >
            {source !== "playlist" && (
              <img src={song.image} alt={song.title} className="song-image" />
            )}
            <div>
              <h3>{song.title}</h3>
              <p>{song.artist}</p>
              <p>{song.genre}</p>
            </div>
            <div className="card-buttons">
              <button
                onClick={() =>
                  isCurrent ? togglePlayPause() : playSong(list, index)
                }
              >
                {isCurrent && isPlaying ? "⏸" : "▶"}
              </button>
              <button
                className={
                  playlist.find((s) => s.id === song.id) ? "remove-btn" : "add-btn"
                }
                onClick={() => togglePlaylist(song)}
              >
                {playlist.find((s) => s.id === song.id) ? "Remove" : "Add"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="app">
      {/* Sidebar */}
      <div className="sidebar">
        <center>
          <h2>
            <b>Music Player</b>
          </h2>
        </center>
        <center>
          <hr />
        </center>

        <ul className="sidebar-menu">
          <li
            className={activePage === "home" ? "active" : ""}
            onClick={() => setActivePage("home")}
          >
            Home
          </li>
          <li
            className={activePage === "library" ? "active" : ""}
            onClick={() => setActivePage("library")}
          >
            Your Library
          </li>
          <li
            className={activePage === "playlist" ? "active" : ""}
            onClick={() => setActivePage("playlist")}
          >
            Playlist
          </li>
          <li
            className={activePage === "search" ? "active" : ""}
            onClick={() => setActivePage("search")}
          >
            Search
          </li>
        </ul>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="search-section">
          <input
            type="text"
            placeholder="Search local + online..."
            className="search-bar"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyPress}
          />
          <button onClick={handleSearch}>Search</button>
          {recentSearches.length > 0 && (
            <div className="recent-searches">
              <div className="history-header">
                <span>Recent:</span>
                <button onClick={clearHistory}>❌</button>
              </div>
              <ul>
                {recentSearches.map((item, i) => (
                  <li key={i} onClick={() => setSearchQuery(item)}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {activePage === "home" && (
          <>
            <h2>Famous Tamil Love BGMs</h2>
            {renderSongs(songs, "home")}
          </>
        )}

        {activePage === "search" && (
          <>
            <h2>Search Results</h2>
            {renderSongs(searchResults, "search")}
          </>
        )}

        {activePage === "playlist" && (
          <>
            <h2>Your Playlist</h2>
            {renderSongs(playlist, "playlist")}
          </>
        )}

        {activePage === "library" && (
          <>
            <h2>Your Library</h2>
            <input type="file" multiple accept="audio/*" onChange={handleFileUpload} />
            {renderSongs(librarySongs, "library")}
          </>
        )}
      </div>

      {/* Bottom Player */}
      {currentSong && (
        <div className="bottom-player">
          <img src={currentSong.image} alt="cover" />
          <div className="song-info">
            <h4>{currentSong.title}</h4>
            <p>{currentSong.artist}</p>
          </div>
          <div className="controls">
            <button onClick={playPrevious}>⏮</button>
            <button onClick={togglePlayPause}>{isPlaying ? "⏸" : "▶"}</button>
            <button onClick={playNext}>⏭</button>
          </div>

          <div className="progress-container">
            <span>{formatTime(currentTime)}</span>
            <input type="range" min="0" max="100" value={progress} onChange={handleSeek} />
            <span>{formatTime(duration)}</span>
          </div>

          <div className="volume-control">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
            />
          </div>
          <audio ref={audioRef} src={currentSong.audio} onEnded={playNext} />
        </div>
      )}
    </div>
  );
}

export default App;
