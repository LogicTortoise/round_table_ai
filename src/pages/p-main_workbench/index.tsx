

import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './styles.module.css';
import { agentApi, Agent as BackendAgent } from '../../services/api';

interface Session {
  id: string;
  name: string;
  agentCount: number;
  lastActive: string;
  isPinned?: boolean;
}

interface Agent {
  id: string;
  name: string;
  model: string;
  icon: string;
  color: string;
  isActive: boolean;
}

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  isLoading?: boolean;
}

const MainWorkbench: React.FC = () => {
  const navigate = useNavigate();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // 状态管理
  const [activeSessionId, setActiveSessionId] = useState<string>('session-1');
  const [sessionTitle, setSessionTitle] = useState<string>('Python爬虫开发');
  const [unifiedInputValue, setUnifiedInputValue] = useState<string>('');
  const [showAgentSelectModal, setShowAgentSelectModal] = useState<boolean>(false);
  const [selectedAgents, setSelectedAgents] = useState<Set<string>>(new Set(['agent-1', 'agent-2', 'agent-3']));
  const [sessions, setSessions] = useState<Session[]>([
    { id: 'session-1', name: 'Python爬虫开发', agentCount: 3, lastActive: '2分钟前', isPinned: true },
    { id: 'session-2', name: 'API接口设计', agentCount: 2, lastActive: '1小时前' },
    { id: 'session-3', name: '数据库优化方案', agentCount: 4, lastActive: '昨天' },
    { id: 'session-4', name: '前端组件开发', agentCount: 2, lastActive: '2天前' }
  ]);
  const [agents, setAgents] = useState<Agent[]>([
    { id: 'agent-1', name: '代码生成助手', model: 'GPT-4', icon: 'code', color: 'blue', isActive: true },
    { id: 'agent-2', name: '代码评审助手', model: 'Claude 3', icon: 'shield-alt', color: 'green', isActive: true },
    { id: 'agent-3', name: '文档总结助手', model: 'Gemini Pro', icon: 'file-alt', color: 'purple', isActive: true }
  ]);
  const [availableAgents, setAvailableAgents] = useState<BackendAgent[]>([]);
  const [agentMessages, setAgentMessages] = useState<Record<string, Message[]>>({
    'agent-1': [
      { id: 'msg-1', content: '请帮我生成一个Python的Web爬虫', isUser: true, timestamp: new Date() },
      { id: 'msg-2', content: '好的，我为您生成一个基础的Python爬虫代码：\n\nimport requests\nfrom bs4 import BeautifulSoup\n\ndef scrape_website(url):\n    response = requests.get(url)\n    soup = BeautifulSoup(response.text, \'html.parser\')\n    return soup\n\n这是一个基础框架，您可以根据需要扩展功能。', isUser: false, timestamp: new Date() }
    ],
    'agent-2': [
      { id: 'msg-1', content: '请帮我生成一个Python的Web爬虫', isUser: true, timestamp: new Date() },
      { id: 'msg-2', content: '安全性评审建议：\n\n- 建议添加请求超时设置，防止长时间阻塞\n- 需要添加User-Agent头，避免被网站识别为爬虫\n- 建议添加异常处理机制\n- 考虑添加请求频率限制，遵守robots.txt', isUser: false, timestamp: new Date() }
    ],
    'agent-3': [
      { id: 'msg-1', content: '请帮我生成一个Python的Web爬虫', isUser: true, timestamp: new Date() },
      { id: 'msg-2', content: '功能总结：\n\n核心功能：\n该爬虫使用requests库获取网页内容，使用BeautifulSoup解析HTML结构。\n\n使用方法：\n调用scrape_website(url)函数，传入目标URL即可获取解析后的网页对象。', isUser: false, timestamp: new Date() }
    ]
  });

  // 设置页面标题
  useEffect(() => {
    const originalTitle = document.title;
    document.title = 'RoundTable AI - 主工作台';
    return () => { document.title = originalTitle; };
  }, []);

  // 获取后端 Agent 列表
  useEffect(() => {
    const loadAgents = async () => {
      try {
        const { agents } = await agentApi.getAll();
        setAvailableAgents(agents);
      } catch (error) {
        console.error('Failed to load agents:', error);
      }
    };
    loadAgents();
  }, []);

  // 处理会话切换
  const handleSessionSwitch = (sessionId: string) => {
    setActiveSessionId(sessionId);
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setSessionTitle(session.name);
    }
  };

  // 处理新建会话
  const handleNewSession = () => {
    const sessionName = prompt('请输入新会话名称：', '新会话');
    if (sessionName && sessionName.trim()) {
      const newSession: Session = {
        id: 'session-' + Date.now(),
        name: sessionName.trim(),
        agentCount: 0,
        lastActive: '刚刚'
      };
      setSessions(prev => [newSession, ...prev]);
      setActiveSessionId(newSession.id);
      setSessionTitle(newSession.name);
      setAgentMessages({});
    }
  };

  // 处理编辑会话名称
  const handleEditSessionName = () => {
    const newName = prompt('请输入新的会话名称：', sessionTitle);
    if (newName && newName.trim() && newName.trim() !== sessionTitle) {
      setSessionTitle(newName.trim());
      setSessions(prev => 
        prev.map(session => 
          session.id === activeSessionId 
            ? { ...session, name: newName.trim() }
            : session
        )
      );
    }
  };

  // 处理消息输入
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= 2000) {
      setUnifiedInputValue(value);
    }
  };

  // 处理发送消息
  const handleSendMessage = () => {
    const message = unifiedInputValue.trim();
    if (message) {
      const userMessage: Message = {
        id: 'msg-' + Date.now(),
        content: message,
        isUser: true,
        timestamp: new Date()
      };

      // 向所有活跃Agent发送消息
      const updatedMessages = { ...agentMessages };
      agents.forEach(agent => {
        if (agent.isActive) {
          const currentMessages = updatedMessages[agent.id] || [];
          updatedMessages[agent.id] = [...currentMessages, userMessage];
        }
      });
      setAgentMessages(updatedMessages);

      // 清空输入
      setUnifiedInputValue('');
      if (textareaRef.current) {
        textareaRef.current.blur();
      }

      // 模拟Agent响应
      setTimeout(() => {
        const agentResponses = {
          'agent-1': '这是代码生成助手的响应...',
          'agent-2': '这是代码评审助手的响应...',
          'agent-3': '这是文档总结助手的响应...'
        };

        const finalMessages = { ...updatedMessages };
        agents.forEach(agent => {
          if (agent.isActive) {
            const responseMessage: Message = {
              id: 'msg-' + Date.now() + '-' + agent.id,
              content: agentResponses[agent.id as keyof typeof agentResponses] || '这是Agent的响应...',
              isUser: false,
              timestamp: new Date()
            };
            finalMessages[agent.id] = [...finalMessages[agent.id], responseMessage];
          }
        });
        setAgentMessages(finalMessages);
      }, 2000);
    }
  };

  // 处理键盘快捷键
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 处理Agent操作
  const handleAgentAction = (agentId: string, action: 'info' | 'clear' | 'close') => {
    switch (action) {
      case 'info':
        navigate(`/agent-management?agentId=${agentId}`);
        break;
      case 'clear':
        if (confirm('确定要清空这个Agent的对话吗？')) {
          setAgentMessages(prev => ({
            ...prev,
            [agentId]: []
          }));
        }
        break;
      case 'close':
        if (confirm('确定要关闭这个Agent对话框吗？')) {
          setAgents(prev => 
            prev.map(agent => 
              agent.id === agentId ? { ...agent, isActive: false } : agent
            )
          );
        }
        break;
    }
  };

  // 处理会话操作
  const handleSessionAction = (action: 'clear' | 'archive' | 'menu') => {
    switch (action) {
      case 'clear':
        if (confirm('确定要清空整个会话吗？')) {
          setAgentMessages({});
        }
        break;
      case 'archive':
        if (confirm('确定要归档这个会话吗？')) {
          console.log('归档会话');
        }
        break;
      case 'menu':
        console.log('显示会话菜单');
        break;
    }
  };

  // 处理Agent选择
  const handleAgentSelect = (agentId: string, checked: boolean) => {
    const newSelectedAgents = new Set(selectedAgents);
    if (checked) {
      newSelectedAgents.add(agentId);
    } else {
      newSelectedAgents.delete(agentId);
    }
    setSelectedAgents(newSelectedAgents);
  };

  // Agent 图标映射
  const getAgentIcon = (agentId: string): { icon: string; color: string } => {
    const iconMap: Record<string, { icon: string; color: string }> = {
      'kimi': { icon: 'moon', color: 'blue' },
      'chatgpt': { icon: 'robot', color: 'green' },
      'claude': { icon: 'shield-alt', color: 'cyan' },
      'deepseek': { icon: 'brain', color: 'purple' }
    };
    return iconMap[agentId] || { icon: 'cog', color: 'gray' };
  };

  // 处理插入代码
  const handleInsertCode = () => {
    const codeTemplate = '\n\n```\n\n```\n\n';
    setUnifiedInputValue(prev => prev + codeTemplate);
    if (textareaRef.current) {
      textareaRef.current.focus();
      const cursorPos = unifiedInputValue.length + 4;
      textareaRef.current.setSelectionRange(cursorPos, cursorPos);
    }
  };

  // 渲染消息内容
  const renderMessageContent = (content: string) => {
    if (content.includes('```')) {
      const parts = content.split('```');
      return parts.map((part, index) => 
        index % 2 === 1 ? (
          <div key={index} className={styles.codeBlock}>
            <pre><code>{part}</code></pre>
          </div>
        ) : (
          <p key={index} className="text-sm mb-2">{part}</p>
        )
      );
    } else if (content.includes('\n')) {
      return content.split('\n').map((line, index) => (
        <p key={index} className="text-sm mb-2">{line}</p>
      ));
    }
    return <p className="text-sm">{content}</p>;
  };

  const activeAgentsCount = agents.filter(agent => agent.isActive).length;

  return (
    <div className={styles.pageWrapper}>
      {/* 顶部导航栏 */}
      <header className="bg-cardBg border-b border-border h-[60px] fixed top-0 left-0 right-0 z-50">
        <div className="h-full px-6 flex items-center justify-between">
          {/* Logo区域 */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <i className="fas fa-users text-white text-sm"></i>
            </div>
            <span className="text-xl font-bold text-primary">RoundTable AI</span>
          </div>
          
          {/* 搜索栏 */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary text-sm"></i>
              <input 
                type="text" 
                placeholder="搜索会话、Agent..." 
                className={`w-full pl-10 pr-4 py-2 bg-bgLight border border-border rounded-lg text-sm ${styles.inputFocus}`}
              />
            </div>
          </div>
          
          {/* 右侧操作区 */}
          <div className="flex items-center space-x-4">
            <button className="text-secondary hover:text-primary transition-colors">
              <i className="far fa-question-circle text-lg"></i>
            </button>
            <button className="text-secondary hover:text-primary transition-colors relative">
              <i className="far fa-bell text-lg"></i>
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="flex items-center space-x-2 cursor-pointer hover:bg-bgLight px-3 py-2 rounded-lg transition-colors">
              <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                <i className="fas fa-user text-white text-sm"></i>
              </div>
              <span className="text-sm font-medium text-primary hidden lg:block">开发者</span>
              <i className="fas fa-chevron-down text-xs text-secondary hidden lg:block"></i>
            </div>
          </div>
        </div>
      </header>

      {/* 主体内容区 */}
      <div className="pt-[60px] flex h-screen">
        {/* 左侧菜单 */}
        <aside className="w-[240px] bg-cardBg border-r border-border flex flex-col">
          {/* 新建会话按钮 */}
          <div className="p-4 border-b border-border">
            <button 
              onClick={handleNewSession}
              className="w-full bg-primary text-white py-2.5 px-4 rounded-lg hover:bg-opacity-90 transition-all flex items-center justify-center space-x-2"
            >
              <i className="fas fa-plus"></i>
              <span className="font-medium">新建会话</span>
            </button>
          </div>
          
          {/* 导航菜单 */}
          <nav className="px-3 py-4 border-b border-border">
            <Link to="/main-workbench" className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg mb-1 ${styles.navLinkActive}`}>
              <i className="fas fa-th-large text-base"></i>
              <span className="text-sm">主工作台</span>
            </Link>
            <Link to="/agent-management" className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-secondary hover:bg-bgLight hover:text-primary transition-colors mb-1">
              <i className="fas fa-robot text-base"></i>
              <span className="text-sm">Agent管理</span>
            </Link>
            <Link to="/session-history" className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-secondary hover:bg-bgLight hover:text-primary transition-colors mb-1">
              <i className="fas fa-history text-base"></i>
              <span className="text-sm">会话历史</span>
            </Link>
            <Link to="/system-settings" className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-secondary hover:bg-bgLight hover:text-primary transition-colors">
              <i className="fas fa-cog text-base"></i>
              <span className="text-sm">系统设置</span>
            </Link>
          </nav>
          
          {/* 会话列表 */}
          <div className={`flex-1 overflow-y-auto ${styles.chatScrollbar}`}>
            <div className="px-4 py-3 flex items-center justify-between">
              <span className="text-xs font-semibold text-secondary uppercase">最近会话</span>
              <i className="fas fa-ellipsis-h text-secondary text-xs cursor-pointer"></i>
            </div>
            <div className="px-2">
              {sessions.map((session) => (
                <div 
                  key={session.id}
                  onClick={() => handleSessionSwitch(session.id)}
                  className={`px-3 py-2.5 rounded-lg cursor-pointer mb-1 transition-colors ${
                    activeSessionId === session.id 
                      ? styles.sessionItemActive 
                      : 'hover:bg-bgLight'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        {session.isPinned && (
                          <i className="fas fa-star text-yellow-500 text-xs"></i>
                        )}
                        <span className="text-sm font-medium text-primary truncate">
                          {session.name}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1 text-xs text-secondary">
                        <i className="fas fa-robot text-[10px]"></i>
                        <span>{session.agentCount}个Agent</span>
                        <span className="mx-1">·</span>
                        <span>{session.lastActive}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* 主内容区 */}
        <main className="flex-1 flex flex-col bg-bgLight">
          {/* 会话头部 */}
          <div className="bg-cardBg border-b border-border px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <h1 className="text-lg font-semibold text-primary">{sessionTitle}</h1>
                <button 
                  onClick={handleEditSessionName}
                  className="text-secondary hover:text-primary"
                >
                  <i className="fas fa-edit text-sm"></i>
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setShowAgentSelectModal(true)}
                  className="px-3 py-1.5 bg-bgLight text-primary rounded-lg hover:bg-border transition-colors text-sm flex items-center space-x-1.5"
                >
                  <i className="fas fa-plus text-xs"></i>
                  <span>添加Agent</span>
                </button>
                <button 
                  onClick={() => handleSessionAction('clear')}
                  className="px-3 py-1.5 text-secondary hover:text-primary transition-colors text-sm"
                >
                  <i className="fas fa-trash-alt"></i>
                </button>
                <button 
                  onClick={() => handleSessionAction('archive')}
                  className="px-3 py-1.5 text-secondary hover:text-primary transition-colors text-sm"
                >
                  <i className="fas fa-archive"></i>
                </button>
                <button 
                  onClick={() => handleSessionAction('menu')}
                  className="px-3 py-1.5 text-secondary hover:text-primary transition-colors text-sm"
                >
                  <i className="fas fa-ellipsis-v"></i>
                </button>
              </div>
            </div>
          </div>

          {/* 对话框网格区域 */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 h-full">
              {agents.filter(agent => agent.isActive).map((agent) => (
                <div 
                  key={agent.id}
                  className={`bg-cardBg rounded-card shadow-card flex flex-col ${styles.agentCardHover}`}
                >
                  <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-8 h-8 bg-${agent.color}-100 rounded-lg flex items-center justify-center`}>
                        <i className={`fas fa-${agent.icon} text-${agent.color}-600 text-sm`}></i>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-primary">{agent.name}</h3>
                        <span className="text-xs text-secondary">{agent.model}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleAgentAction(agent.id, 'info')}
                        className="text-secondary hover:text-primary"
                      >
                        <i className="fas fa-info-circle text-sm"></i>
                      </button>
                      <button 
                        onClick={() => handleAgentAction(agent.id, 'clear')}
                        className="text-secondary hover:text-primary"
                      >
                        <i className="fas fa-eraser text-sm"></i>
                      </button>
                      <button 
                        onClick={() => handleAgentAction(agent.id, 'close')}
                        className="text-secondary hover:text-primary"
                      >
                        <i className="fas fa-times text-sm"></i>
                      </button>
                    </div>
                  </div>
                  <div className={`flex-1 overflow-y-auto p-4 space-y-3 ${styles.chatScrollbar}`}>
                    {agentMessages[agent.id] && agentMessages[agent.id].length > 0 ? (
                      agentMessages[agent.id].map((message) => (
                        <div 
                          key={message.id}
                          className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`px-4 py-2 max-w-[${message.isUser ? '80%' : '85%'}] ${
                            message.isUser ? styles.messageUser : styles.messageAgent
                          } ${message.isLoading ? styles.agentLoading : ''}`}>
                            {renderMessageContent(message.content)}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-secondary text-sm py-8">
                        开始与{agent.name}对话吧！
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 统一输入区 */}
          <div className="bg-cardBg border-t border-border px-6 py-4">
            <div className="max-w-5xl mx-auto">
              <div className="bg-bgLight rounded-lg border border-border p-3">
                <textarea 
                  ref={textareaRef}
                  rows={3}
                  value={unifiedInputValue}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="输入您的指令，将同时发送给所有选中的Agent..." 
                  className="w-full bg-transparent resize-none focus:outline-none text-sm text-primary placeholder-secondary"
                />
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                  <div className="flex items-center space-x-3">
                    <button className="text-secondary hover:text-primary transition-colors">
                      <i className="fas fa-paperclip"></i>
                    </button>
                    <button 
                      onClick={handleInsertCode}
                      className="text-secondary hover:text-primary transition-colors"
                    >
                      <i className="fas fa-code"></i>
                    </button>
                    <button className="text-secondary hover:text-primary transition-colors">
                      <i className="fas fa-microphone"></i>
                    </button>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`text-xs ${unifiedInputValue.length > 2000 ? 'text-red-500' : 'text-secondary'}`}>
                      {unifiedInputValue.length} / 2000
                    </span>
                    <button 
                      onClick={handleSendMessage}
                      className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-opacity-90 transition-all flex items-center space-x-2"
                    >
                      <span className="text-sm font-medium">发送</span>
                      <i className="fas fa-paper-plane text-xs"></i>
                    </button>
                  </div>
                </div>
              </div>
              <div className="mt-2 text-xs text-secondary text-center">
                按 Ctrl + Enter 快速发送 · 支持 Markdown 格式
              </div>
            </div>
          </div>
        </main>

        {/* 右侧面板（仅在大屏显示） */}
        <aside className={`hidden xl:block w-[300px] bg-cardBg border-l border-border overflow-y-auto ${styles.chatScrollbar}`}>
          <div className="p-4">
            {/* 当前会话Agent列表 */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-primary mb-3">活跃Agent ({activeAgentsCount})</h3>
              <div className="space-y-2">
                {agents.filter(agent => agent.isActive).map((agent) => (
                  <div key={agent.id} className="bg-bgLight rounded-lg p-3 border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className={`w-6 h-6 bg-${agent.color}-100 rounded flex items-center justify-center`}>
                          <i className={`fas fa-${agent.icon} text-${agent.color}-600 text-xs`}></i>
                        </div>
                        <span className="text-sm font-medium text-primary">{agent.name}</span>
                      </div>
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    </div>
                    <p className="text-xs text-secondary">{agent.model} · 响应中</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 快速添加Agent */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-primary mb-3">快速添加</h3>
              <div className="space-y-2">
                <button className="w-full bg-bgLight hover:bg-border rounded-lg p-3 text-left transition-colors border border-transparent hover:border-primary">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-orange-100 rounded flex items-center justify-center">
                      <i className="fas fa-lightbulb text-orange-600 text-xs"></i>
                    </div>
                    <span className="text-sm font-medium text-primary">创意助手</span>
                  </div>
                </button>
                
                <button className="w-full bg-bgLight hover:bg-border rounded-lg p-3 text-left transition-colors border border-transparent hover:border-primary">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-red-100 rounded flex items-center justify-center">
                      <i className="fas fa-bug text-red-600 text-xs"></i>
                    </div>
                    <span className="text-sm font-medium text-primary">调试助手</span>
                  </div>
                </button>
              </div>
            </div>

            {/* 会话信息 */}
            <div>
              <h3 className="text-sm font-semibold text-primary mb-3">会话信息</h3>
              <div className="bg-bgLight rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-secondary">创建时间</span>
                  <span className="text-primary">2024-01-15 14:30</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-secondary">消息数量</span>
                  <span className="text-primary">12条</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-secondary">最后活跃</span>
                  <span className="text-primary">2分钟前</span>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Agent选择模态框 */}
      {showAgentSelectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="bg-cardBg rounded-card shadow-hover w-full max-w-md">
              <div className="px-6 py-4 border-b border-border">
                <h3 className="text-lg font-semibold text-primary">选择Agent</h3>
              </div>
              <div className="p-6">
                {availableAgents.length === 0 ? (
                  <div className="text-center py-8 text-secondary">
                    <i className="fas fa-spinner fa-spin text-2xl mb-2"></i>
                    <p className="text-sm">加载 Agent 列表中...</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {availableAgents.map((agentOption) => {
                      const { icon, color } = getAgentIcon(agentOption.id);
                      const isDisabled = !agentOption.isLoggedIn || !agentOption.isAvailable;

                      return (
                        <label
                          key={agentOption.id}
                          className={`flex items-center space-x-3 ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                          title={isDisabled ? '请先在 Agent 管理页面登录此 Agent' : ''}
                        >
                          <input
                            type="checkbox"
                            checked={selectedAgents.has(agentOption.id)}
                            onChange={(e) => handleAgentSelect(agentOption.id, e.target.checked)}
                            disabled={isDisabled}
                            className="rounded border-border text-primary focus:ring-primary"
                          />
                          <div className="flex items-center space-x-2 flex-1">
                            <div className={`w-6 h-6 bg-${color}-100 rounded flex items-center justify-center`}>
                              <i className={`fas fa-${icon} text-${color}-600 text-xs`}></i>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-primary">{agentOption.name}</span>
                                {!agentOption.isLoggedIn && (
                                  <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded">未登录</span>
                                )}
                              </div>
                              <span className="text-xs text-secondary">{agentOption.id}</span>
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="px-6 py-4 border-t border-border flex justify-end space-x-3">
                <button 
                  onClick={() => setShowAgentSelectModal(false)}
                  className="px-4 py-2 text-secondary hover:text-primary transition-colors"
                >
                  取消
                </button>
                <button 
                  onClick={() => setShowAgentSelectModal(false)}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-colors"
                >
                  确认
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainWorkbench;

