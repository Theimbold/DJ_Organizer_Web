const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const ffmpegPath = process.env.FFMPEG_PATH || ffmpegInstaller.path;
const musicMetadata = require('music-metadata');
const db = require('./database');
const { WebSocketServer } = require('ws');
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);

const app = express();
const port = 3001;

// --- Directory Setup ---
const uploadDir = path.join(__dirname, 'uploads');
const processedDir = path.join(__dirname, 'processed');
const coversDir = path.join(processedDir, 'covers');
[uploadDir, processedDir, coversDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use('/processed', express.static(processedDir));

// --- Multer Configuration ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage: storage });

// --- WebSocket Server Setup ---
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Server listening at http://0.0.0.0:${port}`);
});

const wss = new WebSocketServer({ server });

const clients = new Set();
wss.on('connection', (ws) => {
  console.log('Client connected');
  clients.add(ws);
  ws.on('close', () => {
    console.log('Client disconnected');
    clients.delete(ws);
  });
});

function broadcast(message) {
  for (const client of clients) {
    if (client.readyState === 1) { // 1 is OPEN
      client.send(JSON.stringify(message));
    }
  }
}

// --- File Processing Logic ---
const processFile = async (file) => {
  const { path: filePath, originalname, size } = file;
  console.log(`Processing ${originalname}...`);

  try {
    const metadata = await musicMetadata.parseFile(filePath);
    const common = metadata.common;
    
    let coverPath = null;
    let cover_url = null;
    if (common.picture && common.picture.length > 0) {
      const picture = common.picture[0];
      const coverFileName = `${Date.now()}-cover.jpg`;
      coverPath = path.join(coversDir, coverFileName);
      fs.writeFileSync(coverPath, picture.data);
      cover_url = `/processed/covers/${coverFileName}`;
    }

    const mp3FileName = `${path.parse(originalname).name}-${Date.now()}.mp3`;
    const mp3Path = path.join(processedDir, mp3FileName);
    const mp3_url = `/processed/${mp3FileName}`;

    ffmpeg(filePath)
      .output(mp3Path)
      .audioBitrate(192)
      .on('progress', (progress) => {
        if (progress.percent) {
          broadcast({
            type: 'conversion_progress',
            data: {
              filename: originalname,
              percent: progress.percent
            }
          });
        }
      })
      .on('end', () => {
        console.log(`${originalname} converted to MP3.`);
        
        const stmt = db.prepare(`INSERT INTO tracks 
          (title, artist, album, duration, original_filename, file_size, original_path, mp3_path, cover_path) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, function(err) {
            if (err) {
              console.error('DB insert preparation error:', err.message);
              broadcast({ type: 'conversion_error', data: { filename: originalname, error: err.message } });
              return;
            }

            stmt.run(
              common.title || path.parse(originalname).name,
              common.artist,
              common.album,
              metadata.format.duration,
              originalname,
              size,
              filePath,
              mp3Path,
              coverPath
            , (runErr) => {
                if(runErr) {
                    console.error('DB insert run error:', runErr.message);
                    return;
                }

                const newTrackData = {
                  id: this.lastID,
                  title: common.title || path.parse(originalname).name,
                  artist: common.artist,
                  album: common.album,
                  duration: metadata.format.duration,
                  original_filename: originalname,
                  status: 'unrated',
                  genre: null,
                  mood: null,
                  mp3_url: mp3_url,
                  cover_url: cover_url,
                };
                broadcast({ type: 'conversion_complete', data: newTrackData });
            });
            stmt.finalize();
          });
        
        // Original file can now be deleted to save space
        fs.unlink(filePath, (err) => {
            if (err) console.error(`Error deleting original file ${filePath}:`, err);
        });
      })
      .on('error', (err) => {
        console.error(`Error converting ${originalname}:`, err.message);
        broadcast({ type: 'conversion_error', data: { filename: originalname, error: err.message } });
      })
      .run();

  } catch (error) {
    console.error(`Error processing file ${originalname}:`, error.message);
  }
};

// --- API Endpoints ---
app.post('/upload', upload.array('tracks', 100), (req, res) => {
  console.log(`${req.files.length} files received.`);
  res.status(200).json({ message: `${req.files.length} files uploaded. Processing started.` });

  for (const file of req.files) {
    processFile(file);
  }
});

app.get('/api/files', (req, res) => {
  db.all("SELECT original_filename, file_size FROM tracks", [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.status(200).json(rows);
  });
});

app.get('/tracks', (req, res) => {
  db.all("SELECT id, title, artist, album, duration, status, genre, mood, original_filename, file_size, replace(mp3_path, '\\\\', '/') as mp3_path, replace(cover_path, '\\\\', '/') as cover_path FROM tracks", [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    const tracks = rows.map(row => ({
      ...row,
      mp3_url: row.mp3_path ? `/processed/${path.basename(row.mp3_path)}` : null,
      cover_url: row.cover_path ? `/processed/covers/${path.basename(row.cover_path)}` : null,
    }));
    res.status(200).json(tracks);
  });
});

app.put('/tracks/:id', (req, res) => {
  const { id } = req.params;
  const { title, artist, album, status, genre, mood } = req.body;
  
  db.run(`UPDATE tracks SET 
    title = COALESCE(?, title),
    artist = COALESCE(?, artist),
    album = COALESCE(?, album),
    status = COALESCE(?, status),
    genre = COALESCE(?, genre),
    mood = COALESCE(?, mood)
    WHERE id = ?`,
    [title, artist, album, status, genre, mood, id],
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.status(200).json({ message: 'Track updated successfully', changes: this.changes });
    }
  );
});

app.delete('/tracks/:id', (req, res) => {
  const { id } = req.params;

  db.get("SELECT original_path, mp3_path, cover_path FROM tracks WHERE id = ?", [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (row) {
        [row.original_path, row.mp3_path, row.cover_path].forEach(filePath => {
          if (filePath && fs.existsSync(filePath)) {
            fs.unlink(filePath, (unlinkErr) => {
              if (unlinkErr) console.error(`Error deleting file ${filePath}:`, unlinkErr);
            });
          }
        });
    }

    db.run("DELETE FROM tracks WHERE id = ?", [id], function (deleteErr) {
      if (deleteErr) {
        res.status(500).json({ error: deleteErr.message });
        return;
      }
      if (this.changes === 0) {
        return res.status(404).json({ message: 'Track not found' });
      }
      res.status(200).json({ message: 'Track deleted successfully' });
    });
  });
});

// --- Serve Static Frontend (Production) ---
const distDir = path.join(__dirname, '../dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get(/.*/, (req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}
