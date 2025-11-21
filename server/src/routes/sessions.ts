import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { StorageService } from '../services/StorageService';
import { Session } from '../types';

/**
 * 会话路由
 */
export function createSessionRouter(storage: StorageService) {
  const router = Router();

  /**
   * GET /api/sessions
   * 获取所有会话
   */
  router.get('/', (req: Request, res: Response) => {
    try {
      const sessions = storage.getAllSessions();
      res.json({ sessions });
    } catch (error) {
      console.error('Error getting sessions:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  /**
   * GET /api/sessions/:id
   * 获取指定会话
   */
  router.get('/:id', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const session = storage.getSession(id);

      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      res.json(session);
    } catch (error) {
      console.error('Error getting session:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  /**
   * POST /api/sessions
   * 创建新会话
   */
  router.post('/', (req: Request, res: Response) => {
    try {
      const { name, agents } = req.body;

      if (!name || !agents || !Array.isArray(agents)) {
        return res.status(400).json({
          error: 'name and agents are required'
        });
      }

      const session: Session = {
        id: uuidv4(),
        name,
        agents,
        contexts: {},
        createdAt: new Date(),
        lastActivityAt: new Date()
      };

      storage.saveSession(session);
      res.json(session);
    } catch (error) {
      console.error('Error creating session:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  /**
   * PUT /api/sessions/:id
   * 更新会话
   */
  router.put('/:id', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, agents, contexts } = req.body;

      const session = storage.getSession(id);

      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      if (name) session.name = name;
      if (agents) session.agents = agents;
      if (contexts) session.contexts = contexts;
      session.lastActivityAt = new Date();

      storage.saveSession(session);
      res.json(session);
    } catch (error) {
      console.error('Error updating session:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  /**
   * DELETE /api/sessions/:id
   * 删除会话
   */
  router.delete('/:id', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      storage.deleteSession(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting session:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  /**
   * GET /api/sessions/:id/messages
   * 获取会话的所有消息
   */
  router.get('/:id/messages', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const messages = storage.getSessionMessages(id);
      res.json({ messages });
    } catch (error) {
      console.error('Error getting messages:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}
