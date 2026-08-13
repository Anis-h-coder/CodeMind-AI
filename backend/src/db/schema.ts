import { pgTable, uuid, text, timestamp, integer, real, index, customType } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Custom type for pgvector embeddings supporting 768 dimensions (Gemini text-embedding-004)
export const pgVector = customType<{ data: number[] }>({
  dataType() {
    return 'vector(768)';
  },
  toDriver(value) {
    if (Array.isArray(value)) {
      return `[${value.join(',')}]`;
    }
    return value as any;
  },
  fromDriver(value) {
    if (typeof value === 'string') {
      return value
        .replace(/[\[\]]/g, '')
        .split(',')
        .map((x) => parseFloat(x));
    }
    return value as number[];
  },
});

// Users table
export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('idx_users_email').on(table.email),
  ]
);

// Projects table
export const projects = pgTable(
  'projects',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    name: text('name').notNull(),
    description: text('description').default('').notNull(),
    githubUrl: text('github_url'),
    status: text('status').default('ready').notNull(), // 'ready', 'syncing', 'error'
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('idx_projects_user_id').on(table.userId),
  ]
);

// Repositories table
export const repositories = pgTable(
  'repositories',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    projectId: uuid('project_id')
      .references(() => projects.id, { onDelete: 'cascade' })
      .notNull(),
    owner: text('owner').notNull(),
    repositoryName: text('repository_name').notNull(),
    githubUrl: text('github_url').notNull(),
    defaultBranch: text('default_branch').default('main').notNull(),
    language: text('language').default('TypeScript').notNull(),
    stars: integer('stars').default(0).notNull(),
    lastIndexedAt: timestamp('last_indexed_at'),
    indexingStatus: text('indexing_status').default('idle').notNull(), // 'idle', 'indexing', 'completed', 'failed'
    totalFiles: integer('total_files').default(0).notNull(),
    processedFiles: integer('processed_files').default(0).notNull(),
    skippedFiles: integer('skipped_files').default(0).notNull(),
    failedFiles: integer('failed_files').default(0).notNull(),
    indexingError: text('indexing_error'),
    currentFile: text('current_file'),
    indexingDiagnostics: text('indexing_diagnostics'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('idx_repositories_project_id').on(table.projectId),
  ]
);

// Files table
export const files = pgTable(
  'files',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    repositoryId: uuid('repository_id')
      .references(() => repositories.id, { onDelete: 'cascade' })
      .notNull(),
    path: text('path').notNull(),
    name: text('name').notNull(),
    extension: text('extension').notNull(),
    language: text('language').notNull(),
    size: integer('size').default(0).notNull(),
    content: text('content').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('idx_files_repository_id').on(table.repositoryId),
  ]
);

// Document Chunks table
export const documentChunks = pgTable(
  'document_chunks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    projectId: uuid('project_id')
      .references(() => projects.id, { onDelete: 'cascade' })
      .notNull(),
    sourceType: text('source_type').notNull(), // 'github_file', 'uploaded_doc'
    sourceName: text('source_name').notNull(),
    filePath: text('file_path').notNull(),
    chunkIndex: integer('chunk_index').notNull(),
    content: text('content').notNull(),
    embedding: pgVector('embedding'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('idx_chunks_project_id').on(table.projectId),
  ]
);

// Conversations table
export const conversations = pgTable(
  'conversations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    projectId: uuid('project_id')
      .references(() => projects.id, { onDelete: 'cascade' })
      .notNull(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    title: text('title').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('idx_conversations_project_id').on(table.projectId),
    index('idx_conversations_user_id').on(table.userId),
  ]
);

// Messages table
export const messages = pgTable(
  'messages',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    conversationId: uuid('conversation_id')
      .references(() => conversations.id, { onDelete: 'cascade' })
      .notNull(),
    role: text('role').notNull(), // 'user', 'assistant'
    content: text('content').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('idx_messages_conversation_id').on(table.conversationId),
  ]
);

// SQL Queries table
export const sqlQueries = pgTable(
  'sql_queries',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    projectId: uuid('project_id')
      .references(() => projects.id, { onDelete: 'cascade' })
      .notNull(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    naturalLanguageQuestion: text('natural_language_question').notNull(),
    generatedSql: text('generated_sql').notNull(),
    executionTime: real('execution_time').default(0).notNull(), // millisecond latency
    rowCount: integer('row_count').default(0).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('idx_sql_queries_project_id').on(table.projectId),
    index('idx_sql_queries_user_id').on(table.userId),
  ]
);

// Evaluations table
export const evaluations = pgTable(
  'evaluations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    projectId: uuid('project_id')
      .references(() => projects.id, { onDelete: 'cascade' })
      .notNull(),
    question: text('question').notNull(),
    expectedAnswer: text('expected_answer').notNull(),
    retrievedContext: text('retrieved_context').notNull(),
    generatedAnswer: text('generated_answer').notNull(),
    relevanceScore: real('relevance_score').default(0).notNull(),
    faithfulnessScore: real('faithfulness_score').default(0).notNull(),
    contextRelevanceScore: real('context_relevance_score').default(0).notNull(),
    contextRecallScore: real('context_recall_score').default(0).notNull(),
    retrievalScore: real('retrieval_score').default(0).notNull(),
    latency: real('latency').default(0).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    
    // Step 6 Run columns
    runId: text('run_id'),
    retrievalRecall: real('retrieval_recall'),
    citationPrecision: real('citation_precision'),
    retrievalLatencyMs: real('retrieval_latency_ms'),
    generationLatencyMs: real('generation_latency_ms'),
    totalLatencyMs: real('total_latency_ms'),
    reasoning: text('reasoning'),
  },
  (table) => [
    index('idx_evaluations_project_id').on(table.projectId),
  ]
);

// DATABASE RELATIONSHIPS
export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
  conversations: many(conversations),
  sqlQueries: many(sqlQueries),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, {
    fields: [projects.userId],
    references: [users.id],
  }),
  repositories: many(repositories),
  documentChunks: many(documentChunks),
  conversations: many(conversations),
  sqlQueries: many(sqlQueries),
  evaluations: many(evaluations),
}));

export const repositoriesRelations = relations(repositories, ({ one, many }) => ({
  project: one(projects, {
    fields: [repositories.projectId],
    references: [projects.id],
  }),
  files: many(files),
}));

export const filesRelations = relations(files, ({ one }) => ({
  repository: one(repositories, {
    fields: [files.repositoryId],
    references: [repositories.id],
  }),
}));

export const documentChunksRelations = relations(documentChunks, ({ one }) => ({
  project: one(projects, {
    fields: [documentChunks.projectId],
    references: [projects.id],
  }),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  project: one(projects, {
    fields: [conversations.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [conversations.userId],
    references: [users.id],
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
}));

export const sqlQueriesRelations = relations(sqlQueries, ({ one }) => ({
  project: one(projects, {
    fields: [sqlQueries.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [sqlQueries.userId],
    references: [users.id],
  }),
}));

export const evaluationsRelations = relations(evaluations, ({ one }) => ({
  project: one(projects, {
    fields: [evaluations.projectId],
    references: [projects.id],
  }),
}));
