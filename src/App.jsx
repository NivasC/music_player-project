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
      title: "Bol Do Na Zara",
      artist: "Armaan Malik",
      genre: "Romantic",
      duration: "4:32",
      image: "https://i.scdn.co/image/ab67616d0000b273d45f4db15bf95dc2da233c78",
      audio: "https://pagalworld.com.se/files/download/id/646",
    },
    {
      id: 2,
      title: "Chaleya",
      artist: "Arijit Singh",
      genre: "Romantic",
      duration: "7:05",
      image: "https://i.scdn.co/image/ab67616d0000b2731f0bb9d93926ab9dd98ec605",
      audio: "https://pagalworld.com.se/files/download/id/1446",
    },
  ];

  // Add or remove song from playlist
  const togglePlaylist = (song) => {
    if (playlist.find((s) => s.id === song.id)) {
      setPlaylist(playlist.filter((s) => s.id !== song.id));
    } else {
      setPlaylist([...playlist, song]);
    }
  };

  // 🔎 Handle search (Local + Online)
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

  // Local file uploads
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

  // Play song
  const playSong = (songList, index) => {
    setCurrentSongIndex({ list: songList, index });
    setIsPlaying(true);
  };

  // Next & Previous
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

  // Play / Pause
  const togglePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Volume
  const handleVolumeChange = (e) => {
    const newVolume = e.target.value;
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  // Progress + Time Updates
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

  // Seek
  const handleSeek = (e) => {
    const newTime = (e.target.value / 100) * audioRef.current.duration;
    audioRef.current.currentTime = newTime;
    setProgress(e.target.value);
  };

  // Format seconds -> mm:ss
  const formatTime = (secs) => {
    if (isNaN(secs)) return "0:00";
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const currentSong =
    currentSongIndex && currentSongIndex.list[currentSongIndex.index];

  const renderSongs = (list, source) => (
    <div className={source === "playlist" ? "playlist-list" : "songs-grid"}>
      {list.map((song, index) => (
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
            <button onClick={() => playSong(list, index)}>▶</button>
            <button
              className={
                playlist.find((s) => s.id === song.id) ? "remove-btn" : "add-btn"
              }
              onClick={() => togglePlaylist(song)}
            >
              {playlist.find((s) => s.id === song.id) ? "Remove" : " Add"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="app">
      {/* Sidebar */}
      <div className="sidebar">
        <b>
          <center><h2><b>Music Player</b></h2></center>
          <center><hr></hr></center>
          
          <ul className="sidebar-menu">
            <li onClick={() => setActivePage("home")}>Home</li>
            <li onClick={() => setActivePage("library")}> Your Library</li>
            <li onClick={() => setActivePage("playlist")}> Playlist</li>
            <li onClick={() => setActivePage("search")}>Search</li>
          </ul>
        </b>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Search Section */}
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
            <h2>Featured Songs</h2>
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
            <input
              type="file"
              multiple
              accept="audio/*"
              onChange={handleFileUpload}
            />
            {renderSongs(librarySongs, "library")}
          </>
        )}
      </div>

      {/* Bottom Player - only show when playing */}
      {currentSong && isPlaying && (
        <div className="bottom-player">
          <img src={currentSong.image} alt="cover" />
          <div className="song-info">
            <h4>{currentSong.title}</h4>
            <p>{currentSong.artist}</p>
          </div>
          <div className="controls">
            <button onClick={playPrevious}>⏮</button>
            <button onClick={togglePlayPause}>
              {isPlaying ? "⏸" : "▶"}
            </button>
            <button onClick={playNext}>⏭</button>
          </div>

          {/* Progress with Time */}
          <div className="progress-container">
            <span>{formatTime(currentTime)}</span>
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={handleSeek}
            />
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
          <audio
            ref={audioRef}
            src={currentSong.audio}
            autoPlay={isPlaying}
            onEnded={playNext}
          />
        </div>
      )}
    </div>
  );
}

export default App;
