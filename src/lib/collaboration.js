import { databases, DB_ID, COLLECTIONS } from './appwrite';
import { Query, ID } from 'appwrite';

export const commentService = {
    async addComment(storyId, blockId, content, author) {
        try {
            const comment = await databases.createDocument(
                DB_ID,
                COLLECTIONS.COMMENTS,
                ID.unique(),
                {
                    storyId,
                    blockId,
                    content,
                    authorId: author.id,
                    authorName: author.name,
                    authorEmail: author.email,
                    resolved: false,
                    createdAt: new Date().toISOString()
                }
            );
            
            await activityService.log({
                type: 'comment_added',
                storyId,
                details: { blockId, commentId: comment.$id },
                userId: author.id,
                userName: author.name
            });
            
            return comment;
        } catch (error) {
            console.error('Error adding comment:', error);
            throw error;
        }
    },

    async getComments(storyId) {
        try {
            const response = await databases.listDocuments(
                DB_ID,
                COLLECTIONS.COMMENTS,
                [
                    Query.equal('storyId', storyId),
                    Query.orderAsc('createdAt')
                ]
            );
            return response.documents;
        } catch (error) {
            console.error('Error fetching comments:', error);
            return [];
        }
    },

    async resolveComment(commentId, resolvedBy) {
        try {
            const comment = await databases.updateDocument(
                DB_ID,
                COLLECTIONS.COMMENTS,
                commentId,
                {
                    resolved: true,
                    resolvedAt: new Date().toISOString(),
                    resolvedById: resolvedBy.id,
                    resolvedByName: resolvedBy.name
                }
            );
            
            await activityService.log({
                type: 'comment_resolved',
                storyId: comment.storyId,
                details: { commentId },
                userId: resolvedBy.id,
                userName: resolvedBy.name
            });
            
            return comment;
        } catch (error) {
            console.error('Error resolving comment:', error);
            throw error;
        }
    },

    async unresolveComment(commentId, unresolvedBy) {
        try {
            return await databases.updateDocument(
                DB_ID,
                COLLECTIONS.COMMENTS,
                commentId,
                {
                    resolved: false,
                    resolvedAt: null,
                    resolvedById: null,
                    resolvedByName: null
                }
            );
        } catch (error) {
            console.error('Error unresolving comment:', error);
            throw error;
        }
    },

    async deleteComment(commentId) {
        try {
            await databases.deleteDocument(DB_ID, COLLECTIONS.COMMENTS, commentId);
            return true;
        } catch (error) {
            console.error('Error deleting comment:', error);
            return false;
        }
    },

    async replyToComment(commentId, content, author) {
        try {
            const parent = await databases.getDocument(DB_ID, COLLECTIONS.COMMENTS, commentId);
            const replies = parent.replies || [];
            
            const reply = {
                id: ID.unique(),
                content,
                authorId: author.id,
                authorName: author.name,
                createdAt: new Date().toISOString()
            };
            
            replies.push(reply);
            
            return await databases.updateDocument(
                DB_ID,
                COLLECTIONS.COMMENTS,
                commentId,
                { replies }
            );
        } catch (error) {
            console.error('Error replying to comment:', error);
            throw error;
        }
    }
};

export const assignmentService = {
    async createAssignment(data) {
        try {
            const assignment = await databases.createDocument(
                DB_ID,
                COLLECTIONS.ASSIGNMENTS,
                ID.unique(),
                {
                    ...data,
                    status: 'assigned',
                    createdAt: new Date().toISOString()
                }
            );
            
            await activityService.log({
                type: 'story_assigned',
                storyId: data.storyId,
                details: { assignedTo: data.assignedToName, deadline: data.deadline },
                userId: data.assignedById,
                userName: data.assignedByName
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
            const queries = [Query.orderAsc('deadline')];
            
            if (filters.assignedToId) {
                queries.push(Query.equal('assignedToId', filters.assignedToId));
            }
            if (filters.status) {
                queries.push(Query.equal('status', filters.status));
            }
            if (filters.storyId) {
                queries.push(Query.equal('storyId', filters.storyId));
            }
            
            const response = await databases.listDocuments(
                DB_ID,
                COLLECTIONS.ASSIGNMENTS,
                queries
            );
            return response.documents;
        } catch (error) {
            console.error('Error fetching assignments:', error);
            return [];
        }
    },

    async updateAssignmentStatus(assignmentId, status, userId, userName) {
        try {
            const assignment = await databases.updateDocument(
                DB_ID,
                COLLECTIONS.ASSIGNMENTS,
                assignmentId,
                { 
                    status,
                    [status === 'completed' ? 'completedAt' : 'updatedAt']: new Date().toISOString()
                }
            );
            
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
            await databases.deleteDocument(DB_ID, COLLECTIONS.ASSIGNMENTS, assignmentId);
            return true;
        } catch (error) {
            console.error('Error deleting assignment:', error);
            return false;
        }
    },

    async getUpcomingDeadlines(days = 7) {
        try {
            const now = new Date();
            const future = new Date();
            future.setDate(future.getDate() + days);
            
            const response = await databases.listDocuments(
                DB_ID,
                COLLECTIONS.ASSIGNMENTS,
                [
                    Query.greaterThanEqual('deadline', now.toISOString()),
                    Query.lessThanEqual('deadline', future.toISOString()),
                    Query.notEqual('status', 'completed'),
                    Query.orderAsc('deadline')
                ]
            );
            return response.documents;
        } catch (error) {
            console.error('Error fetching upcoming deadlines:', error);
            return [];
        }
    },

    async getOverdueAssignments() {
        try {
            const now = new Date().toISOString();
            const response = await databases.listDocuments(
                DB_ID,
                COLLECTIONS.ASSIGNMENTS,
                [
                    Query.lessThan('deadline', now),
                    Query.notEqual('status', 'completed'),
                    Query.orderAsc('deadline')
                ]
            );
            return response.documents;
        } catch (error) {
            console.error('Error fetching overdue assignments:', error);
            return [];
        }
    }
};

export const notificationService = {
    async create(data) {
        try {
            return await databases.createDocument(
                DB_ID,
                COLLECTIONS.NOTIFICATIONS,
                ID.unique(),
                {
                    ...data,
                    read: false,
                    createdAt: new Date().toISOString()
                }
            );
        } catch (error) {
            console.error('Error creating notification:', error);
            throw error;
        }
    },

    async getNotifications(userId, options = {}) {
        try {
            const queries = [
                Query.equal('userId', userId),
                Query.orderDesc('createdAt'),
                Query.limit(options.limit || 50)
            ];
            
            if (options.unreadOnly) {
                queries.push(Query.equal('read', false));
            }
            
            const response = await databases.listDocuments(
                DB_ID,
                COLLECTIONS.NOTIFICATIONS,
                queries
            );
            return response.documents;
        } catch (error) {
            console.error('Error fetching notifications:', error);
            return [];
        }
    },

    async markAsRead(notificationId) {
        try {
            return await databases.updateDocument(
                DB_ID,
                COLLECTIONS.NOTIFICATIONS,
                notificationId,
                { read: true, readAt: new Date().toISOString() }
            );
        } catch (error) {
            console.error('Error marking notification as read:', error);
            throw error;
        }
    },

    async markAllAsRead(userId) {
        try {
            const notifications = await this.getNotifications(userId, { unreadOnly: true });
            await Promise.all(
                notifications.map(n => this.markAsRead(n.$id))
            );
            return true;
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            return false;
        }
    },

    async deleteNotification(notificationId) {
        try {
            await databases.deleteDocument(DB_ID, COLLECTIONS.NOTIFICATIONS, notificationId);
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
            return await databases.createDocument(
                DB_ID,
                COLLECTIONS.ACTIVITY_LOG,
                ID.unique(),
                {
                    ...data,
                    timestamp: new Date().toISOString()
                }
            );
        } catch (error) {
            console.error('Error logging activity:', error);
            return null;
        }
    },

    async getActivities(filters = {}) {
        try {
            const queries = [Query.orderDesc('timestamp'), Query.limit(100)];
            
            if (filters.storyId) {
                queries.push(Query.equal('storyId', filters.storyId));
            }
            if (filters.userId) {
                queries.push(Query.equal('userId', filters.userId));
            }
            if (filters.type) {
                queries.push(Query.equal('type', filters.type));
            }
            
            const response = await databases.listDocuments(
                DB_ID,
                COLLECTIONS.ACTIVITY_LOG,
                queries
            );
            return response.documents;
        } catch (error) {
            console.error('Error fetching activities:', error);
            return [];
        }
    },

    async getRecentActivity(hours = 24) {
        try {
            const since = new Date();
            since.setHours(since.getHours() - hours);
            
            const response = await databases.listDocuments(
                DB_ID,
                COLLECTIONS.ACTIVITY_LOG,
                [
                    Query.greaterThanEqual('timestamp', since.toISOString()),
                    Query.orderDesc('timestamp'),
                    Query.limit(50)
                ]
            );
            return response.documents;
        } catch (error) {
            console.error('Error fetching recent activity:', error);
            return [];
        }
    },

    async logStoryEvent(type, storyId, userId, userName, details = {}) {
        return this.log({
            type,
            storyId,
            userId,
            userName,
            details
        });
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
