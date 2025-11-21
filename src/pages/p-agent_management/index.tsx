

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './styles.module.css';

interface AgentData {
  id: string;
  name: string;
  type: 'gpt' | 'claude' | 'gemini' | 'custom';
  typeName: string;
  description: string;
  status: 'active' | 'disabled';
  model: string;
  createdAt: string;
  rolePrompt: string;
  temperature?: number;
  maxTokens?: number;
}

interface FormData {
  agentName: string;
  agentType: string;
  agentDescription: string;
  apiKey: string;
  modelName: string;
  rolePrompt: string;
  temperature: string;
  maxTokens: string;
}

const AgentManagementPage: React.FC = () => {
  const navigate = useNavigate();
  
  // 模拟Agent数据
  const [agentsData, setAgentsData] = useState<AgentData[]>([
    {
      id: 'agent-001',
      name: '代码生成助手',
      type: 'gpt',
      typeName: 'GPT系列',
      description: '专业的代码生成和编程助手，支持多种编程语言',
      status: 'active',
      model: 'GPT-4',
      createdAt: '2024-01-10 14:30',
      rolePrompt: '你是一个专业的代码生成助手，精通各种编程语言和框架，能够生成高质量、可维护的代码。'
    },
    {
      id: 'agent-002',
      name: '代码评审助手',
      type: 'claude',
      typeName: 'Claude系列',
      description: '代码质量检查和安全性评审专家',
      status: 'active',
      model: 'Claude 3 Opus',
      createdAt: '2024-01-08 09:15',
      rolePrompt: '你是一个严格的代码评审专家，专注于代码质量、安全性和最佳实践。'
    },
    {
      id: 'agent-003',
      name: '文档总结助手',
      type: 'gemini',
      typeName: 'Gemini系列',
      description: '智能文档分析和总结生成器',
      status: 'active',
      model: 'Gemini Pro',
      createdAt: '2024-01-05 16:45',
      rolePrompt: '你是一个高效的文档分析专家，能够快速理解复杂文档并生成清晰的总结。'
    },
    {
      id: 'agent-004',
      name: '创意写作助手',
      type: 'gpt',
      typeName: 'GPT系列',
      description: '创意文案和内容生成专家',
      status: 'disabled',
      model: 'GPT-3.5 Turbo',
      createdAt: '2024-01-03 11:20',
      rolePrompt: '你是一个富有创意的写作专家，擅长生成吸引人的文案和内容。'
    },
    {
      id: 'agent-005',
      name: '数据分析助手',
      type: 'claude',
      typeName: 'Claude系列',
      description: '专业的数据分析和可视化专家',
      status: 'active',
      model: 'Claude 3 Sonnet',
      createdAt: '2023-12-28 13:10',
      rolePrompt: '你是一个专业的数据分析师，擅长处理和解释复杂的数据集。'
    },
    {
      id: 'agent-006',
      name: '自定义API助手',
      type: 'custom',
      typeName: '自定义API',
      description: '用户自定义的AI接口',
      status: 'disabled',
      model: 'Custom Model',
      createdAt: '2023-12-25 10:30',
      rolePrompt: '这是一个用户自定义的AI助手。'
    }
  ]);

  const [currentAgents, setCurrentAgents] = useState<AgentData[]>([...agentsData]);
  const [editingAgentId, setEditingAgentId] = useState<string | null>(null);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [agentSearchTerm, setAgentSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentView, setCurrentView] = useState<'table' | 'card'>('table');
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const [formData, setFormData] = useState<FormData>({
    agentName: '',
    agentType: '',
    agentDescription: '',
    apiKey: '',
    modelName: '',
    rolePrompt: '',
    temperature: '1.0',
    maxTokens: '4000'
  });

  // 设置页面标题
  useEffect(() => {
    const originalTitle = document.title;
    document.title = 'RoundTable AI - Agent管理';
    return () => { document.title = originalTitle; };
  }, []);

  // 应用筛选和排序
  useEffect(() => {
    applyFiltersAndSorting();
  }, [agentSearchTerm, typeFilter, statusFilter, sortField, sortDirection]);

  const applyFiltersAndSorting = () => {
    let filteredAgents = agentsData.filter(agent => {
      const matchesSearch = !agentSearchTerm || 
        agent.name.toLowerCase().includes(agentSearchTerm.toLowerCase()) ||
        agent.description.toLowerCase().includes(agentSearchTerm.toLowerCase());
      
      const matchesType = !typeFilter || agent.type === typeFilter;
      const matchesStatus = !statusFilter || agent.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });

    // 排序
    if (sortField) {
      filteredAgents.sort((a, b) => {
        let aValue = a[sortField as keyof AgentData];
        let bValue = b[sortField as keyof AgentData];

        if (sortField === 'createdAt') {
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
        }

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    setCurrentAgents(filteredAgents);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAgentSearchTerm(e.target.value);
  };

  const handleTypeFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTypeFilter(e.target.value);
  };

  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
  };

  const handleSort = (field: string) => {
    const newDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(newDirection);
  };

  const handleViewSwitch = (viewType: 'table' | 'card') => {
    setCurrentView(viewType);
  };

  const openAgentModal = (agent: AgentData | null = null) => {
    setEditingAgentId(agent ? agent.id : null);
    
    if (agent) {
      setFormData({
        agentName: agent.name,
        agentType: agent.type,
        agentDescription: agent.description,
        apiKey: '',
        modelName: agent.model,
        rolePrompt: agent.rolePrompt,
        temperature: agent.temperature?.toString() || '1.0',
        maxTokens: agent.maxTokens?.toString() || '4000'
      });
    } else {
      setFormData({
        agentName: '',
        agentType: '',
        agentDescription: '',
        apiKey: '',
        modelName: '',
        rolePrompt: '',
        temperature: '1.0',
        maxTokens: '4000'
      });
    }
    
    setShowAgentModal(true);
  };

  const closeAgentModal = () => {
    setShowAgentModal(false);
    setEditingAgentId(null);
  };

  const handleFormInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const typeNames = {
      'gpt': 'GPT系列',
      'claude': 'Claude系列',
      'gemini': 'Gemini系列',
      'custom': '自定义API'
    };

    const agentData: AgentData = {
      id: editingAgentId || 'agent-' + String(agentsData.length + 1).padStart(3, '0'),
      name: formData.agentName,
      type: formData.agentType as 'gpt' | 'claude' | 'gemini' | 'custom',
      typeName: typeNames[formData.agentType as keyof typeof typeNames] || '自定义API',
      description: formData.agentDescription,
      model: formData.modelName,
      rolePrompt: formData.rolePrompt,
      temperature: parseFloat(formData.temperature),
      maxTokens: parseInt(formData.maxTokens),
      status: 'active',
      createdAt: new Date().toLocaleString('zh-CN')
    };

    if (editingAgentId) {
      setAgentsData(prev => prev.map(agent => 
        agent.id === editingAgentId ? { ...agent, ...agentData } : agent
      ));
    } else {
      setAgentsData(prev => [...prev, agentData]);
    }

    closeAgentModal();
  };

  const handleEditAgent = (agentId: string) => {
    const agent = agentsData.find(a => a.id === agentId);
    if (agent) {
      openAgentModal(agent);
    }
  };

  const handleCopyAgent = (agentId: string) => {
    const agent = agentsData.find(a => a.id === agentId);
    if (agent) {
      const newAgent: AgentData = {
        ...agent,
        id: 'agent-' + String(agentsData.length + 1).padStart(3, '0'),
        name: agent.name + ' (副本)',
        status: 'active',
        createdAt: new Date().toLocaleString('zh-CN')
      };
      setAgentsData(prev => [...prev, newAgent]);
    }
  };

  const handleDeleteAgent = (agentId: string) => {
    if (confirm('确定要删除这个Agent吗？此操作不可撤销。')) {
      setAgentsData(prev => prev.filter(agent => agent.id !== agentId));
    }
  };

  const handleToggleAgentStatus = (agentId: string) => {
    setAgentsData(prev => prev.map(agent =>
      agent.id === agentId ? { ...agent, status: agent.status === 'active' ? 'disabled' : 'active' } : agent
    ));
  };

  const getTypeBadgeClass = (type: string) => {
    const classes = {
      'gpt': styles.typeBadgeGpt,
      'claude': styles.typeBadgeClaude,
      'gemini': styles.typeBadgeGemini,
      'custom': styles.typeBadgeCustom
    };
    return classes[type as keyof typeof classes] || styles.typeBadgeCustom;
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      'gpt': <i className="fas fa-robot text-blue-600 text-sm"></i>,
      'claude': <i className="fas fa-shield-alt text-cyan-600 text-sm"></i>,
      'gemini': <i className="fas fa-brain text-purple-600 text-sm"></i>,
      'custom': <i className="fas fa-cog text-orange-600 text-sm"></i>
    };
    return icons[type as keyof typeof icons] || <i className="fas fa-cog text-orange-600 text-sm"></i>;
  };

  const handleNewSession = () => {
    navigate('/main-workbench');
  };

  const handleModalBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeAgentModal();
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
            <Link 
              to="/main-workbench" 
              className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-secondary hover:bg-bgLight hover:text-primary transition-colors mb-1"
            >
              <i className="fas fa-th-large text-base"></i>
              <span className="text-sm">主工作台</span>
            </Link>
            <Link 
              to="/agent-management" 
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg mb-1 ${styles.navLinkActive}`}
            >
              <i className="fas fa-robot text-base"></i>
              <span className="text-sm">Agent管理</span>
            </Link>
            <Link 
              to="/session-history" 
              className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-secondary hover:bg-bgLight hover:text-primary transition-colors mb-1"
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
              <div className="px-3 py-2.5 rounded-lg cursor-pointer hover:bg-bgLight transition-colors mb-1">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <i className="fas fa-star text-yellow-500 text-xs"></i>
                      <span className="text-sm font-medium text-primary truncate">Python爬虫开发</span>
                    </div>
                    <div className="flex items-center space-x-1 text-xs text-secondary">
                      <i className="fas fa-robot text-[10px]"></i>
                      <span>3个Agent</span>
                      <span className="mx-1">·</span>
                      <span>2分钟前</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="px-3 py-2.5 rounded-lg cursor-pointer hover:bg-bgLight transition-colors mb-1">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-primary truncate block mb-1">API接口设计</span>
                    <div className="flex items-center space-x-1 text-xs text-secondary">
                      <i className="fas fa-robot text-[10px]"></i>
                      <span>2个Agent</span>
                      <span className="mx-1">·</span>
                      <span>1小时前</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* 主内容区 */}
        <main className="flex-1 flex flex-col bg-bgLight">
          {/* 页面头部 */}
          <div className="bg-cardBg border-b border-border px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-semibold text-primary">Agent管理</h1>
                <nav className="text-sm text-secondary mt-1">
                  <span>RoundTable AI</span>
                  <i className="fas fa-chevron-right mx-2 text-xs"></i>
                  <span className="text-primary">Agent管理</span>
                </nav>
              </div>
              <button 
                onClick={() => openAgentModal()}
                className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-all flex items-center space-x-2"
              >
                <i className="fas fa-plus"></i>
                <span className="font-medium">新建Agent</span>
              </button>
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
                    value={agentSearchTerm}
                    onChange={handleSearchChange}
                    placeholder="搜索Agent名称、描述..." 
                    className={`pl-10 pr-4 py-2 bg-bgLight border border-border rounded-lg text-sm w-64 ${styles.inputFocus}`}
                  />
                </div>
                
                {/* 类型筛选 */}
                <select 
                  value={typeFilter}
                  onChange={handleTypeFilterChange}
                  className={`px-3 py-2 bg-bgLight border border-border rounded-lg text-sm ${styles.inputFocus}`}
                >
                  <option value="">所有类型</option>
                  <option value="gpt">GPT系列</option>
                  <option value="claude">Claude系列</option>
                  <option value="gemini">Gemini系列</option>
                  <option value="custom">自定义API</option>
                </select>
                
                {/* 状态筛选 */}
                <select 
                  value={statusFilter}
                  onChange={handleStatusFilterChange}
                  className={`px-3 py-2 bg-bgLight border border-border rounded-lg text-sm ${styles.inputFocus}`}
                >
                  <option value="">所有状态</option>
                  <option value="active">启用</option>
                  <option value="disabled">禁用</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => handleViewSwitch('table')}
                  className={`p-2 rounded-lg ${currentView === 'table' ? 'text-primary bg-bgLight' : 'text-secondary hover:text-primary'} transition-colors`}
                >
                  <i className="fas fa-list"></i>
                </button>
                <button 
                  onClick={() => handleViewSwitch('card')}
                  className={`p-2 rounded-lg ${currentView === 'card' ? 'text-primary bg-bgLight' : 'text-secondary hover:text-primary'} transition-colors`}
                >
                  <i className="fas fa-th-large"></i>
                </button>
              </div>
            </div>
          </div>

          {/* Agent列表内容区 */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* 表格视图 */}
            {currentView === 'table' && (
              <div className="bg-cardBg rounded-card shadow-card overflow-hidden">
                <table className="w-full">
                  <thead className="bg-bgLight border-b border-border">
                    <tr>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider cursor-pointer hover:text-primary"
                        onClick={() => handleSort('name')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Agent名称</span>
                          <i className="fas fa-sort text-[10px]"></i>
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider cursor-pointer hover:text-primary"
                        onClick={() => handleSort('type')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>类型</span>
                          <i className="fas fa-sort text-[10px]"></i>
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">描述</th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider cursor-pointer hover:text-primary"
                        onClick={() => handleSort('status')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>状态</span>
                          <i className="fas fa-sort text-[10px]"></i>
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider cursor-pointer hover:text-primary"
                        onClick={() => handleSort('createdAt')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>创建时间</span>
                          <i className="fas fa-sort text-[10px]"></i>
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">操作</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-border">
                    {currentAgents.map(agent => (
                      <tr key={agent.id} className={styles.tableRowHover}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className={`w-10 h-10 ${getTypeBadgeClass(agent.type)} rounded-lg flex items-center justify-center mr-3`}>
                              {getTypeIcon(agent.type)}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-primary">{agent.name}</div>
                              <div className="text-xs text-secondary">{agent.model}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium ${getTypeBadgeClass(agent.type)} rounded-full`}>
                            {agent.typeName}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-secondary line-clamp-2 max-w-xs">{agent.description}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium ${agent.status === 'active' ? styles.statusBadgeActive : styles.statusBadgeDisabled} rounded-full`}>
                            {agent.status === 'active' ? '启用' : '禁用'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary">
                          {agent.createdAt}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button 
                            onClick={() => handleEditAgent(agent.id)}
                            className="text-primary hover:text-opacity-80 transition-colors" 
                            title="编辑"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button 
                            onClick={() => handleCopyAgent(agent.id)}
                            className="text-secondary hover:text-primary transition-colors" 
                            title="复制"
                          >
                            <i className="fas fa-copy"></i>
                          </button>
                          <button 
                            onClick={() => handleDeleteAgent(agent.id)}
                            className="text-secondary hover:text-danger transition-colors" 
                            title="删除"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                          <button 
                            onClick={() => handleToggleAgentStatus(agent.id)}
                            className="text-secondary hover:text-primary transition-colors" 
                            title={agent.status === 'active' ? '禁用' : '启用'}
                          >
                            <i className="fas fa-power-off"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 卡片视图 */}
            {currentView === 'card' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentAgents.map(agent => (
                  <div key={agent.id} className="bg-cardBg rounded-card shadow-card p-6 hover:shadow-hover transition-all">
                    <div className="flex items-center mb-4">
                      <div className={`w-12 h-12 ${getTypeBadgeClass(agent.type)} rounded-lg flex items-center justify-center mr-3`}>
                        {getTypeIcon(agent.type)}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-primary">{agent.name}</h3>
                        <p className="text-sm text-secondary">{agent.model}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium ${agent.status === 'active' ? styles.statusBadgeActive : styles.statusBadgeDisabled} rounded-full`}>
                        {agent.status === 'active' ? '启用' : '禁用'}
                      </span>
                    </div>
                    
                    <p className="text-sm text-secondary mb-4 line-clamp-3">{agent.description}</p>
                    
                    <div className="flex items-center justify-between text-xs text-secondary mb-4">
                      <span>创建时间: {agent.createdAt}</span>
                      <span className={`px-2 py-1 ${getTypeBadgeClass(agent.type)} rounded-full`}>{agent.typeName}</span>
                    </div>
                    
                    <div className="flex items-center justify-end space-x-2">
                      <button 
                        onClick={() => handleEditAgent(agent.id)}
                        className="p-2 text-primary hover:text-opacity-80 transition-colors" 
                        title="编辑"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button 
                        onClick={() => handleCopyAgent(agent.id)}
                        className="p-2 text-secondary hover:text-primary transition-colors" 
                        title="复制"
                      >
                        <i className="fas fa-copy"></i>
                      </button>
                      <button 
                        onClick={() => handleDeleteAgent(agent.id)}
                        className="p-2 text-secondary hover:text-danger transition-colors" 
                        title="删除"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                      <button 
                        onClick={() => handleToggleAgentStatus(agent.id)}
                        className="p-2 text-secondary hover:text-primary transition-colors" 
                        title={agent.status === 'active' ? '禁用' : '启用'}
                      >
                        <i className="fas fa-power-off"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* 新建/编辑Agent模态框 */}
      {showAgentModal && (
        <div className="fixed inset-0 z-50">
          <div className={styles.modalBackdrop} onClick={handleModalBackdropClick}></div>
          <div className="relative flex items-center justify-center min-h-screen p-4">
            <div className={`bg-cardBg rounded-card shadow-hover w-full max-w-2xl max-h-[90vh] overflow-y-auto ${styles.modalEnter}`}>
              <div className="px-6 py-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-primary">
                    {editingAgentId ? '编辑Agent' : '新建Agent'}
                  </h3>
                  <button 
                    onClick={closeAgentModal}
                    className="text-secondary hover:text-primary transition-colors"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              </div>
              
              <form onSubmit={handleFormSubmit} className="p-6 space-y-6">
                {/* 基本信息 */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-primary">基本信息</h4>
                  
                  <div className="space-y-2">
                    <label htmlFor="agentName" className="block text-sm font-medium text-secondary">Agent名称 *</label>
                    <input 
                      type="text" 
                      id="agentName" 
                      name="agentName" 
                      value={formData.agentName}
                      onChange={handleFormInputChange}
                      className={`w-full px-4 py-2 border border-border rounded-lg text-sm ${styles.inputFocus}`}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="agentType" className="block text-sm font-medium text-secondary">Agent类型 *</label>
                    <select 
                      id="agentType" 
                      name="agentType" 
                      value={formData.agentType}
                      onChange={handleFormInputChange}
                      className={`w-full px-4 py-2 border border-border rounded-lg text-sm ${styles.inputFocus}`}
                      required
                    >
                      <option value="">请选择类型</option>
                      <option value="gpt">GPT系列</option>
                      <option value="claude">Claude系列</option>
                      <option value="gemini">Gemini系列</option>
                      <option value="custom">自定义API</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="agentDescription" className="block text-sm font-medium text-secondary">描述</label>
                    <textarea 
                      id="agentDescription" 
                      name="agentDescription" 
                      rows={3}
                      value={formData.agentDescription}
                      onChange={handleFormInputChange}
                      className={`w-full px-4 py-2 border border-border rounded-lg text-sm resize-none ${styles.inputFocus}`}
                      placeholder="简要描述这个Agent的功能..."
                    ></textarea>
                  </div>
                </div>
                
                {/* API配置 */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-primary">API配置</h4>
                  
                  <div className="space-y-2">
                    <label htmlFor="apiKey" className="block text-sm font-medium text-secondary">API密钥 *</label>
                    <input 
                      type="password" 
                      id="apiKey" 
                      name="apiKey" 
                      value={formData.apiKey}
                      onChange={handleFormInputChange}
                      className={`w-full px-4 py-2 border border-border rounded-lg text-sm ${styles.inputFocus}`}
                      placeholder="sk-..." 
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="modelName" className="block text-sm font-medium text-secondary">模型名称 *</label>
                    <select 
                      id="modelName" 
                      name="modelName" 
                      value={formData.modelName}
                      onChange={handleFormInputChange}
                      className={`w-full px-4 py-2 border border-border rounded-lg text-sm ${styles.inputFocus}`}
                      required
                    >
                      <option value="">请选择模型</option>
                      <option value="gpt-4">GPT-4</option>
                      <option value="gpt-4-turbo">GPT-4 Turbo</option>
                      <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                      <option value="claude-3-opus">Claude 3 Opus</option>
                      <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                      <option value="gemini-pro">Gemini Pro</option>
                      <option value="gemini-ultra">Gemini Ultra</option>
                    </select>
                  </div>
                </div>
                
                {/* 角色设定 */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-primary">角色设定</h4>
                  
                  <div className="space-y-2">
                    <label htmlFor="rolePrompt" className="block text-sm font-medium text-secondary">角色提示词</label>
                    <textarea 
                      id="rolePrompt" 
                      name="rolePrompt" 
                      rows={4}
                      value={formData.rolePrompt}
                      onChange={handleFormInputChange}
                      className={`w-full px-4 py-2 border border-border rounded-lg text-sm resize-none ${styles.inputFocus}`}
                      placeholder="你是一个专业的AI助手，擅长..."
                    ></textarea>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="temperature" className="block text-sm font-medium text-secondary">温度 (0-2)</label>
                      <input 
                        type="number" 
                        id="temperature" 
                        name="temperature" 
                        step="0.1" 
                        min="0" 
                        max="2" 
                        value={formData.temperature}
                        onChange={handleFormInputChange}
                        className={`w-full px-4 py-2 border border-border rounded-lg text-sm ${styles.inputFocus}`}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="maxTokens" className="block text-sm font-medium text-secondary">最大Token数</label>
                      <input 
                        type="number" 
                        id="maxTokens" 
                        name="maxTokens" 
                        min="1" 
                        value={formData.maxTokens}
                        onChange={handleFormInputChange}
                        className={`w-full px-4 py-2 border border-border rounded-lg text-sm ${styles.inputFocus}`}
                      />
                    </div>
                  </div>
                </div>
                
                {/* 模态框底部按钮 */}
                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-border">
                  <button 
                    type="button" 
                    onClick={closeAgentModal}
                    className="px-4 py-2 text-secondary hover:text-primary transition-colors"
                  >
                    取消
                  </button>
                  <button 
                    type="submit" 
                    className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-all"
                  >
                    保存
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentManagementPage;

