import { useState } from 'react';
import { agentApi, sessionApi, chatApi, Agent, Session, StreamMessage } from '../services/api';

/**
 * API 测试组件
 * 用于验证前后端连接
 */
export default function ApiTest() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [testInput, setTestInput] = useState('你好');
  const [loading, setLoading] = useState(false);

  /**
   * 测试获取 Agent 列表
   */
  const testGetAgents = async () => {
    try {
      setLoading(true);
      const result = await agentApi.getAll();
      setAgents(result.agents);
      alert(`成功获取 ${result.agents.length} 个 Agent`);
    } catch (error) {
      console.error('Error:', error);
      alert('获取 Agent 列表失败');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 测试获取会话列表
   */
  const testGetSessions = async () => {
    try {
      setLoading(true);
      const result = await sessionApi.getAll();
      setSessions(result.sessions);
      alert(`成功获取 ${result.sessions.length} 个会话`);
    } catch (error) {
      console.error('Error:', error);
      alert('获取会话列表失败');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 测试创建新会话
   */
  const testCreateSession = async () => {
    try {
      setLoading(true);
      const session = await sessionApi.create('测试会话', ['kimi', 'chatgpt']);
      setCurrentSession(session);
      alert(`成功创建会话: ${session.id}`);
    } catch (error) {
      console.error('Error:', error);
      alert('创建会话失败');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 测试发送消息（需要先登录 Agent）
   */
  const testSendMessage = async () => {
    if (!currentSession) {
      alert('请先创建会话');
      return;
    }

    try {
      setLoading(true);
      setMessages({});

      await chatApi.sendMessage(
        testInput,
        currentSession.agents,
        currentSession.id,
        (msg: StreamMessage) => {
          setMessages((prev) => ({
            ...prev,
            [msg.agentId]: msg.content
          }));
        },
        (error) => {
          console.error('SSE Error:', error);
          alert('发送消息失败');
        }
      );
    } catch (error) {
      console.error('Error:', error);
      alert('发送消息失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>API 测试工具</h1>

      <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}>
        <h2>状态</h2>
        <p>后端地址: http://localhost:3001</p>
        <p>已加载 Agent: {agents.length} 个</p>
        <p>已加载会话: {sessions.length} 个</p>
        <p>当前会话: {currentSession ? currentSession.id : '无'}</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>测试操作</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={testGetAgents} disabled={loading} style={buttonStyle}>
            获取 Agent 列表
          </button>
          <button onClick={testGetSessions} disabled={loading} style={buttonStyle}>
            获取会话列表
          </button>
          <button onClick={testCreateSession} disabled={loading} style={buttonStyle}>
            创建测试会话
          </button>
        </div>
      </div>

      {agents.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h3>Agent 列表</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            {agents.map((agent) => (
              <div
                key={agent.id}
                style={{
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  backgroundColor: agent.isAvailable ? '#e8f5e9' : '#ffebee'
                }}
              >
                <div style={{ fontWeight: 'bold' }}>{agent.name}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  状态: {agent.isLoggedIn ? '已登录' : '未登录'}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  可用: {agent.isAvailable ? '是' : '否'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {currentSession && (
        <div style={{ marginBottom: '20px' }}>
          <h3>发送测试消息</h3>
          <div style={{ marginBottom: '10px' }}>
            <input
              type="text"
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              placeholder="输入测试消息"
              style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
            />
            <button onClick={testSendMessage} disabled={loading} style={buttonStyle}>
              发送消息
            </button>
          </div>

          {Object.keys(messages).length > 0 && (
            <div>
              <h4>响应：</h4>
              {Object.entries(messages).map(([agentId, content]) => (
                <div
                  key={agentId}
                  style={{
                    marginBottom: '10px',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    backgroundColor: '#f5f5f5'
                  }}
                >
                  <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{agentId}</div>
                  <div style={{ whiteSpace: 'pre-wrap' }}>{content || '等待响应...'}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
        <h3>说明</h3>
        <ul style={{ margin: 0, paddingLeft: '20px' }}>
          <li>点击"获取 Agent 列表"测试后端连接</li>
          <li>所有 Agent 默认未登录，需要先登录才能发送消息</li>
          <li>点击"创建测试会话"创建一个测试会话</li>
          <li>发送消息功能需要 Agent 已登录才能正常工作</li>
        </ul>
      </div>
    </div>
  );
}

const buttonStyle: React.CSSProperties = {
  padding: '10px 20px',
  backgroundColor: '#5865F2',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '14px'
};
