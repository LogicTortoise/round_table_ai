import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ErrorBoundary } from '../components/ErrorBoundary';

import P_main_workbench from '../pages/p-main_workbench';
import P_agent_management from '../pages/p-agent_management';
import P_session_history from '../pages/p-session_history';
import P_system_settings from '../pages/p-system_settings';
import ApiTest from '../components/ApiTest';
import NotFoundPage from './NotFoundPage';
import ErrorPage from './ErrorPage';

// 使用 createBrowserRouter 创建路由实例
const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/main-workbench" replace />,
  },
  {
    path: '/main-workbench',
    element: (
      <ErrorBoundary>
        <P_main_workbench />
      </ErrorBoundary>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: '/agent-management',
    element: (
      <ErrorBoundary>
        <P_agent_management />
      </ErrorBoundary>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: '/session-history',
    element: (
      <ErrorBoundary>
        <P_session_history />
      </ErrorBoundary>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: '/system-settings',
    element: (
      <ErrorBoundary>
        <P_system_settings />
      </ErrorBoundary>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: '/api-test',
    element: (
      <ErrorBoundary>
        <ApiTest />
      </ErrorBoundary>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);

export default router;