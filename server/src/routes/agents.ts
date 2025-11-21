import { Router, Request, Response } from 'express';
import { BaseAgent } from '../agents/BaseAgent';
import { AgentType } from '../types';

/**
 * Agent 路由
 */
export function createAgentRouter(agents: Map<AgentType, BaseAgent>) {
  const router = Router();

  /**
   * GET /api/agents
   * 获取所有 Agent 列表
   */
  router.get('/', async (req: Request, res: Response) => {
    try {
      const agentList = [];

      for (const [id, agent] of agents.entries()) {
        const status = await agent.getStatus();
        agentList.push({
          id,
          name: agent.getName(),
          logoUrl: agent.getLogoUrl(),
          loginUrl: agent.getLoginUrl(),
          ...status
        });
      }

      res.json({ agents: agentList });
    } catch (error) {
      console.error('Error getting agents:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  /**
   * GET /api/agents/:agentId/status
   * 获取指定 Agent 的状态
   */
  router.get('/:agentId/status', async (req: Request, res: Response) => {
    try {
      const { agentId } = req.params;
      const agent = agents.get(agentId as AgentType);

      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      const status = await agent.getStatus();
      res.json(status);
    } catch (error) {
      console.error('Error getting agent status:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  /**
   * POST /api/agents/:agentId/login
   * 设置 Agent 的登录凭证
   */
  router.post('/:agentId/login', async (req: Request, res: Response) => {
    try {
      const { agentId } = req.params;
      const { credentials } = req.body;

      const agent = agents.get(agentId as AgentType);

      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      if (!credentials) {
        return res.status(400).json({ error: 'Credentials are required' });
      }

      agent.setCredentials(credentials);

      // 检查凭证是否有效
      const status = await agent.getStatus();

      res.json({
        success: true,
        status
      });
    } catch (error) {
      console.error('Error setting credentials:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}
