import Database from 'better-sqlite3';
import * as crypto from 'crypto';
import * as path from 'path';
import * as fs from 'fs';
import { Session, Message, AgentConfig, AgentType } from '../types';

/**
 * 存储服务
 *
 * 职责：
 * 1. 管理 SQLite 数据库
 * 2. 提供数据持久化接口
 * 3. 加密/解密敏感数据
 */
export class StorageService {
  private db: Database.Database;
  private encryptionKey: Buffer;

  constructor(dbPath: string, encryptionKey: string) {
    // 确保数据目录存在
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.db = new Database(dbPath);
    this.encryptionKey = Buffer.from(encryptionKey, 'utf-8').slice(0, 32);

    this.initDatabase();
  }

  /**
   * 初始化数据库表结构
   */
  private initDatabase(): void {
    // Agent 配置表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS agent_configs (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        logo_url TEXT,
        login_url TEXT,
        is_enabled INTEGER DEFAULT 1,
        credentials TEXT,
        settings TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 会话表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        agents TEXT NOT NULL,
        contexts TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_activity_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 消息表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        role TEXT NOT NULL,
        agent_id TEXT,
        content TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
      )
    `);

    // 创建索引
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id);
      CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
    `);
  }

  // ==================== 加密/解密 ====================

  /**
   * 加密数据
   */
  private encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', this.encryptionKey, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * 解密数据
   */
  private decrypt(text: string): string {
    const parts = text.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];
    const decipher = crypto.createDecipheriv('aes-256-cbc', this.encryptionKey, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  // ==================== Agent 配置管理 ====================

  /**
   * 保存 Agent 配置
   */
  public saveAgentConfig(config: AgentConfig): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO agent_configs (id, name, logo_url, login_url, is_enabled, credentials, settings, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    stmt.run(
      config.id,
      config.name,
      config.logoUrl || null,
      config.loginUrl || null,
      config.isEnabled ? 1 : 0,
      config.credentials ? this.encrypt(JSON.stringify(config.credentials)) : null,
      config.settings ? JSON.stringify(config.settings) : null
    );
  }

  /**
   * 获取 Agent 配置
   */
  public getAgentConfig(id: AgentType): AgentConfig | null {
    const stmt = this.db.prepare('SELECT * FROM agent_configs WHERE id = ?');
    const row = stmt.get(id) as any;

    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      logoUrl: row.logo_url,
      loginUrl: row.login_url,
      isEnabled: row.is_enabled === 1,
      credentials: row.credentials ? JSON.parse(this.decrypt(row.credentials)) : undefined,
      settings: row.settings ? JSON.parse(row.settings) : undefined
    };
  }

  /**
   * 获取所有 Agent 配置
   */
  public getAllAgentConfigs(): AgentConfig[] {
    const stmt = this.db.prepare('SELECT * FROM agent_configs ORDER BY created_at');
    const rows = stmt.all() as any[];

    return rows.map(row => ({
      id: row.id,
      name: row.name,
      logoUrl: row.logo_url,
      loginUrl: row.login_url,
      isEnabled: row.is_enabled === 1,
      credentials: row.credentials ? JSON.parse(this.decrypt(row.credentials)) : undefined,
      settings: row.settings ? JSON.parse(row.settings) : undefined
    }));
  }

  /**
   * 删除 Agent 配置
   */
  public deleteAgentConfig(id: AgentType): void {
    const stmt = this.db.prepare('DELETE FROM agent_configs WHERE id = ?');
    stmt.run(id);
  }

  // ==================== 会话管理 ====================

  /**
   * 保存会话
   */
  public saveSession(session: Session): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO sessions (id, name, agents, contexts, last_activity_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(
      session.id,
      session.name,
      JSON.stringify(session.agents),
      JSON.stringify(session.contexts),
      session.lastActivityAt.toISOString()
    );
  }

  /**
   * 获取会话
   */
  public getSession(id: string): Session | null {
    const stmt = this.db.prepare('SELECT * FROM sessions WHERE id = ?');
    const row = stmt.get(id) as any;

    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      agents: JSON.parse(row.agents),
      contexts: JSON.parse(row.contexts),
      createdAt: new Date(row.created_at),
      lastActivityAt: new Date(row.last_activity_at)
    };
  }

  /**
   * 获取所有会话
   */
  public getAllSessions(): Session[] {
    const stmt = this.db.prepare('SELECT * FROM sessions ORDER BY last_activity_at DESC');
    const rows = stmt.all() as any[];

    return rows.map(row => ({
      id: row.id,
      name: row.name,
      agents: JSON.parse(row.agents),
      contexts: JSON.parse(row.contexts),
      createdAt: new Date(row.created_at),
      lastActivityAt: new Date(row.last_activity_at)
    }));
  }

  /**
   * 删除会话
   */
  public deleteSession(id: string): void {
    const stmt = this.db.prepare('DELETE FROM sessions WHERE id = ?');
    stmt.run(id);
  }

  // ==================== 消息管理 ====================

  /**
   * 保存消息
   */
  public saveMessage(message: Message): void {
    const stmt = this.db.prepare(`
      INSERT INTO messages (id, session_id, role, agent_id, content, timestamp)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      message.id,
      message.sessionId,
      message.role,
      message.agentId || null,
      message.content,
      message.timestamp.toISOString()
    );
  }

  /**
   * 获取会话的所有消息
   */
  public getSessionMessages(sessionId: string): Message[] {
    const stmt = this.db.prepare(`
      SELECT * FROM messages
      WHERE session_id = ?
      ORDER BY timestamp ASC
    `);
    const rows = stmt.all(sessionId) as any[];

    return rows.map(row => ({
      id: row.id,
      sessionId: row.session_id,
      role: row.role,
      agentId: row.agent_id,
      content: row.content,
      timestamp: new Date(row.timestamp)
    }));
  }

  /**
   * 关闭数据库连接
   */
  public close(): void {
    this.db.close();
  }
}
