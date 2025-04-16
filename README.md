# File Tail Service

A web-based file tailing service that allows users to monitor log files in real-time through a web browser. The service supports social authentication through GitHub and Google, making it secure and easy to access.

## Features

- Real-time file tailing with WebSocket support
- Social authentication (GitHub and Google)
- Flexible file selection:
  - File pattern matching
  - Directory-based file selection
  - Individual file selection
- Configurable number of initial lines to display
- Modern, responsive web interface
- Session persistence with MongoDB

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.0 or higher)
- GitHub OAuth Application credentials
- Google OAuth Application credentials

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd file-tail-service
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory with the following configuration:

```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/file-tail-service
SESSION_SECRET=your-session-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
BASE_URL=http://localhost:3000
```

## Configuration

1. Create OAuth applications:

   - GitHub: https://github.com/settings/developers
   - Google: https://console.developers.google.com/

2. Update the `.env` file with your OAuth credentials

## Usage

1. Start the server:

```bash
node server.js
```

2. Access the web interface at `http://localhost:3000` (or your configured port)

3. Log in using either GitHub or Google

4. Select files to tail by:

   - Entering a file pattern (e.g., "error.log, debug.log, info.log, warning.log")
   - Specifying a directory to search in
   - Choosing from the list of available files

5. Configure the number of initial lines to display

## Constraints and Limitations

1. File Size:

   - The service is optimized for text-based log files
   - Very large files (>1GB) may impact performance
   - Binary files are not supported

2. Performance:

   - Maximum recommended concurrent tail operations: 10 per user
   - Maximum recommended concurrent users: 50
   - WebSocket connection quality affects real-time updates

3. Security:

   - File access is limited to the server's file system
   - Users must be authenticated to access files
   - File permissions are based on the Node.js process user

4. Network:
   - WebSocket connection required for real-time updates
   - Network latency may affect update frequency
   - Bandwidth usage scales with file update frequency and size

## Architecture

The service is built using:

- Express.js for the backend server
- Socket.IO for real-time communication
- Passport.js for authentication
- MongoDB for session storage
- React for the frontend interface
