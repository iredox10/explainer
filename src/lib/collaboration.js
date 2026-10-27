import { apiFetch, unwrapDocuments, withQuery } from './api';

function randomId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

async function listDocuments(path, params = {}) {
    const payload = await apiFetch(withQuery(path, params));
    return unwrapDocuments(payload);
}

export const commentService = {
    async addComment(storyId, blockId, content, author) {
        try {
            const comment = await apiFetch('/api/admin/comments', {
                method: 'POST',
                body: {
                    storyId,
                    blockId,
                    content,
                    authorId: author?.id,
                    authorName: author?.name,
                    authorEmail: author?.email
                }
            });

            await activityService.log({
                type: 'comment_added',
                storyId,
                details: { blockId, commentId: comment.$id },
                userId: author?.id,
                userName: author?.name
            });

            return comment;
        } catch (error) {
            console.error('Error adding comment:', error);
            throw error;
        }
    },

    async getComments(storyId) {
        try {
            return await listDocuments('/api/admin/comments', { storyId });
        } catch (error) {
            console.error('Error fetching comments:', error);
            return [];
        }
    },

    async resolveComment(commentId, resolvedBy) {
        try {
            const comment = await apiFetch(`/api/admin/comments/${encodeURIComponent(commentId)}`, {
                method: 'PATCH',
                body: { resolved: true }
            });

            await activityService.log({
                type: 'comment_resolved',
                storyId: comment.storyId,
                details: { commentId },
                userId: resolvedBy?.id,
                userName: resolvedBy?.name
            });

            return comment;
        } catch (error) {
            console.error('Error resolving comment:', error);
            throw error;
        }
    },

    async unresolveComment(commentId) {
        try {
            return await apiFetch(`/api/admin/comments/${encodeURIComponent(commentId)}`, {
                method: 'PATCH',
                body: { resolved: false }
            });
        } catch (error) {
            console.error('Error unresolving comment:', error);
            throw error;
        }
    },

    async deleteComment(commentId) {
        try {
            await apiFetch(`/api/admin/comments/${encodeURIComponent(commentId)}`, { method: 'DELETE' });
            return true;
        } catch (error) {
            console.error('Error deleting comment:', error);
            return false;
        }
    },

    async replyToComment(commentId, content, author) {
        try {
            const parent = await apiFetch(`/api/admin/comments/${encodeURIComponent(commentId)}`);
            const replies = Array.isArray(parent.replies) ? parent.replies : [];
            replies.push({
                id: randomId(),
                content,
                authorId: author?.id,
                authorName: author?.name,
                createdAt: new Date().toISOString()
            });

            return await apiFetch(`/api/admin/comments/${encodeURIComponent(commentId)}`, {
                method: 'PATCH',
                body: { replies }
            });
        } catch (error) {
            console.error('Error replying to comment:', error);
            throw error;
        }
    }
};

export const assignmentService = {
    async createAssignment(data) {
        try {
            const assignment = await apiFetch('/api/admin/assignments', {
                method: 'POST',
                body: {
                    storyId: data.storyId,
                    storyTitle: data.storyTitle,
                    assignedToId: data.assignedToId,
                    assignedToName: data.assignedToName,
                    assignedById: data.assignedById,
                    assignedByName: data.assignedByName,
                    deadline: data.deadline,
                    notes: data.notes
                }
            });

            await notificationService.create({
                type: 'assignment',
                userId: data.assignedToId,
                title: 'New Assignment',
                message: `You've been assigned to "${data.storyTitle}"`,
                link: `/admin/edit/${data.storyId}`
            });

            return assignment;
        } catch (error) {
            console.error('Error creating assignment:', error);
            throw error;
        }
    },

    async getAssignments(filters = {}) {
        try {
            return await listDocuments('/api/admin/assignments', {
                assignedToId: filters.assignedToId,
                status: filters.status,
                storyId: filters.storyId
            });
        } catch (error) {
            console.error('Error fetching assignments:', error);
            return [];
        }
    },

    async updateAssignmentStatus(assignmentId, status, userId, userName) {
        try {
            const assignment = await apiFetch(`/api/admin/assignments/${encodeURIComponent(assignmentId)}`, {
                method: 'PATCH',
                body: { status }
            });

            await activityService.log({
                type: 'assignment_updated',
                storyId: assignment.storyId,
                details: { status, assignmentId },
                userId,
                userName
            });

            return assignment;
        } catch (error) {
            console.error('Error updating assignment:', error);
            throw error;
        }
    },

    async deleteAssignment(assignmentId) {
        try {
            await apiFetch(`/api/admin/assignments/${encodeURIComponent(assignmentId)}`, { method: 'DELETE' });
            return true;
        } catch (error) {
            console.error('Error deleting assignment:', error);
            return false;
        }
    },

    async getUpcomingDeadlines(days = 7) {
        try {
            const now = Date.now();
            const future = now + days * 24 * 60 * 60 * 1000;
            const assignments = await this.getAssignments();
            return assignments
                .filter(a => {
                    if (!a.deadline || a.status === 'completed') return false;
                    const time = new Date(a.deadline).getTime();
                    return time >= now && time <= future;
                })
                .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
        } catch (error) {
            console.error('Error fetching upcoming deadlines:', error);
            return [];
        }
    },

    async getOverdueAssignments() {
        try {
            const now = Date.now();
            const assignments = await this.getAssignments();
            return assignments
                .filter(a => a.deadline && a.status !== 'completed' && new Date(a.deadline).getTime() < now)
                .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
        } catch (error) {
            console.error('Error fetching overdue assignments:', error);
            return [];
        }
    }
};

export const notificationService = {
    async create(data) {
        try {
            return await apiFetch('/api/admin/notifications', {
                method: 'POST',
                body: {
                    userId: data.userId,
                    type: data.type,
                    title: data.title,
                    message: data.message,
                    link: data.link
                }
            });
        } catch (error) {
            console.error('Error creating notification:', error);
            throw error;
        }
    },

    async getNotifications(userId, options = {}) {
        try {
            const notifications = await listDocuments('/api/admin/notifications', { userId });
            const limited = notifications.slice(0, options.limit || 50);
            return options.unreadOnly ? limited.filter(n => !n.read) : limited;
        } catch (error) {
            console.error('Error fetching notifications:', error);
            return [];
        }
    },

    async markAsRead(notificationId) {
        try {
            return await apiFetch(`/api/admin/notifications/${encodeURIComponent(notificationId)}/read`, {
                method: 'PATCH'
            });
        } catch (error) {
            console.error('Error marking notification as read:', error);
            throw error;
        }
    },

    async markAllAsRead(userId) {
        try {
            const notifications = await this.getNotifications(userId, { unreadOnly: true });
            await Promise.all(notifications.map(n => this.markAsRead(n.$id)));
            return true;
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            return false;
        }
    },

    async deleteNotification(notificationId) {
        try {
            await apiFetch(`/api/admin/notifications/${encodeURIComponent(notificationId)}`, { method: 'DELETE' });
            return true;
        } catch (error) {
            console.error('Error deleting notification:', error);
            return false;
        }
    }
};

export const activityService = {
    async log(data) {
        try {
            return await apiFetch('/api/admin/activity', {
                method: 'POST',
                body: {
                    type: data.type,
                    storyId: data.storyId,
                    userId: data.userId,
                    userName: data.userName,
                    details: data.details || {}
                }
            });
        } catch (error) {
            console.error('Error logging activity:', error);
            return null;
        }
    },

    async getActivities(filters = {}) {
        try {
            return await listDocuments('/api/admin/activity', {
                storyId: filters.storyId,
                type: filters.type,
                limit: 100
            });
        } catch (error) {
            console.error('Error fetching activities:', error);
            return [];
        }
    },

    async getRecentActivity(hours = 24) {
        try {
            const since = Date.now() - hours * 60 * 60 * 1000;
            const activities = await this.getActivities();
            return activities
                .filter(a => new Date(a.timestamp || a.$createdAt).getTime() >= since)
                .slice(0, 50);
        } catch (error) {
            console.error('Error fetching recent activity:', error);
            return [];
        }
    },

    async logStoryEvent(type, storyId, userId, userName, details = {}) {
        return this.log({ type, storyId, userId, userName, details });
    }
};

export const activityTypes = {
    STORY_CREATED: 'story_created',
    STORY_UPDATED: 'story_updated',
    STORY_PUBLISHED: 'story_published',
    STORY_UNPUBLISHED: 'story_unpublished',
    STORY_DELETED: 'story_deleted',
    STORY_ASSIGNED: 'story_assigned',
    STORY_SUBMITTED: 'story_submitted',
    STORY_APPROVED: 'story_approved',
    STORY_REJECTED: 'story_rejected',
    COMMENT_ADDED: 'comment_added',
    COMMENT_RESOLVED: 'comment_resolved',
    REVISION_CREATED: 'revision_created',
    REVISION_RESTORED: 'revision_restored',
    ASSIGNMENT_CREATED: 'assignment_created',
    ASSIGNMENT_UPDATED: 'assignment_updated',
    USER_INVITED: 'user_invited',
    USER_SUSPENDED: 'user_suspended',
    SETTINGS_UPDATED: 'settings_updated'
};
