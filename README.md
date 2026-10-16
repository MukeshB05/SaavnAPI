# 🎵 SaavnAPI

**SaavnAPI** is a fast, lightweight REST API wrapper for **JioSaavn** that lets you fetch songs, albums, playlists, artists, and direct download links with ease.

Built for developers who want simple programmatic access to JioSaavn music data.

---

## ✨ Features

- 🔍 Search songs, albums, artists, and playlists  
- 📥 Get high-quality direct song download links  
- 📀 Fetch album metadata and tracklist  
- 📋 Retrieve playlist details  
- 🎤 Artist info and discography  
- ⚡ Fast response and optimized endpoints  
- 🚀 Simple REST API structure  
- 🧩 Easy integration with apps, bots, and websites  

---

## 🙏 Credits

This API is powered by the amazing open-source project:

👉 https://saavn.dev  

Huge thanks to the **saavn.dev** contributors for providing the core infrastructure.

---

## 📦 Installation

```bash
# Clone repository
git clone https://github.com/MukeshB05/SaavnAPI.git

# Enter directory
cd SaavnAPI

# Install dependencies
npm install

# Start server
npm start
```

Server runs by default at:  
**http://localhost:3000**

---

## 🚀 API Endpoints

### 🔍 Search

Search songs, albums, artists, or playlists.

```
GET /search?song=<query>
GET /search?album=<query>
GET /search?playlist=<query>
GET /search?artist=<query>
```

---

### 🎵 Song Details

Get complete song information including download links.

```
GET /song?id=<song_id>
```

---

### 📀 Album Details

Fetch album metadata and tracklist.

```
GET /album?id=<album_id>
```

---

### 📋 Playlist Details

Retrieve playlist information and songs.

```
GET /playlist?id=<playlist_id>
```

---

### 🎤 Artist Details

Get artist profile and discography.

```
GET /artist?id=<artist_id>
```

### 🎤 Lyrics Details

Get lyrics from song Id.

```
GET /songs/{id}/lyrics
```

---

## 📥 Example Response

```json
{
  "title": "Tum Hi Ho",
  "artist": "Arijit Singh",
  "album": "Aashiqui 2",
  "duration": 262,
  "download_url": "https://example.com/song.mp3"
}
```

---

## ⚙️ Configuration

You can change the default port using environment variables:

```bash
PORT=5000 npm start
```

---

## 🧩 Use Cases

- Telegram music bots  
- Discord music bots  
- Music downloader apps  
- Streaming websites  
- Personal music tools  
- Developer experiments with music APIs

---

## ⭐ Support

If you like this project:

- ⭐ Star the repo  
- 🐛 Report issues  
- 💡 Suggest features  
- 🔧 Contribute  

GitHub: https://github.com/MukeshB05/SaavnAPI
