import { type LucideIcon } from 'lucide-react';
import { cn } from '../utils/lib';
import { useScrollDirection } from '../hooks/useScrollDirection';

interface MenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface MobileBottomNavProps {
  items: MenuItem[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function MobileBottomNav({ items, activeTab, setActiveTab }: MobileBottomNavProps) {
  const scrollDirection = useScrollDirection();

  return (
    <nav 
      className={cn(
        "md:hidden fixed bottom-0 left-0 w-full z-50 bg-card/90 backdrop-blur-lg border-t border-border transition-transform duration-300 ease-in-out",
        scrollDirection === 'down' ? 'translate-y-[150%]' : 'translate-y-0'
      )}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="flex items-center px-2 py-2 overflow-x-auto no-scrollbar gap-1 whitespace-nowrap touch-pan-x snap-x snap-mandatory">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <li key={item.id} className="flex-shrink-0 min-w-[76px] snap-start">
              <button
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  'w-full min-h-[48px] min-w-[48px] flex md:hidden flex-col items-center justify-center gap-1.5 p-2 rounded-2xl transition-all duration-200 ease-in-out touch-manipulation',
                  isActive
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:bg-secondary/80'
                )}
                aria-label={item.label}
              >
                <Icon size={22} className={cn('transition-transform', isActive ? 'scale-110' : 'scale-100')} />
                <span className={cn('text-[10px] font-medium transition-colors', isActive ? 'text-primary' : '')}>
                  {item.label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
