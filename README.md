# Real-Time Chat Application

A full-stack, production-ready real-time messaging platform with WebSocket support, featuring direct messages, group chats, channels, file attachments, and comprehensive moderation tools.

## Overview

This is a modern real-time chat application built with a clean separation between frontend and backend, enabling instant messaging experiences similar to Slack or Discord. The architecture leverages Socket.IO for real-time bidirectional communication, ensuring messages, reactions, presence updates, and notifications are delivered instantly across all connected clients. The application supports multiple conversation types (direct messages, group chats, and public channels), role-based permissions, and robust file handling with AWS S3 integration.

What makes this project unique is its comprehensive feature set implemented with production-grade practices: real-time read receipts, message reactions, @mentions, typing indicators, user presence tracking, notification system, and moderation capabilities—all synchronized in real-time. The frontend uses Next.js App Router with Server Components for optimal performance, while the backend follows a clean service-oriented architecture with proper error handling and validation.

## Features

- **Real-Time Messaging** - Instant message delivery and synchronization using Socket.IO WebSockets
- **Multiple Conversation Types** - Direct messages (1-on-1), group chats, and public/private channels
- **Message Features** - Edit/delete messages, reply threads, emoji reactions, and @mentions with notifications
- **File Attachments** - Upload and share images, videos, audio files, and documents with AWS S3 storage
- **Read Receipts** - Track message delivery and read status with visual indicators (sent/read)
- **User Presence** - Real-time online/offline status with heartbeat tracking and last seen timestamps
- **Notifications System** - In-app notifications for mentions, replies, reactions, and conversation invites
- **Role-Based Permissions** - Owner/Admin/Member roles with granular moderation capabilities (kick, ban, mute)
- **Channel Management** - Create public/private channels with slugs, descriptions, and member management
- **Conversation Invitations** - Invite users to groups/channels with pending/accept/decline flow
- **Search & Filtering** - Global search for users and conversations, filter by conversation type
- **Responsive Design** - Mobile-first responsive UI with dark/light theme support
- **Authentication** - JWT-based authentication with secure password hashing (bcrypt)
- **Message Moderation** - Delete messages, kick/ban users, manage roles, and track moderation actions

## Tech Stack

- **Frontend:**
  - Next.js 16 (App Router with Server Components)
  - React 19, TypeScript
  - Tailwind CSS 4, shadcn/ui components
  - TanStack Query (React Query) for server state management
  - Socket.IO Client for real-time features
  - Recharts for data visualization

- **Backend:**
  - Node.js, Express 5
  - TypeScript
  - Prisma ORM with PostgreSQL
  - Socket.IO Server for WebSocket connections
  - JWT authentication with bcrypt password hashing
  - AWS SDK (S3) for file storage
  - Multer for file uploads, Sharp for image processing
  - Fluent-FFmpeg for media metadata extraction

- **Other:**
  - PostgreSQL database
  - AWS S3 for file storage
  - Environment-based configuration

## Demo

*[Add your live demo link here when deployed]*

## Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/real-time-chat-app.git
cd real-time-chat-app

# Backend Setup
cd backend
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your PostgreSQL connection string, JWT secret, and AWS S3 credentials

# Generate Prisma Client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Start backend development server
npm run dev

# Frontend Setup (in a new terminal)
cd ../frontend
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your backend API URL and Socket.IO URL

# Start frontend development server
npm run dev
```

Visit `http://localhost:3000` (or your Next.js configured port) to access the application.

**Required Environment Variables:**

Backend (`.env`):
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT token signing
- `AWS_ACCESS_KEY_ID` - AWS access key for S3
- `AWS_SECRET_ACCESS_KEY` - AWS secret key for S3
- `AWS_S3_BUCKET_NAME` - S3 bucket name for file storage
- `AWS_REGION` - AWS region

Frontend (`.env.local`):
- `NEXT_PUBLIC_API_URL` - Backend API base URL (e.g., http://localhost:5000)
- `NEXT_PUBLIC_SOCKET_URL` - Socket.IO server URL (e.g., http://localhost:5000)

## Key Implementation Details

**Real-Time Architecture with Socket.IO**: The application uses Socket.IO for bidirectional real-time communication. When a user connects, they're automatically joined to rooms for all their conversations, enabling efficient message broadcasting. The socket layer is fully typed with TypeScript interfaces for both client-to-server and server-to-client events, ensuring type safety across the real-time layer. Each feature (messages, reactions, presence, receipts) has dedicated socket handlers with proper error handling and callback patterns.

**Service-Oriented Backend Architecture**: The backend follows a clean service layer pattern where business logic is separated from route handlers. Services like `message.service.ts`, `receipt.service.ts`, and `presence.service.ts` handle complex operations while controllers remain thin. Database operations use Prisma transactions to ensure data consistency, especially for operations like creating messages with attachments and receipts in a single atomic transaction. Permission checks are centralized in a permissions service, making authorization logic reusable and maintainable.

**Frontend State Management with React Query + Socket.IO**: The frontend combines React Query for server state caching with Socket.IO for real-time updates. Custom hooks like `useMessages` fetch initial data via REST APIs and cache it with React Query, while Socket.IO listeners update the cache in real-time when new messages arrive. This hybrid approach ensures fast initial loads (via REST) while maintaining real-time synchronization (via WebSockets). The pattern is consistent across all real-time features—messages, reactions, notifications, and presence updates.

**File Upload Pipeline with S3**: File attachments go through a multi-stage pipeline: client uploads via multipart/form-data, backend validates file type/size, processes images with Sharp (resizing, thumbnail generation), extracts metadata with FFmpeg for media files, uploads to S3 with presigned URLs for secure access, and finally attaches the metadata to messages. The frontend shows upload progress and previews before sending, creating a seamless user experience.

## What I Learned

- **Real-Time Systems Design**: Implementing WebSocket-based real-time features required understanding connection management, room/namespace patterns, event-driven architectures, and handling connection failures gracefully. I learned how to structure socket handlers modularly and maintain type safety across the real-time layer.

- **Complex State Synchronization**: Combining REST APIs for initial data loading with WebSocket updates for real-time changes taught me patterns for keeping client-side cache consistent. I implemented optimistic updates for reactions and messages, then reconciled with server state.

- **Production-Grade Backend Practices**: Building a chat backend required deep understanding of database relationships, transaction management, permission systems, and file handling at scale. I implemented proper error boundaries, validation layers, and service abstractions that make the codebase maintainable and testable.

## License

[Specify your license here]

