import type { ReactNode } from 'react';
import {
  BrainCircuit,
  Circle,
  CircleDollarSign,
  CreditCard,
  LayoutDashboard,
  Megaphone,
  Moon,
  ReceiptText,
  Settings,
  Sun,
  Tags,
  Target,
  Wallet,
} from 'lucide-react';
import type { ThemeMode } from '../types';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { APP_NAME, APP_VERSION } from '../constants/app';
import { cn } from '../utils/lib';
import { MobileBottomNav } from './MobileBottomNav';
import { buildCopyrightText } from '../utils/uiPreferences';

interface LayoutProps {
  children: ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  releaseNotification: { version: string; highlights: string[] } | null;
  onOpenUpdates: () => void;
}

export const Layout = ({
  children,
  activeTab,
  setActiveTab,
  releaseNotification,
  onOpenUpdates,
}: LayoutProps) => {
  const { config, setThemeMode } = useFinance();
  const { user, logout } = useAuth();
  const currentTheme = config.themeMode || (config.isDarkMode ? 'black' : 'white');
  const currentYear = new Date().getFullYear();
  const copyrightText = buildCopyrightText(APP_NAME, currentYear);
  const toggleTheme = () => {
    const modes: ThemeMode[] = ['white', 'black', 'gray'];
    const currentIndex = modes.indexOf(currentTheme as ThemeMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    void setThemeMode(modes[nextIndex]);
  };

  const getThemeIcon = () => {
    switch (currentTheme) {
      case 'black':
        return <Moon size={16} />;
      case 'gray':
        return <Circle size={16} />;
      default:
        return <Sun size={16} />;
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transações', icon: ReceiptText },
    { id: 'loans', label: 'Empréstimos', icon: CircleDollarSign },
    { id: 'credit-cards', label: 'Cartões', icon: CreditCard },
    { id: 'insights', label: 'Insights', icon: BrainCircuit },
    { id: 'categories', label: 'Categorias', icon: Tags },
    { id: 'goals', label: 'Metas', icon: Target },
    { id: 'updates', label: 'Atualizações', icon: Megaphone },
    { id: 'management', label: 'Gerenciamento', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row font-sans transition-colors duration-300">
      <aside className="w-full md:w-64 bg-card border-r border-border p-4 flex flex-col shadow-sm z-10 hidden md:flex">
        <div className="flex items-center gap-2 mb-8 px-2">
          <div className="bg-primary text-primary-foreground p-2 rounded-lg">
            <Wallet size={24} />
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
            {APP_NAME}
          </h1>
        </div>

        <nav className="flex-1 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm font-medium',
                  activeTab === item.id
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                )}
              >
                <Icon size={17} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto pt-4 border-t border-border">
          <div className="px-4 pb-3 space-y-1">
            <p className="text-xs text-muted-foreground truncate">{user?.email || 'Usuário autenticado'}</p>
            <p className="text-xs text-muted-foreground">Versão {APP_VERSION}</p>
          </div>
          <div className="w-full flex items-center justify-between px-4 py-2 rounded-lg text-muted-foreground gap-2">
            <span className="text-sm font-medium">Tema</span>
            <button
              onClick={toggleTheme}
              className="h-9 w-9 flex items-center justify-center rounded-lg border border-input bg-background hover:bg-secondary transition-colors"
              title="Alternar tema"
            >
              {getThemeIcon()}
            </button>
          </div>
          <button
            onClick={() => void logout()}
            className="mt-2 w-full px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-all text-left"
          >
            Sair da conta
          </button>
        </div>
      </aside>

      <div className="md:hidden flex items-center justify-between bg-card p-4 border-b border-border z-10 sticky top-0">
        <div className="flex items-center gap-2">
          <Wallet size={20} className="text-primary" />
          <h1 className="text-lg font-bold">{APP_NAME}</h1>
        </div>
        <button
          onClick={toggleTheme}
          className="h-9 w-9 flex items-center justify-center rounded-lg border border-input bg-background hover:bg-secondary transition-colors"
          title="Alternar tema"
        >
          {getThemeIcon()}
        </button>
      </div>

      <MobileBottomNav items={menuItems} activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 p-4 pb-28 md:p-8 md:pb-8 overflow-y-auto w-full max-w-[1600px] mx-auto min-h-[calc(100dvh-60px)]">
        {releaseNotification && (
          <section className="mb-4 bg-primary/10 border border-primary/20 rounded-xl p-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-primary">Novidades da versão {releaseNotification.version}</p>
                <p className="text-xs text-primary/90">
                  {releaseNotification.highlights[0] || 'Confira os novos recursos desta versão.'}
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenUpdates}
                className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity"
              >
                Ver atualizações
              </button>
            </div>
          </section>
        )}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">{children}</div>
        <footer className="mt-8 pt-6 border-t border-border text-xs text-muted-foreground text-center">
          {copyrightText}
        </footer>
      </main>
    </div>
  );
};
