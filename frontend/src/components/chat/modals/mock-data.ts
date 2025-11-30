// Mock data for chat modals - uses real types for easy API integration later
import type { User, UserBasic, UserWithStatus } from '@/types/user.types';
import type { Conversation, ConversationMember } from '@/types/conversation.types';
import type { Attachment } from '@/types/message.types';
import { Status, ConversationType, MemberRole, AttachmentType } from '@/types/enums';

// Current user ID (mock - in real app this comes from auth context)
export const CURRENT_USER_ID = 'current-user-123';

// Mock current user
export const mockCurrentUser: User = {
  id: CURRENT_USER_ID,
  name: 'You',
  avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=CurrentUser',
  status: Status.ONLINE,
  lastSeenAt: new Date(),
  createdAt: new Date('2024-01-01'),
};

// Mock users for DMs and members
export const mockUsers: UserWithStatus[] = [
  {
    id: 'user-1',
    name: 'Sarah Johnson',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    status: Status.ONLINE,
    lastSeenAt: new Date(),
  },
  {
    id: 'user-2',
    name: 'Michael Chen',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael',
    status: Status.OFFLINE,
    lastSeenAt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
  },
  {
    id: 'user-3',
    name: 'Emily Davis',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily',
    status: Status.OFFLINE,
    lastSeenAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
  },
  {
    id: 'user-4',
    name: 'James Wilson',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James',
    status: Status.ONLINE,
    lastSeenAt: new Date(),
  },
  {
    id: 'user-5',
    name: 'Olivia Martinez',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Olivia',
    status: Status.OFFLINE,
    lastSeenAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
  },
  {
    id: 'user-6',
    name: 'William Brown',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=William',
    status: Status.ONLINE,
    lastSeenAt: new Date(),
  },
  {
    id: 'user-7',
    name: 'Sophia Lee',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophia',
    status: Status.OFFLINE,
    lastSeenAt: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
  },
  {
    id: 'user-8',
    name: 'Benjamin Taylor',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Benjamin',
    status: Status.ONLINE,
    lastSeenAt: new Date(),
  },
  {
    id: 'user-9',
    name: 'Isabella Anderson',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Isabella',
    status: Status.OFFLINE,
    lastSeenAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
  },
  {
    id: 'user-10',
    name: 'Alexander Garcia',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alexander',
    status: Status.ONLINE,
    lastSeenAt: new Date(),
  },
  {
    id: 'user-11',
    name: 'Mia Thompson',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mia',
    status: Status.OFFLINE,
    lastSeenAt: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
  },
  {
    id: 'user-12',
    name: 'Daniel White',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Daniel',
    status: Status.ONLINE,
    lastSeenAt: new Date(),
  },
];

// Helper to create UserBasic from UserWithStatus
const toUserBasic = (user: UserWithStatus): UserBasic => ({
  id: user.id,
  name: user.name,
  avatarUrl: user.avatarUrl,
});

// Mock image attachments
export const mockImageAttachments: Attachment[] = Array.from({ length: 24 }, (_, i) => ({
  id: `img-${i + 1}`,
  messageId: `msg-${i + 1}`,
  url: `https://picsum.photos/seed/${i + 1}/400/300`,
  thumbnailUrl: `https://picsum.photos/seed/${i + 1}/100/75`,
  fileName: `image-${i + 1}.jpg`,
  mimeType: 'image/jpeg',
  sizeBytes: Math.floor(Math.random() * 5000000) + 100000, // 100KB - 5MB
  type: AttachmentType.IMAGE,
  width: 400,
  height: 300,
  durationMs: null,
  createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
}));

// Mock file attachments
export const mockFileAttachments: Attachment[] = [
  {
    id: 'file-1',
    messageId: 'msg-f1',
    url: '/files/project-proposal.pdf',
    thumbnailUrl: null,
    fileName: 'Project Proposal Q4.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 2457600, // 2.4 MB
    type: AttachmentType.DOCUMENT,
    width: null,
    height: null,
    durationMs: null,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'file-2',
    messageId: 'msg-f2',
    url: '/files/budget.xlsx',
    thumbnailUrl: null,
    fileName: 'Budget 2024.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    sizeBytes: 156000, // 156 KB
    type: AttachmentType.DOCUMENT,
    width: null,
    height: null,
    durationMs: null,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'file-3',
    messageId: 'msg-f3',
    url: '/files/meeting-notes.docx',
    thumbnailUrl: null,
    fileName: 'Meeting Notes - Nov 2024.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    sizeBytes: 89000, // 89 KB
    type: AttachmentType.DOCUMENT,
    width: null,
    height: null,
    durationMs: null,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'file-4',
    messageId: 'msg-f4',
    url: '/files/design-assets.zip',
    thumbnailUrl: null,
    fileName: 'Design Assets.zip',
    mimeType: 'application/zip',
    sizeBytes: 45678900, // 45.6 MB
    type: AttachmentType.OTHER,
    width: null,
    height: null,
    durationMs: null,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'file-5',
    messageId: 'msg-f5',
    url: '/files/contract.pdf',
    thumbnailUrl: null,
    fileName: 'Contract Agreement.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 567000, // 567 KB
    type: AttachmentType.DOCUMENT,
    width: null,
    height: null,
    durationMs: null,
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'file-6',
    messageId: 'msg-f6',
    url: '/files/report.pdf',
    thumbnailUrl: null,
    fileName: 'Annual Report 2024.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 8900000, // 8.9 MB
    type: AttachmentType.DOCUMENT,
    width: null,
    height: null,
    durationMs: null,
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'file-7',
    messageId: 'msg-f7',
    url: '/files/presentation.pptx',
    thumbnailUrl: null,
    fileName: 'Q4 Presentation.pptx',
    mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    sizeBytes: 12340000, // 12.3 MB
    type: AttachmentType.DOCUMENT,
    width: null,
    height: null,
    durationMs: null,
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'file-8',
    messageId: 'msg-f8',
    url: '/files/data.csv',
    thumbnailUrl: null,
    fileName: 'User Data Export.csv',
    mimeType: 'text/csv',
    sizeBytes: 234000, // 234 KB
    type: AttachmentType.DOCUMENT,
    width: null,
    height: null,
    durationMs: null,
    createdAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
  },
];

// Helper to create conversation members
const createMember = (
  user: UserWithStatus,
  conversationId: string,
  role: MemberRole,
  joinedDaysAgo: number = 30
): ConversationMember => ({
  id: `member-${user.id}-${conversationId}`,
  userId: user.id,
  conversationId,
  role,
  joinedAt: new Date(Date.now() - joinedDaysAgo * 24 * 60 * 60 * 1000),
  lastReadMessageId: null,
  user: toUserBasic(user),
});

// Mock Direct Message Conversations
export const mockDirectConversations: Conversation[] = [
  {
    id: 'dm-1',
    type: ConversationType.DIRECT,
    name: null,
    slug: null,
    description: null,
    avatarUrl: null,
    isPublic: false,
    isReadOnly: false,
    createdAt: new Date('2024-06-15'),
    createdById: CURRENT_USER_ID,
    members: [
      createMember({ ...mockCurrentUser, status: Status.ONLINE, lastSeenAt: new Date() }, 'dm-1', MemberRole.MEMBER),
      createMember(mockUsers[0], 'dm-1', MemberRole.MEMBER),
    ],
    _count: { members: 2 },
  },
  {
    id: 'dm-2',
    type: ConversationType.DIRECT,
    name: null,
    slug: null,
    description: null,
    avatarUrl: null,
    isPublic: false,
    isReadOnly: false,
    createdAt: new Date('2024-08-20'),
    createdById: 'user-2',
    members: [
      createMember({ ...mockCurrentUser, status: Status.ONLINE, lastSeenAt: new Date() }, 'dm-2', MemberRole.MEMBER),
      createMember(mockUsers[1], 'dm-2', MemberRole.MEMBER),
    ],
    _count: { members: 2 },
  },
  {
    id: 'dm-3',
    type: ConversationType.DIRECT,
    name: null,
    slug: null,
    description: null,
    avatarUrl: null,
    isPublic: false,
    isReadOnly: false,
    createdAt: new Date('2024-09-10'),
    createdById: CURRENT_USER_ID,
    members: [
      createMember({ ...mockCurrentUser, status: Status.ONLINE, lastSeenAt: new Date() }, 'dm-3', MemberRole.MEMBER),
      createMember(mockUsers[2], 'dm-3', MemberRole.MEMBER),
    ],
    _count: { members: 2 },
  },
];

// Mock Group Conversations
export const mockGroupConversations: Conversation[] = [
  // Small group where current user is Admin
  {
    id: 'group-1',
    type: ConversationType.GROUP,
    name: 'Project Alpha Team',
    slug: 'project-alpha-team',
    description: 'Discussion group for Project Alpha development and planning.',
    avatarUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=ProjectAlpha',
    isPublic: false,
    isReadOnly: false,
    createdAt: new Date('2024-03-01'),
    createdById: CURRENT_USER_ID,
    members: [
      createMember({ ...mockCurrentUser, status: Status.ONLINE, lastSeenAt: new Date() }, 'group-1', MemberRole.ADMIN, 90),
      createMember(mockUsers[0], 'group-1', MemberRole.MEMBER, 85),
      createMember(mockUsers[1], 'group-1', MemberRole.MEMBER, 80),
      createMember(mockUsers[2], 'group-1', MemberRole.ADMIN, 75),
      createMember(mockUsers[3], 'group-1', MemberRole.MEMBER, 60),
    ],
    _count: { members: 5 },
  },
  // Large group where current user is Member
  {
    id: 'group-2',
    type: ConversationType.GROUP,
    name: 'Company-wide Announcements',
    slug: 'company-announcements',
    description: 'Official company announcements and updates for all employees.',
    avatarUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=CompanyAnnounce',
    isPublic: false,
    isReadOnly: false,
    createdAt: new Date('2024-01-15'),
    createdById: 'user-4',
    members: [
      createMember(mockUsers[3], 'group-2', MemberRole.ADMIN, 180), // Owner
      createMember(mockUsers[4], 'group-2', MemberRole.ADMIN, 170),
      createMember({ ...mockCurrentUser, status: Status.ONLINE, lastSeenAt: new Date() }, 'group-2', MemberRole.MEMBER, 150),
      ...mockUsers.slice(0, 9).map((user, i) => createMember(user, 'group-2', MemberRole.MEMBER, 140 - i * 10)),
    ],
    _count: { members: 12 },
  },
];

// Mock Channel Conversation
export const mockChannelConversation: Conversation = {
  id: 'channel-1',
  type: ConversationType.CHANNEL,
  name: 'Tech News & Updates',
  slug: 'tech-news',
  description: 'Stay up to date with the latest technology news, trends, and discussions. We cover everything from AI and machine learning to web development and mobile apps. Join our community of tech enthusiasts!',
  avatarUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=TechNews',
  isPublic: true,
  isReadOnly: false,
  createdAt: new Date('2023-06-01'),
  createdById: CURRENT_USER_ID,
  members: [
    createMember({ ...mockCurrentUser, status: Status.ONLINE, lastSeenAt: new Date() }, 'channel-1', MemberRole.ADMIN, 365),
    createMember(mockUsers[5], 'channel-1', MemberRole.ADMIN, 300),
    ...mockUsers.map((user, i) => createMember(user, 'channel-1', MemberRole.MEMBER, 250 - i * 10)),
  ],
  _count: { members: 1284 },
};

// Export user lookup by ID
export const getUserById = (userId: string): UserWithStatus | undefined => {
  if (userId === CURRENT_USER_ID) {
    return { ...mockCurrentUser, status: Status.ONLINE, lastSeenAt: new Date() };
  }
  return mockUsers.find(u => u.id === userId);
};

// Export member lookup helpers
export const getMemberRole = (conversation: Conversation, userId: string): MemberRole | undefined => {
  return conversation.members.find(m => m.userId === userId)?.role;
};

export const isUserAdmin = (conversation: Conversation, userId: string): boolean => {
  const role = getMemberRole(conversation, userId);
  return role === MemberRole.ADMIN;
};

export const isUserOwner = (conversation: Conversation, userId: string): boolean => {
  return conversation.createdById === userId;
};

