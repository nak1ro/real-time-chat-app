# Real-Time Chat Application

A production-ready real-time messaging platform built with Next.js and Socket.IO, featuring instant messaging, file sharing, and comprehensive moderation tools.

## Overview

This modern chat application demonstrates full-stack real-time capabilities with WebSocket communication, supporting direct messages, group chats, and public channels. Built with a clean architecture separating frontend and backend concerns, it showcases scalable patterns for handling concurrent users, real-time state synchronization, and robust file management with cloud storage.

## Features

- **Real-Time Messaging** - Instant delivery and synchronization via Socket.IO WebSockets
- **Multiple Conversation Types** - Direct messages, group chats, and public/private channels
- **Rich Message Interactions** - Edit, delete, reply threads, and emoji reactions
- **File Attachments** - Image, audio, and document sharing with AWS S3 integration
- **Read Receipts & Presence** - Message status tracking and real-time online/offline indicators
- **Smart Notifications** - In-app alerts for mentions, replies, and conversation activity
- **Role-Based Access Control** - Owner/Admin/Member permissions with moderation capabilities
- **Channel Management** - Create and manage communities with invite systems
- **Global Search** - Find users and conversations with filtering options
- **Modern UI/UX** - Responsive design with dark/light themes
- **Secure Authentication** - JWT-based auth with bcrypt password hashing

## Tech Stack

**Frontend:**
- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS 4 with shadcn/ui components
- TanStack Query for server state
- Socket.IO Client for real-time features

**Backend:**
- Node.js with Express 5, TypeScript
- Prisma ORM with PostgreSQL
- Socket.IO Server for WebSocket connections
- AWS S3 for file storage

## Demo

*[Live demo coming soon]*

![Application Preview](screenshot.png)

## Quick Start
```bash
# Clone and navigate to project
git clone https://github.com/nak1ro/real-time-chat-app.git
cd real-time-chat-app

# Backend setup
cd backend
npm install
cp .env.example .env
# Configure: DATABASE_URL, JWT_SECRET, AWS credentials

npm run prisma:generate
npm run prisma:migrate
npm run dev

# Frontend setup (new terminal)
cd frontend
npm install
cp .env.example .env.local
# Configure: NEXT_PUBLIC_API_URL, NEXT_PUBLIC_SOCKET_URL

npm run dev
```

Access the application at `http://localhost:3000`

## Key Implementation Details

**Real-Time Architecture**: Built a fully-typed Socket.IO layer with TypeScript interfaces for all client-server events. Users automatically join conversation rooms on connection, enabling efficient message broadcasting. Each feature (messages, reactions, presence) has dedicated handlers with proper error boundaries and callback patterns.

**Hybrid State Management**: Combined REST APIs with React Query for initial data fetching and caching, while Socket.IO listeners update the cache in real-time. This provides fast initial loads and maintains synchronization across all connected clients, with optimistic updates for instant UI feedback.

**Scalable File Pipeline**: Implemented a multi-stage upload system that validates files server-side, processes images with Sharp for optimization, extracts media metadata with FFmpeg, and stores in S3 with presigned URLs for secure access. Progress indicators and previews enhance the user experience.

## What I Learned

- **Real-Time Systems Design** - Managing WebSocket connections at scale, implementing room patterns, handling reconnections gracefully, and maintaining type safety across the socket layer

- **Advanced State Synchronization** - Balancing REST and WebSocket architectures, implementing optimistic updates, and reconciling client-side cache with server state in real-time applications

- **Production Backend Patterns** - Designing service-oriented architecture, managing complex database relationships with Prisma transactions, implementing granular permission systems, and building maintainable, testable codebases

## Future Improvements

- Voice/video calling capabilities
- Message threading and search
- Message reactions with custom emoji
- End-to-end encryption for private conversations
- Redis for horizontal scaling of Socket.IO

## License

MIT