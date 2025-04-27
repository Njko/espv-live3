const express = require('express');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const https = require('https');
const http = require('http');
const fs = require('fs');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

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

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ESVP Live & Mood Swing API',
      version: '1.0.0',
      description: 'API documentation for ESVP Live and Mood Swing applications',
      contact: {
        name: 'API Support'
      }
    },
    servers: [
      {
        url: 'http://nicolaslinard.dev',
        description: 'Services'
      }
    ]
  },
  apis: ['./server.js'], // Path to the API docs
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

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

/**
 * @swagger
 * components:
 *   schemas:
 *     Session:
 *       type: object
 *       required:
 *         - id
 *         - name
 *         - pinCode
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated UUID of the session
 *         name:
 *           type: string
 *           description: The name of the session
 *         pinCode:
 *           type: string
 *           description: The unique pin code for joining the session
 *     Vote:
 *       type: object
 *       required:
 *         - userId
 *         - profile
 *       properties:
 *         userId:
 *           type: string
 *           description: The ID of the user submitting the vote
 *         profile:
 *           type: string
 *           enum: [EXPLORER, SHOPPER, VACATIONER, PRISONER]
 *           description: The ESVP profile selected by the user
 *     SessionResults:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The session ID
 *         name:
 *           type: string
 *           description: The name of the session
 *         results:
 *           type: object
 *           properties:
 *             EXPLORER:
 *               type: integer
 *               description: Number of Explorer votes
 *             SHOPPER:
 *               type: integer
 *               description: Number of Shopper votes
 *             VACATIONER:
 *               type: integer
 *               description: Number of Vacationer votes
 *             PRISONER:
 *               type: integer
 *               description: Number of Prisoner votes
 */

/**
 * @swagger
 * /api/sessions:
 *   post:
 *     summary: Create a new ESVP session
 *     tags: [ESVP]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: The name of the session
 *     responses:
 *       200:
 *         description: The session was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Session'
 *       400:
 *         description: Missing required fields
 */
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

/**
 * @swagger
 * /api/sessions/join:
 *   post:
 *     summary: Join an existing ESVP session using a pin code
 *     tags: [ESVP]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pinCode
 *             properties:
 *               pinCode:
 *                 type: string
 *                 description: The pin code of the session to join
 *     responses:
 *       200:
 *         description: Successfully joined the session
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: The session ID
 *                 name:
 *                   type: string
 *                   description: The name of the session
 *       400:
 *         description: Missing pin code
 *       404:
 *         description: Session not found
 */
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

/**
 * @swagger
 * /api/sessions/{id}/name:
 *   put:
 *     summary: Update the name of an ESVP session (currently not supported)
 *     tags: [ESVP]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The session ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: The new name for the session
 *     responses:
 *       400:
 *         description: Session names cannot be modified after creation
 */
app.put('/api/sessions/:id/name', (req, res) => {
    // Session names cannot be modified after creation
    res.status(400).json({ error: 'Session names cannot be modified after creation' });
});

/**
 * @swagger
 * /api/sessions/{id}/votes:
 *   post:
 *     summary: Submit a vote for an ESVP session
 *     tags: [ESVP]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The session ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Vote'
 *     responses:
 *       200:
 *         description: Vote successfully submitted
 *       400:
 *         description: Missing required fields
 *       404:
 *         description: Session not found
 */
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

/**
 * @swagger
 * /api/sessions/{id}/results:
 *   get:
 *     summary: Get the results of an ESVP session
 *     tags: [ESVP]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The session ID
 *     responses:
 *       200:
 *         description: Session results retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SessionResults'
 *       400:
 *         description: Missing session ID
 *       404:
 *         description: Session not found
 */
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

/**
 * @swagger
 * components:
 *   schemas:
 *     MoodSession:
 *       type: object
 *       required:
 *         - id
 *         - name
 *         - pinCode
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated UUID of the mood session
 *         name:
 *           type: string
 *           description: The name of the mood session
 *         pinCode:
 *           type: string
 *           description: The unique pin code for joining the mood session
 *     MoodVote:
 *       type: object
 *       required:
 *         - userId
 *         - level
 *       properties:
 *         userId:
 *           type: string
 *           description: The ID of the user submitting the vote
 *         level:
 *           type: integer
 *           minimum: 1
 *           maximum: 10
 *           description: The mood level (1-10) selected by the user
 *     MoodSessionResults:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The session ID
 *         name:
 *           type: string
 *           description: The name of the session
 *         results:
 *           type: object
 *           properties:
 *             1:
 *               type: integer
 *               description: Number of votes for level 1
 *             2:
 *               type: integer
 *               description: Number of votes for level 2
 *             3:
 *               type: integer
 *               description: Number of votes for level 3
 *             4:
 *               type: integer
 *               description: Number of votes for level 4
 *             5:
 *               type: integer
 *               description: Number of votes for level 5
 *             6:
 *               type: integer
 *               description: Number of votes for level 6
 *             7:
 *               type: integer
 *               description: Number of votes for level 7
 *             8:
 *               type: integer
 *               description: Number of votes for level 8
 *             9:
 *               type: integer
 *               description: Number of votes for level 9
 *             10:
 *               type: integer
 *               description: Number of votes for level 10
 */

/**
 * @swagger
 * /api/mood-swing/sessions:
 *   post:
 *     summary: Create a new Mood Swing session
 *     tags: [Mood Swing]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: The name of the session
 *     responses:
 *       200:
 *         description: The session was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MoodSession'
 *       400:
 *         description: Missing required fields
 */
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

/**
 * @swagger
 * /api/mood-swing/sessions/join:
 *   post:
 *     summary: Join an existing Mood Swing session using a pin code
 *     tags: [Mood Swing]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pinCode
 *             properties:
 *               pinCode:
 *                 type: string
 *                 description: The pin code of the session to join
 *     responses:
 *       200:
 *         description: Successfully joined the session
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: The session ID
 *                 name:
 *                   type: string
 *                   description: The name of the session
 *       400:
 *         description: Missing pin code
 *       404:
 *         description: Session not found
 */
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

/**
 * @swagger
 * /api/mood-swing/sessions/{id}/votes:
 *   post:
 *     summary: Submit a vote for a Mood Swing session
 *     tags: [Mood Swing]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The session ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MoodVote'
 *     responses:
 *       200:
 *         description: Vote successfully submitted
 *       400:
 *         description: Missing required fields or invalid level
 *       404:
 *         description: Session not found
 */
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

/**
 * @swagger
 * /api/mood-swing/sessions/{id}/results:
 *   get:
 *     summary: Get the results of a Mood Swing session
 *     tags: [Mood Swing]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The session ID
 *     responses:
 *       200:
 *         description: Session results retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MoodSessionResults'
 *       400:
 *         description: Missing session ID
 *       404:
 *         description: Session not found
 */
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

/**
 * @swagger
 * /api/translations/{lang}:
 *   get:
 *     summary: Get translation files (en.json or fr.json)
 *     tags: [Translations]
 *     parameters:
 *       - in: path
 *         name: lang
 *         schema:
 *           type: string
 *           enum: [en, fr]
 *         required: true
 *         description: Language code (en or fr)
 *     responses:
 *       200:
 *         description: Translation file retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       404:
 *         description: Translation file not found
 */
app.get('/api/translations/:lang', (req, res) => {
    const { lang } = req.params;

    if (lang !== 'en' && lang !== 'fr') {
        return res.status(404).json({ error: 'Translation file not found' });
    }

    const filePath = path.join(__dirname, `src/main/resources/static/i18n/${lang}.json`);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Translation file not found' });
    }

    res.sendFile(filePath);
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
