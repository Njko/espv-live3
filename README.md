# ESVP Live 3

This project is an ESVP (Explorer, Shopper, Vacationer, Prisoner) voting application implemented with Node.js and Express.

## Features

Here's a list of features included in this project:

| Feature                | Description                                                                        |
| -----------------------|------------------------------------------------------------------------------------ |
| Express.js             | Fast, unopinionated, minimalist web framework for Node.js                          |
| RESTful API            | API endpoints for creating sessions, joining sessions, voting, and viewing results |
| Static File Serving    | Serves the frontend HTML, CSS, and JavaScript files                                |
| In-memory Repository   | Stores session data in memory using JavaScript Maps                                |
| HTTPS Support          | Secure communication with SSL/TLS encryption                                       |

## API Endpoints

| Endpoint                      | Method | Description                                |
| ------------------------------|--------|--------------------------------------------|
| `/api/sessions`               | POST   | Create a new session                       |
| `/api/sessions/join`          | POST   | Join a session with a pin code             |
| `/api/sessions/{id}/votes`    | POST   | Vote in a session                          |
| `/api/sessions/{id}/results`  | GET    | Get session results                        |
| `/json/kotlinx-serialization` | GET    | Simple endpoint that returns {"hello": "world"} |

## Building & Running

### Using Gradle

To build or run the project using Gradle, use one of the following tasks:

| Task                | Description                      |
| --------------------|----------------------------------|
| `./gradlew build`   | Install Node.js dependencies     |
| `./gradlew run`     | Start the Node.js server         |
| `./gradlew clean`   | Clean the project                |

### Using npm directly

You can also use npm commands directly:

| Command                      | Description                                |
| -----------------------------|------------------------------------------|
| `npm install`                | Install dependencies                       |
| `npm start`                  | Start the server                           |
| `npm run generate-self-signed-cert` | Generate self-signed SSL certificates for HTTPS |

If the server starts successfully, you'll see output similar to:

```
HTTP server is running on port 8080 and accessible from all interfaces
HTTPS server is running on port 8443 and accessible from all interfaces
```

Or if SSL certificates are not found:

```
HTTP server is running on port 8080 and accessible from all interfaces
SSL certificates not found. HTTPS server will not start.
See documentation for instructions on generating SSL certificates.
HTTPS server not started due to missing SSL certificates
```

See the [RASPBERRY_PI_DEPLOYMENT.md](RASPBERRY_PI_DEPLOYMENT.md) file for detailed instructions on setting up HTTPS with proper SSL certificates.

## Technologies Used

- Node.js
- Express.js
- UUID for generating unique identifiers
- HTTPS/SSL for secure communication
