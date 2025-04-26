const express = require('express');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const https = require('https');
const http = require('http');
const fs = require('fs');

// Create Express app
const app = express();
const HTTP_PORT = process.env.HTTP_PORT || 8080;
const HTTPS_PORT = process.env.HTTPS_PORT || 8443;

// SSL Certificate options
let httpsOptions = {
    key: null,
    cert: null
};
try {
    // Try to read SSL certificates if they exist
    httpsOptions.key = fs.readFileSync(path.join(__dirname, 'ssl', 'private-key.pem'));
    httpsOptions.cert = fs.readFileSync(path.join(__dirname, 'ssl', 'certificate.pem'));
} catch (error) {
    console.warn('SSL certificates not found or invalid. HTTPS server will not start.');
    console.warn('See documentation for instructions on generating SSL certificates.');
    console.warn('Continuing with HTTP server only.');
}

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'src/main/resources/static')));

// ESVPProfile enum equivalent
const ESVPProfile = {
    EXPLORER: 'EXPLORER',
    SHOPPER: 'SHOPPER',
    VACATIONER: 'VACATIONER',
    PRISONER: 'PRISONER'
};

// ESVPSessionRepository equivalent
class ESVPSessionRepository {
    constructor() {
        this.sessions = new Map();
        this.sessionsByPinCode = new Map();
    }

    createSession(name) {
        const id = uuidv4();
        const pinCode = this.generatePinCode();
        const session = {
            id,
            name,
            pinCode,
            votes: {}
        };
        this.sessions.set(id, session);
        this.sessionsByPinCode.set(pinCode, id);
        return session;
    }

    findSessionById(id) {
        return this.sessions.get(id) || null;
    }

    findSessionByPinCode(pinCode) {
        const sessionId = this.sessionsByPinCode.get(pinCode);
        if (!sessionId) return null;
        return this.sessions.get(sessionId);
    }

    addVote(sessionId, userId, profile) {
        const session = this.sessions.get(sessionId);
        if (!session) return null;
        session.votes[userId] = profile;
        return session;
    }

    getSessionResults(id) {
        const session = this.sessions.get(id);
        if (!session) return null;

        const results = {};
        results[ESVPProfile.EXPLORER] = 0;
        results[ESVPProfile.SHOPPER] = 0;
        results[ESVPProfile.VACATIONER] = 0;
        results[ESVPProfile.PRISONER] = 0;

        Object.values(session.votes).forEach(profile => {
            results[profile]++;
        });

        return results;
    }

    generatePinCode() {
        let pinCode;
        do {
            const firstPart = Math.floor(Math.random() * 900) + 100;
            const secondPart = Math.floor(Math.random() * 900) + 100;
            pinCode = `${firstPart}-${secondPart}`;
        } while (this.sessionsByPinCode.has(pinCode));
        return pinCode;
    }
}

// MoodSessionRepository for mood-swing application
class MoodSessionRepository {
    constructor() {
        this.sessions = new Map();
        this.sessionsByPinCode = new Map();
    }

    createSession(name) {
        const id = uuidv4();
        const pinCode = this.generatePinCode();
        const session = {
            id,
            name,
            pinCode,
            votes: {}
        };
        this.sessions.set(id, session);
        this.sessionsByPinCode.set(pinCode, id);
        return session;
    }

    findSessionById(id) {
        return this.sessions.get(id) || null;
    }

    findSessionByPinCode(pinCode) {
        const sessionId = this.sessionsByPinCode.get(pinCode);
        if (!sessionId) return null;
        return this.sessions.get(sessionId);
    }

    addVote(sessionId, userId, level) {
        const session = this.sessions.get(sessionId);
        if (!session) return null;
        session.votes[userId] = level;
        return session;
    }

    getSessionResults(id) {
        const session = this.sessions.get(id);
        if (!session) return null;

        const results = {};
        // Initialize all levels with 0
        for (let i = 1; i <= 10; i++) {
            results[i] = 0;
        }

        // Count votes for each level
        Object.values(session.votes).forEach(level => {
            results[level]++;
        });

        return results;
    }

    // Generate a unique pin code in the format "ABC-123" (3 letters, hyphen, 3 numbers)
    generatePinCode() {
        let pinCode;
        do {
            const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            let firstPart = '';
            for (let i = 0; i < 3; i++) {
                firstPart += letters.charAt(Math.floor(Math.random() * letters.length));
            }
            const secondPart = Math.floor(Math.random() * 900) + 100;
            pinCode = `${firstPart}-${secondPart}`;
        } while (this.sessionsByPinCode.has(pinCode));
        return pinCode;
    }
}

// Create repository instances
const sessionRepository = new ESVPSessionRepository();
const moodSessionRepository = new MoodSessionRepository();

// API Routes
app.post('/api/sessions', (req, res) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Session name is required' });
    }

    const session = sessionRepository.createSession(name);
    res.json({
        id: session.id,
        name: session.name,
        pinCode: session.pinCode
    });
});

app.post('/api/sessions/join', (req, res) => {
    const { pinCode } = req.body;
    if (!pinCode) {
        return res.status(400).json({ error: 'Pin code is required' });
    }

    const session = sessionRepository.findSessionByPinCode(pinCode);
    if (!session) {
        return res.status(404).json({ error: 'Session not found' });
    }

    res.json({
        id: session.id,
        name: session.name
    });
});

app.put('/api/sessions/:id/name', (req, res) => {
    // Session names cannot be modified after creation
    res.status(400).json({ error: 'Session names cannot be modified after creation' });
});

app.post('/api/sessions/:id/votes', (req, res) => {
    const { id } = req.params;
    const { userId, profile } = req.body;

    if (!id) {
        return res.status(400).json({ error: 'Missing session ID' });
    }

    if (!userId || !profile) {
        return res.status(400).json({ error: 'User ID and profile are required' });
    }

    const session = sessionRepository.addVote(id, userId, profile);
    if (!session) {
        return res.status(404).json({ error: 'Session not found' });
    }

    res.status(200).send();
});

app.get('/api/sessions/:id/results', (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ error: 'Missing session ID' });
    }

    const session = sessionRepository.findSessionById(id);
    if (!session) {
        return res.status(404).json({ error: 'Session not found' });
    }

    const results = sessionRepository.getSessionResults(id);
    if (!results) {
        return res.status(404).json({ error: 'Session not found' });
    }

    res.json({
        id: session.id,
        name: session.name,
        results
    });
});

// Mood Swing API Routes
app.post('/api/mood-swing/sessions', (req, res) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Session name is required' });
    }

    const session = moodSessionRepository.createSession(name);
    res.json({
        id: session.id,
        name: session.name,
        pinCode: session.pinCode
    });
});

app.post('/api/mood-swing/sessions/join', (req, res) => {
    const { pinCode } = req.body;
    if (!pinCode) {
        return res.status(400).json({ error: 'Pin code is required' });
    }

    const session = moodSessionRepository.findSessionByPinCode(pinCode);
    if (!session) {
        return res.status(404).json({ error: 'Session not found' });
    }

    res.json({
        id: session.id,
        name: session.name
    });
});

app.post('/api/mood-swing/sessions/:id/votes', (req, res) => {
    const { id } = req.params;
    const { userId, level } = req.body;

    if (!id) {
        return res.status(400).json({ error: 'Missing session ID' });
    }

    if (!userId || !level) {
        return res.status(400).json({ error: 'User ID and level are required' });
    }

    // Ensure level is a number between 1 and 10
    const moodLevel = parseInt(level);
    if (isNaN(moodLevel) || moodLevel < 1 || moodLevel > 10) {
        return res.status(400).json({ error: 'Level must be a number between 1 and 10' });
    }

    const session = moodSessionRepository.addVote(id, userId, moodLevel);
    if (!session) {
        return res.status(404).json({ error: 'Session not found' });
    }

    res.status(200).send();
});

app.get('/api/mood-swing/sessions/:id/results', (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ error: 'Missing session ID' });
    }

    const session = moodSessionRepository.findSessionById(id);
    if (!session) {
        return res.status(404).json({ error: 'Session not found' });
    }

    const results = moodSessionRepository.getSessionResults(id);
    if (!results) {
        return res.status(404).json({ error: 'Session not found' });
    }

    res.json({
        id: session.id,
        name: session.name,
        results
    });
});

// Add the /json/kotlinx-serialization endpoint for compatibility
app.get('/json/kotlinx-serialization', (req, res) => {
    res.json({ hello: 'world' });
});

// Route for ESVP Live application
app.get('/esvp-live', (req, res) => {
    res.sendFile(path.join(__dirname, 'src/main/resources/static/esvp-live.html'));
});

// Route for Mood Swing application
app.get('/mood-swing', (req, res) => {
    res.sendFile(path.join(__dirname, 'src/main/resources/static/mood-swing.html'));
});

// Route for homepage
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'src/main/resources/static/home.html'));
});

// Default route for SPA - fallback for other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'src/main/resources/static/index.html'));
});

// Start HTTP server
const httpServer = http.createServer(app);
httpServer.listen(HTTP_PORT, '0.0.0.0', () => {
    console.log(`HTTP server is running on port ${HTTP_PORT} and accessible from all interfaces`);
});

// Start HTTPS server if certificates are available
if (httpsOptions.key && httpsOptions.cert) {
    const httpsServer = https.createServer(httpsOptions, app);
    httpsServer.listen(HTTPS_PORT, '0.0.0.0', () => {
        console.log(`HTTPS server is running on port ${HTTPS_PORT} and accessible from all interfaces`);
    });
} else {
    console.log('HTTPS server not started due to missing SSL certificates');
}
