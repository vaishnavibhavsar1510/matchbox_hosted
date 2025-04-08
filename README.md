# MatchBox - Social Event Planning Platform

A modern web application for planning and managing social events, built with Next.js, MongoDB, and Socket.IO. Features real-time chat, event management, and user profiles.

![MatchBox Screenshot](screenshot.png)

## 🌟 Features

- **User Authentication**
  - Email & password authentication
  - Protected routes
  - Session management

- **Event Management**
  - Create and host events
  - RSVP functionality
  - Event details and participant management
  - Interest-based event discovery

- **Real-time Chat**
  - Direct messaging between users
  - Event-specific chat rooms
  - Real-time notifications

- **Profile Management**
  - Customizable user profiles
  - Interest selection
  - Profile picture upload

## 🚀 Quick Start

### Prerequisites

- Node.js 14.x or later
- MongoDB 4.4 or later
- npm 6.x or later
- Git

### Clone and Install

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/matchbox.git
   cd matchbox
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy the example env file
   cp .env.example .env.local
   ```
   Then edit `.env.local` with your values:
   ```env
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-generated-secret-key
   MONGODB_URI=mongodb://localhost:27017/matchbox
   NEXT_PUBLIC_SOCKET_URL=http://localhost:3002
   ```

   Generate a secure NEXTAUTH_SECRET:
   ```bash
   # On Windows PowerShell
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   
   # On Mac/Linux
   openssl rand -hex 32
   ```

4. **Start MongoDB**
   ```bash
   # Windows: Start MongoDB service
   net start MongoDB

   # Mac with Homebrew
   brew services start mongodb-community

   # Linux
   sudo systemctl start mongod
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open the application**
   Visit [http://localhost:3000](http://localhost:3000)

## 📦 Project Structure

```
matchbox/
├── components/        # Reusable React components
├── pages/            # Next.js pages and API routes
├── public/           # Static assets
├── styles/           # Global styles and CSS modules
├── lib/             # Utility functions and configurations
├── types/           # TypeScript type definitions
└── ...
```

## 🛠️ Built With

- [Next.js](https://nextjs.org/) - React framework
- [MongoDB](https://www.mongodb.com/) - Database
- [NextAuth.js](https://next-auth.js.org/) - Authentication
- [Socket.IO](https://socket.io/) - Real-time communication
- [TailwindCSS](https://tailwindcss.com/) - Styling
- [TypeScript](https://www.typescriptlang.org/) - Type safety

## 🔧 Configuration

### MongoDB Setup

1. Install MongoDB Community Edition
2. Create a new database named 'matchbox'
3. The application will automatically create required collections

### NextAuth.js Setup

1. Generate NEXTAUTH_SECRET
2. Configure NEXTAUTH_URL
3. Additional providers can be added in `pages/api/auth/[...nextauth].ts`

### Socket.IO Setup

1. The Socket.IO server runs on port 3002
2. Configure NEXT_PUBLIC_SOCKET_URL in your environment variables

## 🚨 Common Issues

1. **JWT Session Errors**
   - Ensure NEXTAUTH_SECRET is properly set
   - Clear browser cookies and local storage
   - Restart the development server

2. **MongoDB Connection Issues**
   - Verify MongoDB is running
   - Check MONGODB_URI is correct
   - Ensure MongoDB port (27017) is accessible

3. **Socket.IO Connection Errors**
   - Check if port 3002 is available
   - Verify NEXT_PUBLIC_SOCKET_URL is correct

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- MongoDB team for the powerful database
- NextAuth.js team for the authentication solution
- All contributors and users of this project

## 📧 Contact

vaishnavibhavsar03@gmail.com

Project Link: [https://github.com/vaishnavibhavsar1510/matchbox](https://github.com/vaishnavibhavsar1510/matchbox) 
