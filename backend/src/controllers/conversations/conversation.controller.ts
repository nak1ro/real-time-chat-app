import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware';
import * as conversationService from '../../services/conversations/conversation.service';
import { CreateConversationData, ConversationFilters, UpdateConversationPatch } from '../../domain';
import { MemberRole } from '@prisma/client';

// Create direct conversation
export const createDirectConversation = asyncHandler(async (req: Request, res: Response) => {
    const currentUserId = (req as any).user?.id;
    const { otherUserId } = req.body;

    const conversation = await conversationService.createDirectConversation(
        currentUserId,
        otherUserId
    );

    res.status(201).json({
        status: 'success',
        data: { conversation },
    });
});

// Create group or channel conversation
export const createGroupOrChannel = asyncHandler(async (req: Request, res: Response) => {
    const currentUserId = (req as any).user?.id;
    const data: CreateConversationData = req.body;

    const conversation = await conversationService.createGroupOrChannelConversation(
        currentUserId,
        data
    );

    res.status(201).json({
        status: 'success',
        data: { conversation },
    });
});

// List user's conversations
export const listUserConversations = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const filters: ConversationFilters | undefined = req.query.type || req.query.isPublic || req.query.name
        ? {
            type: req.query.type as any,
            isPublic: req.query.isPublic === 'true' ? true : req.query.isPublic === 'false' ? false : undefined,
            name: req.query.name as string,
        }
        : undefined;

    const conversations = await conversationService.listUserConversations(userId, filters);

    res.status(200).json({
        status: 'success',
        data: { conversations },
    });
});

// Get conversation by ID
export const getConversationById = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const { id } = req.params;

    const conversation = await conversationService.getConversationByIdForUser(id, userId);

    res.status(200).json({
        status: 'success',
        data: { conversation },
    });
});

// Update conversation
export const updateConversation = asyncHandler(async (req: Request, res: Response) => {
    const actorId = (req as any).user?.id;
    const { id } = req.params;
    const patch: UpdateConversationPatch = req.body;

    const conversation = await conversationService.updateConversation(id, actorId, patch);

    res.status(200).json({
        status: 'success',
        data: { conversation },
    });
});

// Add members to conversation
export const addMembers = asyncHandler(async (req: Request, res: Response) => {
    const actorId = (req as any).user?.id;
    const { id } = req.params;
    const { userIds, role } = req.body;

    const conversation = await conversationService.addConversationMembers(
        id,
        actorId,
        userIds,
        role || MemberRole.MEMBER
    );

    res.status(200).json({
        status: 'success',
        data: { conversation },
    });
});

// Remove member from conversation
export const removeMember = asyncHandler(async (req: Request, res: Response) => {
    const actorId = (req as any).user?.id;
    const { id, memberId } = req.params;

    const conversation = await conversationService.removeConversationMember(
        id,
        actorId,
        memberId
    );

    res.status(200).json({
        status: 'success',
        data: { conversation },
    });
});

// Leave conversation
export const leaveConversation = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const { id } = req.params;

    await conversationService.leaveConversation(id, userId);

    res.status(200).json({
        status: 'success',
        data: {
            message: 'Left conversation successfully',
        },
    });
});

// Update member role
export const updateMemberRole = asyncHandler(async (req: Request, res: Response) => {
    const actorId = (req as any).user?.id;
    const { id, memberId } = req.params;
    const { role } = req.body;

    const conversation = await conversationService.updateMemberRole(
        id,
        actorId,
        memberId,
        role
    );

    res.status(200).json({
        status: 'success',
        data: { conversation },
    });
});

// List public channels
export const listPublicChannels = asyncHandler(async (req: Request, res: Response) => {
    const filters: ConversationFilters | undefined = req.query.name
        ? { name: req.query.name as string }
        : undefined;

    const channels = await conversationService.listPublicChannels(filters);

    res.status(200).json({
        status: 'success',
        data: { channels },
    });
});

// Join channel by slug
export const joinChannelBySlug = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const { slug } = req.params;

    const conversation = await conversationService.joinChannelBySlug(slug, userId);

    res.status(200).json({
        status: 'success',
        data: { conversation },
    });
});

// Generate slug from name
export const generateSlug = asyncHandler(async (req: Request, res: Response) => {
    const { name } = req.body;

    const slug = await conversationService.generateSlug(name);

    res.status(200).json({
        status: 'success',
        data: { slug },
    });
});

// Search conversations and users
export const search = asyncHandler(async (req: Request, res: Response) => {
    const currentUserId = (req as any).user?.id;
    const { q, type } = req.query;

    const results = await conversationService.searchConversations(
        q as string,
        currentUserId,
        type as string
    );

    res.status(200).json({
        status: 'success',
        data: results,
    });
});
