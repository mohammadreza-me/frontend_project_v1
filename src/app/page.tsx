'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useUIStore, useAuthStore } from '@/stores';
import { Header } from '@/components/shared/header';
import { Footer } from '@/components/shared/footer';
import { LoginForm } from '@/components/auth/login-form';
import { RegisterForm } from '@/components/auth/register-form';
import { DashboardPage } from '@/components/dashboard/dashboard-page';
import { WorkspacePage } from '@/components/workspaces/workspace-page';
import QuestionPage from '@/components/question/question-page';
import { SettingsPage } from '@/components/settings/settings-page';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy-load the heaviest component (ReactFlow)
const KnowledgeGraphPage = dynamic(
  () => import('@/components/graph/knowledge-graph-page').then(m => ({ default: m.KnowledgeGraphPage })),
  {
    loading: () => (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[500px] w-full rounded-xl" />
      </div>
    ),
  }
);

function AppContent() {
  const currentPage = useUIStore((s) => s.currentPage);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!isAuthenticated) {
    switch (currentPage) {
      case 'register':
        return <RegisterForm />;
      case 'login':
      default:
        return <LoginForm />;
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <PageRouter page={currentPage} />
      </main>
      <Footer />
    </div>
  );
}

function PageRouter({ page }: { page: string }) {
  switch (page) {
    case 'dashboard':
      return <DashboardPage />;
    case 'workspace':
      return <WorkspacePage />;
    case 'practice':
    case 'exam':
      return <QuestionPage />;
    case 'knowledge-graph':
      return <KnowledgeGraphPage />;
    case 'settings':
      return <SettingsPage />;
    default:
      return <DashboardPage />;
  }
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AppContent />
    </Suspense>
  );
}