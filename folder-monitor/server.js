const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const watchDir = path.join(__dirname, 'content');

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Function to read directory contents
const readDirectory = (dir) => {
  return fs.readdirSync(dir, { withFileTypes: true }).map((item) => {
    return {
      name: item.name,
      isDirectory: item.isDirectory(),
    };
  });
};

// Watch the directory for changes
const watcher = chokidar.watch(watchDir, { persistent: true });
watcher.on('all', (event, filePath) => {
  console.log(`Event: ${event}, Path: ${filePath}`);

  // Emit directory structure update
  const directoryStructure = readDirectory(watchDir);
  io.emit('update-directory', { path: '/', contents: directoryStructure });

  // Emit file content update if the changed file is not a directory
  if (event === 'change' && !fs.lstatSync(filePath).isDirectory()) {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        console.error('Error reading file:', err);
      } else {
        const relativePath = path.relative(watchDir, filePath);
        io.emit('update-file', { path: relativePath, content: data });
      }
    });
  }
});

// Endpoint to get directory structure at a specific path
app.get('/directory', (req, res) => {
  const dirPath = req.query.path ? path.join(watchDir, req.query.path) : watchDir;
  const directoryStructure = readDirectory(dirPath);
  res.json({ path: req.query.path || '/', contents: directoryStructure });
});

// Endpoint to get file contents
app.get('/file', (req, res) => {
  const filePath = path.join(watchDir, req.query.path);
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.txt') {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        res.status(500).send('Error reading file');
      } else {
        res.send(data);
      }
    });
  } else if (ext === '.pdf' || ext === '.jpg' || ext === '.jpeg' || ext === '.png' || ext === '.gif' || ext === '.mp4' || ext === '.webm') {
    res.sendFile(filePath);
  } else {
    res.status(400).send('Unsupported file type');
  }
});

// Start the server
server.listen(5500, () => {
  console.log('Server is running on http://localhost:5500');
});
