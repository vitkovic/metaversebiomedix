# BioMedix Metaverse

BioMedix Metaverse is a browser-based multi-user virtual collaboration platform developed at the Faculty of Mechanical Engineering, University of Niš. The platform provides shared virtual spaces for education, research, engineering collaboration and future biomedical metaverse applications.

The current prototype demonstrates real-time interaction, collaborative content sharing and room-based communication using modern open-source web technologies.

---

## Features

### Multi-User Virtual Environment
- Real-time user presence
- Avatar synchronization
- Room-based interaction
- User role management

### Lobby
- Central navigation hub
- Online users panel
- Interactive room access
- Information display

### Whiteboard Room
- Collaborative drawing
- Text annotations
- Image sharing
- Real-time synchronization
- Multi-user collaboration

### Meeting Room
- Shared presentation screen
- Video content sharing
- Collaborative discussions
- Real-time content synchronization

### Communication
- Real-time chat
- Room-based communication
- User presence awareness

---

## User Roles

The prototype currently supports four user roles:

| User | Role |
|--------|--------|
| Nikola | Administrator |
| Filip | Teacher |
| Joakim | Student |
| Mark | Guest |

---

## Technology Stack

### Frontend
- A-Frame
- HTML5
- CSS3
- JavaScript

### Backend
- Node.js
- Express.js
- Express Session

### Real-Time Communication
- Socket.IO
- WebSockets

### Development Environment
- Eclipse IDE
- Git
- GitHub

---

## Project Structure

```text
metaversebiomedix/
│
├── public/
│   ├── assets/
│   ├── css/
│   ├── js/
│   └── rooms/
│
├── server.js
├── package.json
├── package-lock.json
└── README.md
```

---

## Installation

Clone the repository:

```bash
git clone https://github.com/vitkovic/metaversebiomedix.git
cd metaversebiomedix
```

Install dependencies:

```bash
npm install
```

Run the application:

```bash
node server.js
```

Open:

```text
http://localhost:8080
```

---

## Current Prototype Components

The current implementation includes:

- Authentication system
- Multi-user avatar synchronization
- Online users monitoring
- Real-time chat
- Lobby environment
- Collaborative Whiteboard Room
- Meeting Room
- Image sharing
- Video sharing
- Room-based navigation

---

## Future Development

The BioMedix Metaverse platform is designed as a scalable framework for future biomedical, educational and industrial metaverse applications.

Planned developments include:

- Voice communication
- File sharing
- Advanced whiteboard collaboration
- XR headset support
- Digital Twin environments
- Biomedical visualization modules
- Engineering simulation spaces
- CAD review rooms
- AI-assisted collaboration
- Babylon.js integration for advanced environments
- Colyseus-based large-scale multi-user synchronization

A hybrid architecture is envisioned where lightweight collaboration spaces continue to use A-Frame, while advanced simulation and visualization environments may utilize Babylon.js.

---

## License

This prototype is developed for research, education and demonstration purposes.

---

## Contact

**Prof. Dr. Nikola Vitković**  
Faculty of Mechanical Engineering  
University of Niš, Serbia

GitHub Repository:
https://github.com/vitkovic/metaversebiomedix