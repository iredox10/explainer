import {
    bigserial,
    boolean,
    index,
    integer,
    jsonb,
    pgTable,
    text,
    timestamp,
    uuid,
} from 'drizzle-orm/pg-core';

/* -------------------------------------------------------------------------- */
/* Better Auth core tables                                                     */
/* -------------------------------------------------------------------------- */

export const user = pgTable(
    'user',
    {
        id: text('id').primaryKey(),
        name: text('name').notNull(),
        email: text('email').notNull().unique(),
        emailVerified: boolean('email_verified').notNull().default(false),
        image: text('image'),
        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
        role: text('role'),
        banned: boolean('banned').notNull().default(false),
        banReason: text('ban_reason'),
        banExpires: timestamp('ban_expires', { withTimezone: true }),
    },
    (table) => [index('user_email_idx').on(table.email)],
);

export const session = pgTable(
    'session',
    {
        id: text('id').primaryKey(),
        expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
        token: text('token').notNull().unique(),
        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
        ipAddress: text('ip_address'),
        userAgent: text('user_agent'),
        userId: text('user_id')
            .notNull()
            .references(() => user.id, { onDelete: 'cascade' }),
        impersonatedBy: text('impersonated_by'),
    },
    (table) => [index('session_user_id_idx').on(table.userId)],
);

export const account = pgTable(
    'account',
    {
        id: text('id').primaryKey(),
        accountId: text('account_id').notNull(),
        providerId: text('provider_id').notNull(),
        userId: text('user_id')
            .notNull()
            .references(() => user.id, { onDelete: 'cascade' }),
        accessToken: text('access_token'),
        refreshToken: text('refresh_token'),
        idToken: text('id_token'),
        accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
        refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
        scope: text('scope'),
        password: text('password'),
        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [index('account_user_id_idx').on(table.userId)],
);

export const verification = pgTable(
    'verification',
    {
        id: text('id').primaryKey(),
        identifier: text('identifier').notNull(),
        value: text('value').notNull(),
        expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [index('verification_identifier_idx').on(table.identifier)],
);

/* -------------------------------------------------------------------------- */
/* Editorial                                                                   */
/* -------------------------------------------------------------------------- */

export const stories = pgTable(
    'stories',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        slug: text('slug').notNull().unique(),
        headline: text('headline').notNull(),
        subhead: text('subhead'),
        category: text('category'),
        author: text('author'),
        authorId: text('author_id'),
        editorId: text('editor_id'),
        role: text('role'),
        status: text('status').notNull().default('Draft'),
        workflowStatus: text('workflow_status').notNull().default('draft'),
        layout: text('layout').notNull().default('standard'),
        heroImage: text('hero_image'),
        videoUrl: text('video_url'),
        leftVideoUrl: text('left_video_url'),
        rightVideoUrl: text('right_video_url'),
        ambientAudioUrl: text('ambient_audio_url'),
        content: jsonb('content').$type<unknown[]>().notNull().default([]),
        scrollySections: jsonb('scrolly_sections').$type<unknown[]>().notNull().default([]),
        date: text('date'),
        readTime: text('read_time'),
        seriesSlug: text('series_slug'),
        seriesPart: integer('series_part'),
        isFeatured: boolean('is_featured').notNull().default(false),
        lockedBy: text('locked_by'),
        versionLog: jsonb('version_log').$type<unknown>(),
        tags: jsonb('tags').$type<string[]>().notNull().default([]),
        sources: jsonb('sources').$type<unknown[]>().notNull().default([]),
        footnotes: jsonb('footnotes').$type<unknown[]>().notNull().default([]),
        related: jsonb('related').$type<unknown[]>().notNull().default([]),
        seo: jsonb('seo').$type<Record<string, unknown>>().notNull().default({}),
        revisionSnapshots: jsonb('revision_snapshots').$type<unknown[]>().notNull().default([]),
        publishedAt: timestamp('published_at', { withTimezone: true }),
        scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [
        index('stories_status_idx').on(table.status),
        index('stories_published_at_idx').on(table.publishedAt),
        index('stories_category_idx').on(table.category),
        index('stories_series_idx').on(table.seriesSlug),
        index('stories_schedule_idx').on(table.status, table.scheduledAt),
    ],
);

export const authors = pgTable(
    'authors',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        name: text('name').notNull(),
        email: text('email').unique(),
        role: text('role'),
        bio: text('bio'),
        slug: text('slug').notNull().unique(),
        imageUrl: text('image_url'),
        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [index('authors_slug_idx').on(table.slug)],
);

export const categories = pgTable(
    'categories',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        name: text('name').notNull(),
        slug: text('slug').notNull().unique(),
        color: text('color').notNull().default('#000000'),
        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [index('categories_slug_idx').on(table.slug)],
);

export const profiles = pgTable(
    'profiles',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        userId: text('user_id')
            .notNull()
            .unique()
            .references(() => user.id, { onDelete: 'cascade' }),
        email: text('email').notNull(),
        name: text('name').notNull(),
        role: text('role').notNull().default('staff_writer'),
        status: text('status').notNull().default('active'),
        categories: jsonb('categories').$type<string[]>().notNull().default([]),
        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [
        index('profiles_user_id_idx').on(table.userId),
        index('profiles_role_idx').on(table.role),
    ],
);

export const invites = pgTable(
    'invites',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        email: text('email').notNull(),
        name: text('name').notNull(),
        role: text('role').notNull().default('staff_writer'),
        categories: jsonb('categories').$type<string[]>().notNull().default([]),
        tokenHash: text('token_hash').notNull().unique(),
        invitedBy: text('invited_by'),
        expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
        acceptedAt: timestamp('accepted_at', { withTimezone: true }),
        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [index('invites_email_idx').on(table.email)],
);

export const settings = pgTable('settings', {
    id: integer('id').primaryKey().default(1),
    siteName: text('site_name').notNull().default('Explainer'),
    maintenanceMode: boolean('maintenance_mode').notNull().default(false),
    breakingNewsActive: boolean('breaking_news_active').notNull().default(false),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/* -------------------------------------------------------------------------- */
/* Media                                                                       */
/* -------------------------------------------------------------------------- */

export const media = pgTable(
    'media',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        storageKey: text('storage_key').notNull().unique(),
        filename: text('filename').notNull(),
        originalName: text('original_name'),
        mimeType: text('mime_type'),
        size: integer('size'),
        url: text('url').notNull(),
        tags: jsonb('tags').$type<string[]>().notNull().default([]),
        usage: jsonb('usage').$type<string[]>().notNull().default([]),
        caption: text('caption'),
        altText: text('alt_text'),
        width: integer('width'),
        height: integer('height'),
        uploadedBy: text('uploaded_by'),
        uploadedAt: timestamp('uploaded_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [
        index('media_uploaded_at_idx').on(table.uploadedAt),
        index('media_mime_type_idx').on(table.mimeType),
    ],
);

/* -------------------------------------------------------------------------- */
/* Audience & analytics                                                        */
/* -------------------------------------------------------------------------- */

export const subscribers = pgTable(
    'subscribers',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        email: text('email').notNull().unique(),
        status: text('status').notNull().default('active'),
        subscribedAt: timestamp('subscribed_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [index('subscribers_status_idx').on(table.status)],
);

export const campaigns = pgTable(
    'campaigns',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        subject: text('subject').notNull(),
        html: text('html'),
        text: text('text'),
        status: text('status').notNull().default('draft'),
        totalRecipients: integer('total_recipients').notNull().default(0),
        sentCount: integer('sent_count').notNull().default(0),
        failedCount: integer('failed_count').notNull().default(0),
        openCount: integer('open_count').notNull().default(0),
        clickCount: integer('click_count').notNull().default(0),
        sentAt: timestamp('sent_at', { withTimezone: true }),
        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [index('campaigns_sent_at_idx').on(table.sentAt)],
);

export const analyticsEvents = pgTable(
    'analytics_events',
    {
        id: bigserial('id', { mode: 'number' }).primaryKey(),
        storyId: text('story_id'),
        visitorId: text('visitor_id').notNull(),
        path: text('path').notNull(),
        referrer: text('referrer'),
        device: text('device'),
        userAgent: text('user_agent'),
        timeOnPage: integer('time_on_page'),
        eventDate: text('event_date').notNull(),
        timestamp: timestamp('timestamp', { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [
        index('analytics_story_id_idx').on(table.storyId),
        index('analytics_visitor_id_idx').on(table.visitorId),
        index('analytics_timestamp_idx').on(table.timestamp),
        index('analytics_date_idx').on(table.eventDate),
    ],
);

export const scrollDepth = pgTable(
    'scroll_depth',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        storyId: text('story_id').notNull(),
        visitorId: text('visitor_id').notNull(),
        maxDepth: integer('max_depth').notNull(),
        currentStep: integer('current_step'),
        totalSteps: integer('total_steps'),
        viewport: text('viewport'),
        timestamp: timestamp('timestamp', { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [
        index('scroll_depth_story_id_idx').on(table.storyId),
        index('scroll_depth_visitor_id_idx').on(table.visitorId),
    ],
);

/* -------------------------------------------------------------------------- */
/* Newsroom collaboration                                                      */
/* -------------------------------------------------------------------------- */

export const comments = pgTable(
    'comments',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        storyId: text('story_id').notNull(),
        blockId: text('block_id').notNull(),
        content: text('content').notNull(),
        authorId: text('author_id').notNull(),
        authorName: text('author_name').notNull(),
        authorEmail: text('author_email'),
        resolved: boolean('resolved').notNull().default(false),
        resolvedAt: timestamp('resolved_at', { withTimezone: true }),
        resolvedById: text('resolved_by_id'),
        resolvedByName: text('resolved_by_name'),
        replies: jsonb('replies').$type<unknown[]>().notNull().default([]),
        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [
        index('comments_story_id_idx').on(table.storyId),
        index('comments_block_id_idx').on(table.blockId),
        index('comments_resolved_idx').on(table.resolved),
    ],
);

export const activityLog = pgTable(
    'activity_log',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        type: text('type').notNull(),
        storyId: text('story_id'),
        userId: text('user_id'),
        userName: text('user_name'),
        details: jsonb('details').$type<Record<string, unknown>>(),
        timestamp: timestamp('timestamp', { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [
        index('activity_log_type_idx').on(table.type),
        index('activity_log_story_id_idx').on(table.storyId),
        index('activity_log_user_id_idx').on(table.userId),
        index('activity_log_timestamp_idx').on(table.timestamp),
    ],
);

export const notifications = pgTable(
    'notifications',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        userId: text('user_id').notNull(),
        type: text('type').notNull(),
        title: text('title').notNull(),
        message: text('message'),
        link: text('link'),
        read: boolean('read').notNull().default(false),
        readAt: timestamp('read_at', { withTimezone: true }),
        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [
        index('notifications_user_id_idx').on(table.userId),
        index('notifications_read_idx').on(table.read),
    ],
);

export const assignments = pgTable(
    'assignments',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        storyId: text('story_id').notNull(),
        storyTitle: text('story_title').notNull(),
        assignedToId: text('assigned_to_id').notNull(),
        assignedToName: text('assigned_to_name').notNull(),
        assignedById: text('assigned_by_id'),
        assignedByName: text('assigned_by_name'),
        deadline: timestamp('deadline', { withTimezone: true }).notNull(),
        status: text('status').notNull().default('assigned'),
        notes: text('notes'),
        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
        completedAt: timestamp('completed_at', { withTimezone: true }),
    },
    (table) => [
        index('assignments_story_id_idx').on(table.storyId),
        index('assignments_assigned_to_idx').on(table.assignedToId),
        index('assignments_deadline_idx').on(table.deadline),
        index('assignments_status_idx').on(table.status),
    ],
);
