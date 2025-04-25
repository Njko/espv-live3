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
let httpsOptions = {};
try {
    // Try to read SSL certificates if they exist
    httpsOptions = {
        key: fs.readFileSync(path.join(__dirname, 'ssl', 'private-key.pem')),
        cert: fs.readFileSync(path.join(__dirname, 'ssl', 'certificate.pem'))
    };
} catch (error) {
    console.warn('SSL certificates not found. HTTPS server will not start.');
    console.warn('See documentation for instructions on generating SSL certificates.');
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

// Create repository instance
const sessionRepository = new ESVPSessionRepository();

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

// Add the /json/kotlinx-serialization endpoint for compatibility
app.get('/json/kotlinx-serialization', (req, res) => {
    res.json({ hello: 'world' });
});

// Default route for SPA
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
