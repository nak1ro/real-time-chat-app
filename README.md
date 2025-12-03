# Real-Time Chat Application

A real-time messaging platform built with Next.js and Socket.IO, featuring instant messaging, file sharing, and moderation tools.

## Features

- **Real-Time Messaging** - Instant delivery via Socket.IO WebSockets
- **Conversation Types** - Direct messages, group chats, and channels
- **Message Interactions** - Edit, delete, reply threads, and emoji reactions
- **File Attachments** - Image, audio, and document sharing with AWS S3
- **Read Receipts & Presence** - Message status tracking and online/offline indicators
- **Notifications** - In-app alerts for messages, replies, and activity
- **Role-Based Access** - Owner/Admin/Member permissions with moderation
- **Channel Management** - Create communities with invite systems
- **Search** - Find users and conversations with filtering
- **Themes** - Dark/light mode support
- **Authentication** - JWT-based auth with bcrypt password hashing

## Tech Stack

**Frontend:**
- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS 4 with shadcn/ui
- TanStack Query
- Socket.IO Client

**Backend:**
- Node.js with Express 5, TypeScript
- Prisma ORM with PostgreSQL
- Socket.IO Server
- AWS S3

## Demo

*https://real-time-chat-app-nu-three.vercel.app/auth*

## Setup

```bash
# Clone
git clone https://github.com/nak1ro/real-time-chat-app.git
cd real-time-chat-app

# Backend
cd backend
npm install
cp .env.example .env
# Configure: DATABASE_URL, JWT_SECRET, AWS credentials

npm run prisma:generate
npm run prisma:migrate
npm run dev

# Frontend
cd frontend
npm install
cp .env.example .env.local
# Configure: NEXT_PUBLIC_API_URL, NEXT_PUBLIC_SOCKET_URL

npm run dev
```

## Implementation Highlights

**Real-Time Architecture** - Fully-typed Socket.IO layer with TypeScript interfaces for client-server events. Users join conversation rooms on connection for efficient message broadcasting. Dedicated handlers for messages, reactions, and presence with error boundaries.

**Hybrid State Management** - REST APIs with React Query for initial data fetching and caching, Socket.IO listeners for real-time cache updates. Provides fast initial loads and synchronization across clients with optimistic updates.

**File Upload Pipeline** - Multi-stage system that validates files server-side, processes images with Sharp, extracts metadata with FFmpeg, and stores in S3 with presigned URLs. Includes progress indicators and previews.

## What I Learned

- **Real-Time Systems** - WebSocket connection management, room patterns, reconnection handling, and type safety across socket layer
- **State Synchronization** - Balancing REST and WebSocket architectures, optimistic updates, and cache reconciliation
