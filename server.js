// server.js
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./database.js');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'ein-sehr-geheimer-schluessel-den-niemand-erraten-kann'; // Ändern Sie dies in einem echten Projekt!

// Middleware
app.use(cors()); // Erlaubt Anfragen von Ihrem Frontend
app.use(express.json()); // Erlaubt uns, JSON-Daten zu lesen
app.use(express.static('public')); // Liefert die Frontend-Dateien (index.html, etc.) aus

// --- API Endpunkte ---

// 1. Registrierung eines neuen Benutzers
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }

    // Passwort wird sicher gehasht (niemals als Klartext speichern!)
    const password_hash = await bcrypt.hash(password, 10);

    const sql = 'INSERT INTO users (username, password_hash) VALUES (?, ?)';
    db.run(sql, [username, password_hash], function(err) {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ message: 'Username already exists or server error.' });
        }
        res.status(201).json({ message: 'User registered successfully', userId: this.lastID });
    });
});

// 2. Login eines bestehenden Benutzers
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const sql = 'SELECT * FROM users WHERE username = ?';

    db.get(sql, [username], async (err, user) => {
        if (err || !user) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        // Vergleiche das eingegebene Passwort mit dem gespeicherten Hash
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        // Erstelle ein "Ticket" (JWT), das beweist, dass der Nutzer eingeloggt ist
        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ message: 'Login successful', token: token });
    });
});

// 3. Middleware zum Schutz von Routen
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

    if (token == null) return res.sendStatus(401); // Kein Token

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403); // Ungültiger Token
        req.user = user;
        next();
    });
};

// 4. Speichern des API Keys (geschützte Route)
app.post('/api/save-key', authenticateToken, (req, res) => {
    const { apiKey } = req.body;
    const userId = req.user.id; // ID aus dem authentifizierten Token

    const sql = 'UPDATE users SET api_key = ? WHERE id = ?';
    db.run(sql, [apiKey, userId], (err) => {
        if (err) {
            return res.status(500).json({ message: 'Error saving API key.' });
        }
        res.json({ message: 'API key saved successfully.' });
    });
});

// 5. Abrufen der Nutzerdaten (geschützte Route)
app.get('/api/user-data', authenticateToken, (req, res) => {
    const userId = req.user.id;
    const sql = 'SELECT username, api_key FROM users WHERE id = ?';

    db.get(sql, [userId], (err, row) => {
        if (err || !row) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.json(row);
    });
});


// Server starten
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});