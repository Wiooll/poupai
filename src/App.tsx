import { useEffect, useMemo, useState } from 'react';
import { AuthGate } from './components/AuthGate';
import { FinanceProvider } from './context/FinanceContext';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { TransactionsTable } from './components/TransactionsTable';
import { Categories } from './components/Categories';
import { Goals } from './components/Goals';
import { CreditCards } from './components/CreditCards';
import { Insights } from './components/Insights';
import { Loans } from './components/Loans';
import { Management } from './components/Management';
import { Updates } from './components/Updates';
import { APP_VERSION } from './constants/app';
import { getReleaseByVersion } from './constants/releases';
import { getLastSeenVersion, hasUnseenRelease, setLastSeenVersion } from './utils/releaseNotifications';

function AppContent() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [lastSeenVersion, setLastSeenVersionState] = useState<string | null>(null);

  useEffect(() => {
    setLastSeenVersionState(getLastSeenVersion());
  }, []);

  const showReleaseNotification = useMemo(
    () => hasUnseenRelease(APP_VERSION, lastSeenVersion),
    [lastSeenVersion],
  );

  useEffect(() => {
    if (activeTab !== 'updates') return;
    setLastSeenVersion(APP_VERSION);
    setLastSeenVersionState(APP_VERSION);
  }, [activeTab]);

  const currentRelease = getReleaseByVersion(APP_VERSION);

  return (
    <Layout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      releaseNotification={
        showReleaseNotification
          ? {
              version: APP_VERSION,
              highlights: currentRelease?.highlights ?? ['Confira os novos recursos desta versão.'],
            }
          : null
      }
      onOpenUpdates={() => setActiveTab('updates')}
    >
      {activeTab === 'dashboard' && <Dashboard />}
      {activeTab === 'transactions' && <TransactionsTable />}
      {activeTab === 'loans' && <Loans />}
      {activeTab === 'credit-cards' && <CreditCards />}
      {activeTab === 'insights' && <Insights />}
      {activeTab === 'categories' && <Categories />}
      {activeTab === 'goals' && <Goals />}
      {activeTab === 'updates' && <Updates />}
      {activeTab === 'management' && <Management />}
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <AuthGate>
        <FinanceProvider>
          <AppContent />
        </FinanceProvider>
      </AuthGate>
    </AuthProvider>
  );
}

export default App;
