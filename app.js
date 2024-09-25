const express = require('express');
const app = express();
const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');
const uuidv4 = require('uuid').v4;

// Connect to SQLite database
const db = new sqlite3.Database('todo.db');

// Create tables if they don't exist
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT,
    password TEXT
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    title TEXT,
    description TEXT,
    status TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Authentication middleware
const authenticate = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) return res.status(401).send({ error: 'Unauthorized' });
  jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
    if (err) return res.status(401).send({ error: 'Invalid token' });
    req.user = decoded;
    next();
  });
};

// API routes
app.post('/signup', (req, res) => {
  const { name, email, password } = req.body;
  const id = uuidv4();
  db.run(`
    INSERT INTO users (id, name, email, password)
    VALUES (?, ?, ?, ?);
  `, id, name, email, password, (err) => {
    if (err) return res.status(500).send({ error: 'Failed to create user' });
    res.send({ message: 'User created successfully' });
  });
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  db.get(`
    SELECT * FROM users
    WHERE email = ? AND password = ?;
  `, email, password, (err, user) => {
    if (err || !user) return res.status(401).send({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id }, process.env.SECRET_KEY, { expiresIn: '1h' });
    res.send({ token });
  });
});

app.get('/tasks', authenticate, (req, res) => {
  db.all(`
    SELECT * FROM tasks
    WHERE user_id = ?;
  `, req.user.id, (err, tasks) => {
    if (err) return res.status(500).send({ error: 'Failed to retrieve tasks' });
    res.send(tasks);
  });
});

app.post('/tasks', authenticate, (req, res) => {
  const { title, description, status } = req.body;
  const id = uuidv4();
  db.run(`
    INSERT INTO tasks (id, user_id, title, description, status)
    VALUES (?, ?, ?, ?, ?);
  `, id, req.user.id, title, description, status, (err) => {
    if (err) return res.status(500).send({ error: 'Failed to create task' });
    res.send({ message: 'Task created successfully' });
  });
});

app.put('/tasks/:id', authenticate, (req, res) => {
  const { title, description, status } = req.body;
  db.run(`
    UPDATE tasks
    SET title = ?, description = ?, status = ?
    WHERE id = ? AND user_id = ?;
  `, title, description, status, req.params.id, req.user.id, (err) => {
    if (err) return res.status(500).send({ error: 'Failed to update task' });
    res.send({ message: 'Task updated successfully' });
  });
});

app.delete('/tasks/:id', authenticate, (req, res) => {
  db.run(`
    DELETE FROM tasks
    WHERE id = ? AND user_id = ?;
  `, req.params.id, req.user.id, (err) => {
    if (err) return res.status(500).send({ error: 'Failed to delete task' });
    res.send({ message: 'Task deleted successfully' });
  });
});

app.get('/profile', authenticate, (req, res) => {
  db.get(`
    SELECT * FROM users
    WHERE id = ?;
  `, req.user.id, (err, user) => {
    if (err) return res.status(500).send({ error: 'Failed to retrieve profile' });
    res.send(user
