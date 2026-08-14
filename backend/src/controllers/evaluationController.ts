import { Request, Response } from 'express';
import { db } from '../db/index';
import { projects } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import * as evaluationService from '../services/evaluationService';

/**
 * Controller to manage LLM Evaluation Suite endpoints.
 */
export const evaluationController = {
  /**
   * Triggers a real evaluation run for the project.
   * POST /api/projects/:projectId/evaluations/run
   */
  run: async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user;
      const { projectId } = req.params;

      if (!authUser) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHENTICATED', message: 'Authentication required' }
        });
      }

      // 1. Verify project ownership for security
      const projectRecords = await db.select().from(projects).where(
        and(eq(projects.id, projectId), eq(projects.userId, authUser.userId))
      );

      if (projectRecords.length === 0) {
        return res.status(404).json({
          success: false,
          error: { code: 'PROJECT_NOT_FOUND', message: 'Project not found or access denied.' }
        });
      }

      console.log(`[Evaluation Suite] Triggering run for project ${projectId} by user ${authUser.userId}`);

      // 2. Execute RAG Evaluation run
      const report = await evaluationService.executeEvaluationRun(projectId);

      return res.json({
        success: true,
        runId: report.runId,
        status: 'completed',
        totalQuestions: report.totalQuestions,
        completedQuestions: report.completedQuestions,
        averageScore: report.averageScore,
        report,
      });

    } catch (error: any) {
      console.error('[Evaluation Controller] Run failed:', error);
      return res.status(500).json({
        success: false,
        error: { code: 'EVALUATION_FAILED', message: error.message || 'RAG evaluation run failed.' }
      });
    }
  },

  /**
   * Retrieves previous evaluation runs.
   * GET /api/projects/:projectId/evaluations
   */
  listRuns: async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user;
      const { projectId } = req.params;

      if (!authUser) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHENTICATED', message: 'Authentication required' }
        });
      }

      // Verify project ownership
      const projectRecords = await db.select().from(projects).where(
        and(eq(projects.id, projectId), eq(projects.userId, authUser.userId))
      );

      if (projectRecords.length === 0) {
        return res.status(404).json({
          success: false,
          error: { code: 'PROJECT_NOT_FOUND', message: 'Project not found or access denied.' }
        });
      }

      const runs = await evaluationService.getPreviousRuns(projectId);

      return res.json({
        success: true,
        runs,
      });

    } catch (error: any) {
      console.error('[Evaluation Controller] List runs failed:', error);
      return res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Internal server error occurred.' }
      });
    }
  },

  /**
   * Retrieves summary details of a specific run.
   * GET /api/projects/:projectId/evaluations/:runId
   */
  getRun: async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user;
      const { projectId, runId } = req.params;

      if (!authUser) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHENTICATED', message: 'Authentication required' }
        });
      }

      // Verify project ownership
      const projectRecords = await db.select().from(projects).where(
        and(eq(projects.id, projectId), eq(projects.userId, authUser.userId))
      );

      if (projectRecords.length === 0) {
        return res.status(404).json({
          success: false,
          error: { code: 'PROJECT_NOT_FOUND', message: 'Project not found or access denied.' }
        });
      }

      const runDetails = await evaluationService.getRunDetails(projectId, runId);
      if (!runDetails) {
        return res.status(404).json({
          success: false,
          error: { code: 'RUN_NOT_FOUND', message: 'Evaluation run not found.' }
        });
      }

      return res.json({
        success: true,
        run: runDetails,
      });

    } catch (error: any) {
      console.error('[Evaluation Controller] Get run failed:', error);
      return res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Internal server error occurred.' }
      });
    }
  },

  /**
   * Retrieves individual question results for a run.
   * GET /api/projects/:projectId/evaluations/:runId/results
   */
  getResults: async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user;
      const { projectId, runId } = req.params;

      if (!authUser) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHENTICATED', message: 'Authentication required' }
        });
      }

      // Verify project ownership
      const projectRecords = await db.select().from(projects).where(
        and(eq(projects.id, projectId), eq(projects.userId, authUser.userId))
      );

      if (projectRecords.length === 0) {
        return res.status(404).json({
          success: false,
          error: { code: 'PROJECT_NOT_FOUND', message: 'Project not found or access denied.' }
        });
      }

      const results = await evaluationService.getRunQuestionResults(projectId, runId);

      return res.json({
        success: true,
        results,
      });

    } catch (error: any) {
      console.error('[Evaluation Controller] Get results failed:', error);
      return res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Internal server error occurred.' }
      });
    }
  }
};
