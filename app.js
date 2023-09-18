const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const corsMiddleware = require('./cors-config.js');
app.use(corsMiddleware);
app.use(bodyParser.json());
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'admin',
  database: 'project-management',
});

const config = {
    sessionSecret: "0c64f408e08d6abf84ca8eb7179c5078e44117d2a2f11a86cd2a862d67d8d949" // Your secret key
  };
  
app.use(
    session({
      secret: config.sessionSecret,
      resave: false,
      saveUninitialized: true,
    })
  );
db.connect((err) => {
  if (err) {
    console.error('Error connecting to the database: ' + err.stack);
    return;
  }
  console.log('Connected to the database as ID ' + db.threadId);
});
function authenticateUser(username, password, callback) {
    const query = 'SELECT * FROM users WHERE username = ? AND password_hash = ?';
    db.query(query, [username, password], (err, results) => {
      if (err) {
        console.error('Error during authentication: ' + err);
        callback(err, null);
      } else {
        if (results.length > 0) {
          callback(null, true);
        } else {
          callback(null, false);
        }
      }
    });
  }
  app.post('/register', (req, res) => {
    const { username, password } = req.body;
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(password, salt, (err, hash) => {
        if (err) {
          console.error('Error hashing password: ' + err);
          res.status(500).json({ message: 'Registration failed' });
          return;
        }
        const query = 'INSERT INTO users (username, password_hash) VALUES (?, ?)';
        db.query(query, [username, hash], (err, results) => {
          if (err) {
            console.error('Error registering user: ' + err);
            res.status(500).json({ message: 'Registration failed' });
            return;
          }
          console.log('User registered successfully');
          res.status(200).json({ message: 'Registration successful' });
        });
      });
    });
  });
  
  app.post('/login', (req, res) => {
    const { username, password } = req.body;
    authenticateUser(username, password, (err, isAuthenticated) => {
      if (err) {
        res.status(500).json({ success: false, message: 'Internal Server Error' });
      } else if (isAuthenticated) {
        req.session.user = { username: username };
        res.status(200).json({ success: true, message: 'Login successful' });
      } else {
        res.status(401).json({ success: false, message: 'Login failed' });
      }
    });
  });
const fs = require('fs');
app.post('/create-project', upload.single('attachments'), (req, res) => {
  const {
    name,
    client,
    start_date,
    end_date,
    assigned_manager,
    remarks,
  } = req.body;
  if (req.file && fs.existsSync(req.file.path)) {
    const fileData = fs.readFileSync(req.file.path);
    const insertQuery =
      'INSERT INTO projects (name, client, start_date, end_date, assigned_manager, attachments, remarks) VALUES (?, ?, ?, ?, ?, ?, ?)';
    db.query(
      insertQuery,
      [
        name,
        client,
        start_date,
        end_date,
        assigned_manager,
        fileData,
        remarks,
      ],
      (err, results) => {
        if (err) {
          console.error('Error creating project: ' + err);
          res.status(500).json({ message: 'Internal Server Error' });
          return;
        }
        console.log('Project created successfully');
        res
          .status(201)
          .json({ id: results.insertId, message: 'Project created successfully' });
      }
    );
  } else {
    console.error('File does not exist or was not uploaded');
    res.status(400).json({ message: 'Bad Request' });
  }
});
app.get('/project-details', (req, res) => {
  const query = 'SELECT * FROM projects';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching project details: ' + err);
      res.status(500).json({ message: 'Internal Server Error' });
      return;
    }
    res.status(200).json(results);
  });
});
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
