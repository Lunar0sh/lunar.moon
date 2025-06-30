// database.js
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./lunar.db', (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        // Create users table if it doesn't exist
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            api_key TEXT
        )`, (err) => {
            if (err) {
                console.error("Error creating table", err.message);
            }
        });
    }
});

module.exports = db;