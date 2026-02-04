const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'dj_organizer.sqlite');

// Delete the database file on startup for a clean slate
try {
  fs.unlinkSync(dbPath);
  console.log('Database file deleted successfully.');
} catch (err) {
  if (err.code !== 'ENOENT') {
    console.error('Error deleting database file:', err);
  }
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

// Use serialize to ensure commands are executed in order
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS tracks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    artist TEXT,
    album TEXT,
    duration REAL,
    status TEXT DEFAULT 'unrated',
    genre TEXT,
    mood TEXT,
    original_filename TEXT,
    file_size INTEGER,
    original_path TEXT,
    mp3_path TEXT,
    cover_path TEXT
  )`, (err) => {
    if (err) {
      console.error('Error creating table', err.message);
    }
  });
});

module.exports = db;
