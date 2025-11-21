

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './styles.module.css';
import { SessionData, SessionFilters } from './types';

const SessionHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  
  // 状态管理
  const [sessionSearchTerm, setSessionSearchTerm] = useState('');
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  const [sessionFilters, setSessionFilters] = useState<SessionFilters>({
    status: 'all',
    agent: 'all',
    time: 'all'
  });
  const [isGridView, setIsGridView] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [renameInputValue, setRenameInputValue] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // 会话数据
  const [sessionsData, setSessionsData] = useState<SessionData[]>([
    {
      id: 'session-001',
      name: 'Python爬虫开发',
      agents: ['code', 'review', 'summary'],
      lastActive: '2分钟前',
      status: 'active',
      isStarred: true
    },
    {
      id: 'session-002',
      name: 'API接口设计',
      agents: ['code', 'creative'],
      lastActive: '1小时前',
      status: 'active',
      isStarred: false
    },
    {
      id: 'session-003',
      name: '数据库优化方案',
      agents: ['code', 'review', 'summary', 'debug'],
      lastActive: '昨天',
      status: 'archived',
      isStarred: true
    },
    {
      id: 'session-004',
      name: '前端组件开发',
      agents: ['code', 'creative'],
      lastActive: '2天前',
      status: 'active',
      isStarred: false
    },
    {
      id: 'session-005',
      name: '机器学习模型训练',
      agents: ['code', 'review', 'summary'],
      lastActive: '3天前',
      status: 'archived',
      isStarred: false
    }
  ]);

  // 设置页面标题
  useEffect(() => {
    const originalTitle = document.title;
    document.title = 'RoundTable AI - 会话历史';
    return () => {
      document.title = originalTitle;
    };
  }, []);

  // 筛选会话
  const filteredSessions = sessionsData.filter(session => {
    // 搜索筛选
    if (sessionSearchTerm && !session.name.toLowerCase().includes(sessionSearchTerm.toLowerCase())) {
      return false;
    }

    // 状态筛选
    if (sessionFilters.status !== 'all') {
      if (sessionFilters.status === 'active' && session.status !== 'active') {
        return false;
      } else if (sessionFilters.status === 'archived' && session.status !== 'archived') {
        return false;
      } else if (sessionFilters.status === 'starred' && !session.isStarred) {
        return false;
      }
    }

    // Agent筛选
    if (sessionFilters.agent !== 'all' && !session.agents.includes(sessionFilters.agent)) {
      return false;
    }

    return true;
  });

  // 处理会话搜索
  const handleSessionSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSessionSearchTerm(e.target.value);
  };

  // 处理全局搜索
  const handleGlobalSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGlobalSearchTerm(e.target.value);
  };

  // 处理筛选器变化
  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSessionFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 处理会话行点击
  const handleSessionRowClick = (sessionId: string, e: React.MouseEvent) => {
    // 如果点击的是按钮，不触发行点击
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    navigate(`/main-workbench?sessionId=${sessionId}`);
  };

  // 处理打开会话
  const handleOpenSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/main-workbench?sessionId=${sessionId}`);
  };

  // 处理重命名
  const handleRenameSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const session = sessionsData.find(s => s.id === sessionId);
    if (session) {
      setCurrentSessionId(sessionId);
      setRenameInputValue(session.name);
      setShowRenameModal(true);
    }
  };

  // 确认重命名
  const handleConfirmRename = () => {
    const newName = renameInputValue.trim();
    if (newName && currentSessionId) {
      setSessionsData(prev => prev.map(session => 
        session.id === currentSessionId 
          ? { ...session, name: newName }
          : session
      ));
      setShowRenameModal(false);
    }
  };

  // 处理导出
  const handleExportSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    console.log(`导出会话: ${sessionId}`);
  };

  // 处理归档/取消归档
  const handleArchiveSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessionsData(prev => prev.map(session => 
      session.id === sessionId 
        ? { ...session, status: session.status === 'archived' ? 'active' : 'archived' }
        : session
    ));
  };

  // 处理视图切换
  const handleViewChange = (isGrid: boolean) => {
    setIsGridView(isGrid);
  };

  // 处理分页
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // 处理导出全部
  const handleExportAll = () => {
    console.log('导出全部会话');
  };

  // 处理清空全部
  const handleClearAll = () => {
    if (confirm('确定要清空所有会话吗？此操作不可恢复。')) {
      console.log('清空全部会话');
    }
  };

  // 获取Agent标签样式
  const getAgentTagClass = (agent: string) => {
    const agentClasses: { [key: string]: string } = {
      code: styles.agentCode,
      review: styles.agentReview,
      summary: styles.agentSummary,
      creative: styles.agentCreative,
      debug: styles.agentDebug
    };
    return agentClasses[agent] || '';
  };

  // 获取Agent显示名称
  const getAgentDisplayName = (agent: string) => {
    const agentNames: { [key: string]: string } = {
      code: '代码生成',
      review: '代码评审',
      summary: '文档总结',
      creative: '创意助手',
      debug: '调试助手'
    };
    return agentNames[agent] || agent;
  };

  // 获取状态样式和文本
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'active':
        return { class: styles.statusActive, text: '活跃' };
      case 'archived':
        return { class: styles.statusArchived, text: '已归档' };
      case 'starred':
        return { class: styles.statusStarred, text: '已收藏' };
      default:
        return { class: styles.statusActive, text: '活跃' };
    }
  };

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
                value={globalSearchTerm}
                onChange={handleGlobalSearchChange}
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
            <Link 
              to="/main-workbench"
              className="w-full bg-primary text-white py-2.5 px-4 rounded-lg hover:bg-opacity-90 transition-all flex items-center justify-center space-x-2"
            >
              <i className="fas fa-plus"></i>
              <span className="font-medium">新建会话</span>
            </Link>
          </div>
          
          {/* 导航菜单 */}
          <nav className="px-3 py-4 border-b border-border">
            <Link 
              to="/main-workbench" 
              className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-secondary hover:bg-bgLight hover:text-primary transition-colors mb-1"
            >
              <i className="fas fa-th-large text-base"></i>
              <span className="text-sm">主工作台</span>
            </Link>
            <Link 
              to="/agent-management" 
              className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-secondary hover:bg-bgLight hover:text-primary transition-colors mb-1"
            >
              <i className="fas fa-robot text-base"></i>
              <span className="text-sm">Agent管理</span>
            </Link>
            <Link 
              to="/session-history" 
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg mb-1 ${styles.navLinkActive}`}
            >
              <i className="fas fa-history text-base"></i>
              <span className="text-sm">会话历史</span>
            </Link>
            <Link 
              to="/system-settings" 
              className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-secondary hover:bg-bgLight hover:text-primary transition-colors"
            >
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
              {sessionsData.slice(0, 2).map((session) => (
                <div 
                  key={session.id}
                  className="px-3 py-2.5 rounded-lg cursor-pointer hover:bg-bgLight transition-colors mb-1"
                  onClick={() => navigate(`/main-workbench?sessionId=${session.id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        {session.isStarred && <i className="fas fa-star text-yellow-500 text-xs"></i>}
                        <span className="text-sm font-medium text-primary truncate">{session.name}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-xs text-secondary">
                        <i className="fas fa-robot text-[10px]"></i>
                        <span>{session.agents.length}个Agent</span>
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
          {/* 页面头部 */}
          <div className="bg-cardBg border-b border-border px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-semibold text-primary">会话历史</h1>
                <nav className="text-sm text-secondary mt-1">
                  <span>RoundTable AI</span>
                  <i className="fas fa-chevron-right mx-2 text-xs"></i>
                  <span>会话历史</span>
                </nav>
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={handleExportAll}
                  className="px-3 py-1.5 bg-bgLight text-primary rounded-lg hover:bg-border transition-colors text-sm flex items-center space-x-1.5"
                >
                  <i className="fas fa-download text-xs"></i>
                  <span>导出全部</span>
                </button>
                <button 
                  onClick={handleClearAll}
                  className="px-3 py-1.5 text-secondary hover:text-primary transition-colors text-sm"
                >
                  <i className="fas fa-trash-alt"></i>
                </button>
              </div>
            </div>
          </div>

          {/* 工具栏区域 */}
          <div className="bg-cardBg border-b border-border px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* 搜索框 */}
                <div className="relative">
                  <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary text-sm"></i>
                  <input 
                    type="text" 
                    placeholder="搜索会话名称..." 
                    value={sessionSearchTerm}
                    onChange={handleSessionSearchChange}
                    className={`pl-10 pr-4 py-2 bg-bgLight border border-border rounded-lg text-sm w-64 ${styles.inputFocus}`}
                  />
                </div>
                
                {/* 状态筛选 */}
                <select 
                  name="status"
                  value={sessionFilters.status}
                  onChange={handleFilterChange}
                  className={`px-3 py-2 bg-bgLight border border-border rounded-lg text-sm ${styles.inputFocus}`}
                >
                  <option value="all">全部状态</option>
                  <option value="active">活跃</option>
                  <option value="archived">已归档</option>
                  <option value="starred">已收藏</option>
                </select>
                
                {/* Agent筛选 */}
                <select 
                  name="agent"
                  value={sessionFilters.agent}
                  onChange={handleFilterChange}
                  className={`px-3 py-2 bg-bgLight border border-border rounded-lg text-sm ${styles.inputFocus}`}
                >
                  <option value="all">全部Agent</option>
                  <option value="code">代码生成</option>
                  <option value="review">代码评审</option>
                  <option value="summary">文档总结</option>
                  <option value="creative">创意助手</option>
                </select>
                
                {/* 时间筛选 */}
                <select 
                  name="time"
                  value={sessionFilters.time}
                  onChange={handleFilterChange}
                  className={`px-3 py-2 bg-bgLight border border-border rounded-lg text-sm ${styles.inputFocus}`}
                >
                  <option value="all">全部时间</option>
                  <option value="today">今天</option>
                  <option value="week">本周</option>
                  <option value="month">本月</option>
                  <option value="quarter">本季度</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => handleViewChange(true)}
                  className={`p-2 transition-colors ${isGridView ? 'text-primary' : 'text-secondary hover:text-primary'}`}
                >
                  <i className="fas fa-th-large"></i>
                </button>
                <button 
                  onClick={() => handleViewChange(false)}
                  className={`p-2 transition-colors ${!isGridView ? 'text-primary' : 'text-secondary hover:text-primary'}`}
                >
                  <i className="fas fa-list"></i>
                </button>
                <span className="text-sm text-secondary">共 {filteredSessions.length} 个会话</span>
              </div>
            </div>
          </div>

          {/* 会话列表内容区 */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* 表格视图 */}
            <div className="bg-cardBg rounded-card shadow-card overflow-hidden">
              <table className="w-full">
                <thead className="bg-bgLight border-b border-border">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider cursor-pointer hover:text-primary">
                      <div className="flex items-center space-x-1">
                        <span>会话名称</span>
                        <i className="fas fa-sort text-[10px]"></i>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">参与Agent</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider cursor-pointer hover:text-primary">
                      <div className="flex items-center space-x-1">
                        <span>最后活跃</span>
                        <i className="fas fa-sort text-[10px]"></i>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider cursor-pointer hover:text-primary">
                      <div className="flex items-center space-x-1">
                        <span>状态</span>
                        <i className="fas fa-sort text-[10px]"></i>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-border">
                  {filteredSessions.map((session) => {
                    const statusInfo = getStatusInfo(session.status);
                    return (
                      <tr 
                        key={session.id}
                        className={`${styles.tableRowHover} cursor-pointer`}
                        onClick={(e) => handleSessionRowClick(session.id, e)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            {session.isStarred && <i className="fas fa-star text-yellow-500 text-sm"></i>}
                            <span className="text-sm font-medium text-primary">{session.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap">
                            {session.agents.map((agent, index) => (
                              <span 
                                key={index}
                                className={`${styles.agentTag} ${getAgentTagClass(agent)}`}
                              >
                                {getAgentDisplayName(agent)}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary">{session.lastActive}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.class}`}>
                            <i className="fas fa-circle text-[8px] mr-1"></i>
                            {statusInfo.text}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={(e) => handleOpenSession(session.id, e)}
                              className="text-primary hover:text-opacity-80 transition-colors" 
                              title="打开会话"
                            >
                              <i className="fas fa-external-link-alt"></i>
                            </button>
                            <button 
                              onClick={(e) => handleRenameSession(session.id, e)}
                              className="text-secondary hover:text-primary transition-colors" 
                              title="重命名"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button 
                              onClick={(e) => handleExportSession(session.id, e)}
                              className="text-secondary hover:text-primary transition-colors" 
                              title="导出"
                            >
                              <i className="fas fa-download"></i>
                            </button>
                            <button 
                              onClick={(e) => handleArchiveSession(session.id, e)}
                              className="text-secondary hover:text-primary transition-colors" 
                              title={session.status === 'archived' ? '取消归档' : '归档'}
                            >
                              <i className="fas fa-archive"></i>
                            </button>
                            <div className="relative">
                              <button className="text-secondary hover:text-primary transition-colors" title="更多操作">
                                <i className="fas fa-ellipsis-v"></i>
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 分页 */}
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-secondary">
                显示第 1-{filteredSessions.length} 条，共 {filteredSessions.length} 条记录
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-secondary hover:text-primary transition-colors text-sm border border-border rounded-lg hover:bg-bgLight disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <i className="fas fa-chevron-left mr-1"></i>
                  上一页
                </button>
                <button className="px-3 py-1.5 bg-primary text-white rounded-lg text-sm">1</button>
                <button 
                  onClick={() => handlePageChange(2)}
                  className="px-3 py-1.5 text-secondary hover:text-primary transition-colors text-sm border border-border rounded-lg hover:bg-bgLight"
                >
                  2
                </button>
                <button 
                  onClick={() => handlePageChange(3)}
                  className="px-3 py-1.5 text-secondary hover:text-primary transition-colors text-sm border border-border rounded-lg hover:bg-bgLight"
                >
                  3
                </button>
                <button 
                  onClick={() => handlePageChange(currentPage + 1)}
                  className="px-3 py-1.5 text-secondary hover:text-primary transition-colors text-sm border border-border rounded-lg hover:bg-bgLight"
                >
                  下一页
                  <i className="fas fa-chevron-right ml-1"></i>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* 重命名模态框 */}
      {showRenameModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowRenameModal(false);
            }
          }}
        >
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="px-6 py-4 border-b border-border">
                <h3 className="text-lg font-semibold text-primary">重命名会话</h3>
              </div>
              <div className="px-6 py-4">
                <input 
                  type="text" 
                  placeholder="请输入新的会话名称" 
                  value={renameInputValue}
                  onChange={(e) => setRenameInputValue(e.target.value)}
                  className={`w-full px-3 py-2 border border-border rounded-lg ${styles.inputFocus}`}
                />
              </div>
              <div className="px-6 py-4 border-t border-border flex justify-end space-x-3">
                <button 
                  onClick={() => setShowRenameModal(false)}
                  className="px-4 py-2 text-secondary hover:text-primary transition-colors"
                >
                  取消
                </button>
                <button 
                  onClick={handleConfirmRename}
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

export default SessionHistoryPage;

