import { Router, Request, Response } from 'express';
import { BaseAgent } from '../agents/BaseAgent';
import { AgentType, StreamCallbackParam, StreamResponse } from '../types';

/**
 * 对话路由
 */
export function createChatRouter(agents: Map<AgentType, BaseAgent>) {
  const router = Router();

  /**
   * POST /api/chat
   * 发送消息到多个 Agent（SSE 流式响应）
   */
  router.post('/', async (req: Request, res: Response) => {
    try {
      const { message, agents: agentIds, sessionId } = req.body;

      if (!message || !agentIds || !sessionId) {
        return res.status(400).json({
          error: 'message, agents, and sessionId are required'
        });
      }

      // 设置 SSE 响应头
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // 响应回调函数
      const onUpdateResponse = (param: StreamCallbackParam, response: StreamResponse) => {
        const data = JSON.stringify({
          agentId: param.agentId,
          sessionId: param.sessionId,
          ...response
        });

        res.write(`data: ${data}\n\n`);

        // 如果响应完成且有错误，记录日志
        if (response.done && response.error) {
          console.error(`[${param.agentId}] Error:`, response.error);
        }
      };

      // 并行发送到所有 Agent
      const promises = agentIds.map(async (agentId: AgentType) => {
        const agent = agents.get(agentId);
        if (!agent) {
          onUpdateResponse(
            { agentId, sessionId },
            {
              content: '',
              done: true,
              error: `Agent ${agentId} not found`
            }
          );
          return;
        }

        try {
          await agent.sendPrompt(message, sessionId, onUpdateResponse);
        } catch (error) {
          console.error(`[${agentId}] Error:`, error);
          onUpdateResponse(
            { agentId, sessionId },
            {
              content: '',
              done: true,
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          );
        }
      });

      // 等待所有 Agent 完成
      await Promise.all(promises);

      // 发送结束标记
      res.write('data: [DONE]\n\n');
      res.end();
    } catch (error) {
      console.error('Error in chat:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.end();
      }
    }
  });

  return router;
}
