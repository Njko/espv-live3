# Instructions for Starting the Node.js Server

## Prerequisites

Before you can start the Node.js server, you need to have Node.js installed on your system.

### Installing Node.js

1. Download Node.js from the official website: https://nodejs.org/
2. Choose the LTS (Long Term Support) version for stability
3. Run the installer and follow the installation instructions
4. Verify the installation by opening a new command prompt and typing:
   ```
   node --version
   npm --version
   ```
   Both commands should display version numbers if the installation was successful.

## Starting the Server

Once Node.js is installed, you can start the server using one of the following methods:

### Method 1: Using npm directly

1. Open a command prompt in the project directory
2. Run the following commands:
   ```
   npm install
   npm start
   ```

### Method 2: Using Gradle (requires Java)

1. Make sure Java is installed and JAVA_HOME is set
2. Open a command prompt in the project directory
3. Run the following command:
   ```
   .\gradlew run
   ```

### Method 3: Using Node directly

1. Open a command prompt in the project directory
2. Run the following commands:
   ```
   npm install
   node server.js
   ```

## Verifying the Server is Running

If the server starts successfully, you'll see the following output:
```
Server is running on port 8080
```

You can then access the application by opening a web browser and navigating to:
```
http://localhost:8080
```