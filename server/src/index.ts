import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { StorageService } from './services/StorageService';
import { createAgentRouter } from './routes/agents';
import { createChatRouter } from './routes/chat';
import { createSessionRouter } from './routes/sessions';
import { BaseAgent } from './agents/BaseAgent';
import { KimiAgent } from './agents/KimiAgent';
import { ChatGPTAgent } from './agents/ChatGPTAgent';
import { ClaudeAgent } from './agents/ClaudeAgent';
import { DeepSeekAgent } from './agents/DeepSeekAgent';
import { AgentType } from './types';

// 加载环境变量
dotenv.config();

const PORT = process.env.PORT || 3001;
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../data/roundtable.db');
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-me';

/**
 * 主应用程序
 */
class App {
  private app: express.Application;
  private storage: StorageService;
  private agents: Map<AgentType, BaseAgent>;

  constructor() {
    this.app = express();
    this.storage = new StorageService(DB_PATH, ENCRYPTION_KEY);
    this.agents = new Map();

    this.initializeMiddlewares();
    this.initializeAgents();
    this.initializeRoutes();
  }

  /**
   * 初始化中间件
   */
  private initializeMiddlewares(): void {
    // CORS
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      credentials: true
    }));

    // JSON 解析
    this.app.use(express.json());

    // 请求日志
    this.app.use((req, res, next) => {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
      next();
    });
  }

  /**
   * 初始化 Agent 实例
   */
  private initializeAgents(): void {
    this.agents.set('kimi', new KimiAgent());
    this.agents.set('chatgpt', new ChatGPTAgent());
    this.agents.set('claude', new ClaudeAgent());
    this.agents.set('deepseek', new DeepSeekAgent());

    console.log(`✅ ${this.agents.size} Agents initialized:`, Array.from(this.agents.keys()));
  }

  /**
   * 初始化路由
   */
  private initializeRoutes(): void {
    // 健康检查
    this.app.get('/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // API 路由
    this.app.use('/api/agents', createAgentRouter(this.agents));
    this.app.use('/api/chat', createChatRouter(this.agents));
    this.app.use('/api/sessions', createSessionRouter(this.storage));

    // 404 处理
    this.app.use((req, res) => {
      res.status(404).json({ error: 'Not found' });
    });

    // 错误处理
    this.app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('Error:', err);
      res.status(500).json({ error: 'Internal server error' });
    });
  }

  /**
   * 启动服务器
   */
  public listen(): void {
    this.app.listen(PORT, () => {
      console.log('='.repeat(50));
      console.log('🚀 RoundTable AI Server');
      console.log('='.repeat(50));
      console.log(`📡 Server running on: http://localhost:${PORT}`);
      console.log(`💾 Database: ${DB_PATH}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('='.repeat(50));
    });
  }

  /**
   * 关闭服务器
   */
  public close(): void {
    this.storage.close();
  }
}

// 启动应用
const app = new App();
app.listen();

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down gracefully...');
  app.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Shutting down gracefully...');
  app.close();
  process.exit(0);
});
