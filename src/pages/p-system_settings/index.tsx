

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './styles.module.css';

interface SettingsData {
  theme: string;
  fontSize: string;
  notifications: boolean;
  autoSave: boolean;
  twoFactor: boolean;
  dataStorage: string;
  dataRetention: string;
  analytics: boolean;
}

interface ApiKeyStatus {
  openai: { configured: boolean; status: string; color: string };
  anthropic: { configured: boolean; status: string; color: string };
  google: { configured: boolean; status: string; color: string };
}

const SystemSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  
  // 设置状态
  const [settingsData, setSettingsData] = useState<SettingsData>({
    theme: 'light',
    fontSize: 'medium',
    notifications: true,
    autoSave: true,
    twoFactor: false,
    dataStorage: 'cn',
    dataRetention: '90',
    analytics: true,
  });

  // API密钥状态
  const [apiKeyStatus, setApiKeyStatus] = useState<ApiKeyStatus>({
    openai: { configured: true, status: '已配置', color: 'green' },
    anthropic: { configured: true, status: '已配置', color: 'green' },
    google: { configured: false, status: '未配置', color: 'yellow' },
  });

  // 模态框状态
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentApiType, setCurrentApiType] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [apiKeyDescription, setApiKeyDescription] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 保存成功提示状态
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  // 设置页面标题
  useEffect(() => {
    const originalTitle = document.title;
    document.title = 'RoundTable AI - 系统设置';
    return () => { 
      document.title = originalTitle; 
    };
  }, []);

  // 处理设置变更
  const handleSettingChange = (key: keyof SettingsData, value: string | boolean) => {
    setSettingsData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // 保存所有设置
  const handleSaveAllSettings = () => {
    console.log('保存设置:', settingsData);
    showSaveSuccessToast();
  };

  // 打开API密钥编辑模态框
  const openApiKeyModal = (apiType: string, title: string, currentKey: string) => {
    setCurrentApiType(apiType);
    setApiKeyInput(currentKey);
    setApiKeyDescription('');
    setShowApiKeyModal(true);
  };

  // 保存API密钥
  const handleSaveApiKey = () => {
    console.log(`保存${currentApiType} API密钥:`, { apiKey: apiKeyInput, description: apiKeyDescription });
    
    setApiKeyStatus(prev => ({
      ...prev,
      [currentApiType]: {
        configured: !!apiKeyInput,
        status: apiKeyInput ? '已配置' : '未配置',
        color: apiKeyInput ? 'green' : 'yellow'
      }
    }));
    
    setShowApiKeyModal(false);
    showSaveSuccessToast();
  };

  // 打开修改密码模态框
  const openPasswordModal = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowPasswordModal(true);
  };

  // 保存密码修改
  const handleSavePassword = () => {
    if (newPassword !== confirmPassword) {
      alert('新密码和确认密码不匹配');
      return;
    }
    
    console.log('修改密码:', { currentPassword, newPassword });
    setShowPasswordModal(false);
    showSaveSuccessToast();
  };

  // 查看登录历史
  const handleViewLoginHistory = () => {
    console.log('查看登录历史');
    alert('登录历史功能将在后续版本中提供');
  };

  // 删除账号
  const handleDeleteAccount = () => {
    if (confirm('确定要删除账号吗？此操作不可撤销，将永久删除您的所有数据。')) {
      console.log('删除账号');
      alert('账号删除功能将在后续版本中提供');
    }
  };

  // 显示保存成功提示
  const showSaveSuccessToast = () => {
    setShowSaveSuccess(true);
    setTimeout(() => {
      setShowSaveSuccess(false);
    }, 3000);
  };

  // 处理会话项点击
  const handleSessionItemClick = () => {
    navigate('/main-workbench');
  };

  // 处理新建会话
  const handleNewSession = () => {
    navigate('/main-workbench');
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
              className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-secondary hover:bg-bgLight hover:text-primary transition-colors mb-1"
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
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg ${styles.navLinkActive}`}
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
              <div 
                onClick={handleSessionItemClick}
                className="px-3 py-2.5 rounded-lg cursor-pointer hover:bg-bgLight transition-colors mb-1"
              >
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
              
              <div 
                onClick={handleSessionItemClick}
                className="px-3 py-2.5 rounded-lg cursor-pointer hover:bg-bgLight transition-colors mb-1"
              >
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
              
              <div 
                onClick={handleSessionItemClick}
                className="px-3 py-2.5 rounded-lg cursor-pointer hover:bg-bgLight transition-colors mb-1"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-primary truncate block mb-1">数据库优化方案</span>
                    <div className="flex items-center space-x-1 text-xs text-secondary">
                      <i className="fas fa-robot text-[10px]"></i>
                      <span>4个Agent</span>
                      <span className="mx-1">·</span>
                      <span>昨天</span>
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
                <h1 className="text-lg font-semibold text-primary">系统设置</h1>
                <nav className="text-sm text-secondary mt-1">
                  <span>设置</span>
                </nav>
              </div>
              <div>
                <button 
                  onClick={handleSaveAllSettings}
                  className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-opacity-90 transition-all flex items-center space-x-2"
                >
                  <i className="fas fa-save text-sm"></i>
                  <span className="font-medium">保存所有设置</span>
                </button>
              </div>
            </div>
          </div>

          {/* 设置内容区域 */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl space-y-6">
              
              {/* 通用设置 */}
              <div className={`bg-cardBg rounded-card shadow-card ${styles.settingSection}`}>
                <div className="px-6 py-4 border-b border-border">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <i className="fas fa-palette text-blue-600 text-sm"></i>
                    </div>
                    <h2 className="text-lg font-semibold text-primary">通用设置</h2>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-sm font-medium text-primary mb-1">界面主题</label>
                      <p className="text-xs text-secondary">选择适合您的界面主题</p>
                    </div>
                    <select 
                      value={settingsData.theme}
                      onChange={(e) => handleSettingChange('theme', e.target.value)}
                      className={`px-3 py-2 border border-border rounded-lg text-sm ${styles.inputFocus}`}
                    >
                      <option value="light">浅色主题</option>
                      <option value="dark">深色主题</option>
                      <option value="auto">跟随系统</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-sm font-medium text-primary mb-1">字体大小</label>
                      <p className="text-xs text-secondary">调整界面文字大小</p>
                    </div>
                    <select 
                      value={settingsData.fontSize}
                      onChange={(e) => handleSettingChange('fontSize', e.target.value)}
                      className={`px-3 py-2 border border-border rounded-lg text-sm ${styles.inputFocus}`}
                    >
                      <option value="small">小</option>
                      <option value="medium">中</option>
                      <option value="large">大</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-sm font-medium text-primary mb-1">通知设置</label>
                      <p className="text-xs text-secondary">接收新消息通知</p>
                    </div>
                    <label className={styles.toggleSwitch}>
                      <input 
                        type="checkbox" 
                        checked={settingsData.notifications}
                        onChange={(e) => handleSettingChange('notifications', e.target.checked)}
                      />
                      <span className={styles.toggleSlider}></span>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-sm font-medium text-primary mb-1">自动保存</label>
                      <p className="text-xs text-secondary">自动保存会话历史</p>
                    </div>
                    <label className={styles.toggleSwitch}>
                      <input 
                        type="checkbox" 
                        checked={settingsData.autoSave}
                        onChange={(e) => handleSettingChange('autoSave', e.target.checked)}
                      />
                      <span className={styles.toggleSlider}></span>
                    </label>
                  </div>
                </div>
              </div>

              {/* 账号安全 */}
              <div className={`bg-cardBg rounded-card shadow-card ${styles.settingSection}`}>
                <div className="px-6 py-4 border-b border-border">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <i className="fas fa-shield-alt text-green-600 text-sm"></i>
                    </div>
                    <h2 className="text-lg font-semibold text-primary">账号安全</h2>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-sm font-medium text-primary mb-1">修改密码</label>
                      <p className="text-xs text-secondary">定期更新密码以保护账号安全</p>
                    </div>
                    <button 
                      onClick={openPasswordModal}
                      className="px-4 py-2 bg-bgLight text-primary rounded-lg hover:bg-border transition-colors text-sm"
                    >
                      修改
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-sm font-medium text-primary mb-1">两步验证</label>
                      <p className="text-xs text-secondary">启用两步验证增强账号安全</p>
                    </div>
                    <label className={styles.toggleSwitch}>
                      <input 
                        type="checkbox" 
                        checked={settingsData.twoFactor}
                        onChange={(e) => handleSettingChange('twoFactor', e.target.checked)}
                      />
                      <span className={styles.toggleSlider}></span>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-sm font-medium text-primary mb-1">登录历史</label>
                      <p className="text-xs text-secondary">查看最近的登录记录</p>
                    </div>
                    <button 
                      onClick={handleViewLoginHistory}
                      className="px-4 py-2 bg-bgLight text-primary rounded-lg hover:bg-border transition-colors text-sm"
                    >
                      查看
                    </button>
                  </div>
                </div>
              </div>

              {/* API密钥管理 */}
              <div className={`bg-cardBg rounded-card shadow-card ${styles.settingSection}`}>
                <div className="px-6 py-4 border-b border-border">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <i className="fas fa-key text-purple-600 text-sm"></i>
                    </div>
                    <h2 className="text-lg font-semibold text-primary">API密钥管理</h2>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block text-sm font-medium text-primary mb-1">OpenAI API密钥</label>
                        <p className="text-xs text-secondary">用于GPT系列模型的访问</p>
                      </div>
                      <button 
                        onClick={() => openApiKeyModal('openai', 'OpenAI API密钥', 'sk-...')}
                        className="px-4 py-2 bg-bgLight text-primary rounded-lg hover:bg-border transition-colors text-sm"
                      >
                        编辑
                      </button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 bg-${apiKeyStatus.openai.color}-500 rounded-full`}></div>
                      <span className="text-sm text-secondary">{apiKeyStatus.openai.status}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block text-sm font-medium text-primary mb-1">Anthropic API密钥</label>
                        <p className="text-xs text-secondary">用于Claude系列模型的访问</p>
                      </div>
                      <button 
                        onClick={() => openApiKeyModal('anthropic', 'Anthropic API密钥', 'sk-...')}
                        className="px-4 py-2 bg-bgLight text-primary rounded-lg hover:bg-border transition-colors text-sm"
                      >
                        编辑
                      </button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 bg-${apiKeyStatus.anthropic.color}-500 rounded-full`}></div>
                      <span className="text-sm text-secondary">{apiKeyStatus.anthropic.status}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block text-sm font-medium text-primary mb-1">Google API密钥</label>
                        <p className="text-xs text-secondary">用于Gemini系列模型的访问</p>
                      </div>
                      <button 
                        onClick={() => openApiKeyModal('google', 'Google API密钥', '')}
                        className="px-4 py-2 bg-bgLight text-primary rounded-lg hover:bg-border transition-colors text-sm"
                      >
                        编辑
                      </button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 bg-${apiKeyStatus.google.color}-500 rounded-full`}></div>
                      <span className="text-sm text-secondary">{apiKeyStatus.google.status}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 数据与隐私 */}
              <div className={`bg-cardBg rounded-card shadow-card ${styles.settingSection}`}>
                <div className="px-6 py-4 border-b border-border">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                      <i className="fas fa-user-shield text-orange-600 text-sm"></i>
                    </div>
                    <h2 className="text-lg font-semibold text-primary">数据与隐私</h2>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-sm font-medium text-primary mb-1">数据存储位置</label>
                      <p className="text-xs text-secondary">选择您的数据存储地区</p>
                    </div>
                    <select 
                      value={settingsData.dataStorage}
                      onChange={(e) => handleSettingChange('dataStorage', e.target.value)}
                      className={`px-3 py-2 border border-border rounded-lg text-sm ${styles.inputFocus}`}
                    >
                      <option value="cn">中国</option>
                      <option value="us">美国</option>
                      <option value="eu">欧洲</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-sm font-medium text-primary mb-1">数据保留期限</label>
                      <p className="text-xs text-secondary">设置会话历史的保留时间</p>
                    </div>
                    <select 
                      value={settingsData.dataRetention}
                      onChange={(e) => handleSettingChange('dataRetention', e.target.value)}
                      className={`px-3 py-2 border border-border rounded-lg text-sm ${styles.inputFocus}`}
                    >
                      <option value="30">30天</option>
                      <option value="90">90天</option>
                      <option value="180">180天</option>
                      <option value="365">1年</option>
                      <option value="forever">永久</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-sm font-medium text-primary mb-1">使用分析</label>
                      <p className="text-xs text-secondary">帮助我们改进产品体验</p>
                    </div>
                    <label className={styles.toggleSwitch}>
                      <input 
                        type="checkbox" 
                        checked={settingsData.analytics}
                        onChange={(e) => handleSettingChange('analytics', e.target.checked)}
                      />
                      <span className={styles.toggleSlider}></span>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-sm font-medium text-primary mb-1">删除账号</label>
                      <p className="text-xs text-secondary">永久删除您的账号和所有数据</p>
                    </div>
                    <button 
                      onClick={handleDeleteAccount}
                      className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* 保存成功提示 */}
      <div className={`fixed top-20 right-6 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg transform transition-transform duration-300 z-50 ${showSaveSuccess ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center space-x-2">
          <i className="fas fa-check-circle"></i>
          <span>设置已保存</span>
        </div>
      </div>

      {/* API密钥编辑模态框 */}
      {showApiKeyModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowApiKeyModal(false);
            }
          }}
        >
          <div className="bg-cardBg rounded-card shadow-card w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-border">
              <h3 className="text-lg font-semibold text-primary">编辑{currentApiType === 'openai' ? 'OpenAI API密钥' : currentApiType === 'anthropic' ? 'Anthropic API密钥' : 'Google API密钥'}</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="api-key-input" className="block text-sm font-medium text-primary mb-2">API密钥</label>
                  <input 
                    type="password" 
                    id="api-key-input"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    className={`w-full px-3 py-2 border border-border rounded-lg text-sm ${styles.inputFocus}`}
                    placeholder="请输入API密钥"
                  />
                </div>
                <div>
                  <label htmlFor="api-key-description" className="block text-sm font-medium text-primary mb-2">描述（可选）</label>
                  <input 
                    type="text" 
                    id="api-key-description"
                    value={apiKeyDescription}
                    onChange={(e) => setApiKeyDescription(e.target.value)}
                    className={`w-full px-3 py-2 border border-border rounded-lg text-sm ${styles.inputFocus}`}
                    placeholder="为这个密钥添加描述"
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-border flex items-center justify-end space-x-3">
              <button 
                onClick={() => setShowApiKeyModal(false)}
                className="px-4 py-2 text-secondary hover:text-primary transition-colors text-sm"
              >
                取消
              </button>
              <button 
                onClick={handleSaveApiKey}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-colors text-sm"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 修改密码模态框 */}
      {showPasswordModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowPasswordModal(false);
            }
          }}
        >
          <div className="bg-cardBg rounded-card shadow-card w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-border">
              <h3 className="text-lg font-semibold text-primary">修改密码</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="current-password" className="block text-sm font-medium text-primary mb-2">当前密码</label>
                  <input 
                    type="password" 
                    id="current-password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className={`w-full px-3 py-2 border border-border rounded-lg text-sm ${styles.inputFocus}`}
                    placeholder="请输入当前密码"
                  />
                </div>
                <div>
                  <label htmlFor="new-password" className="block text-sm font-medium text-primary mb-2">新密码</label>
                  <input 
                    type="password" 
                    id="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={`w-full px-3 py-2 border border-border rounded-lg text-sm ${styles.inputFocus}`}
                    placeholder="请输入新密码"
                  />
                </div>
                <div>
                  <label htmlFor="confirm-password" className="block text-sm font-medium text-primary mb-2">确认新密码</label>
                  <input 
                    type="password" 
                    id="confirm-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full px-3 py-2 border border-border rounded-lg text-sm ${styles.inputFocus}`}
                    placeholder="请再次输入新密码"
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-border flex items-center justify-end space-x-3">
              <button 
                onClick={() => setShowPasswordModal(false)}
                className="px-4 py-2 text-secondary hover:text-primary transition-colors text-sm"
              >
                取消
              </button>
              <button 
                onClick={handleSavePassword}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-colors text-sm"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemSettingsPage;

