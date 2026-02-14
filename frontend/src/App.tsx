import { useState } from 'react';
import { Settings, FileText, History, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Dashboard from '@/pages/Dashboard';
import SettingsPage from '@/pages/Settings';
import HistoryPage from '@/pages/History';

type Page = 'dashboard' | 'settings' | 'history';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navItems = [
    { id: 'dashboard' as Page, label: 'Generate', icon: FileText },
    { id: 'history' as Page, label: 'History', icon: History },
    { id: 'settings' as Page, label: 'Settings', icon: Settings },
  ];

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'settings':
        return <SettingsPage />;
      case 'history':
        return <HistoryPage />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside
        className={cn(
          'bg-card border-r border-border transition-all duration-300 flex flex-col',
          sidebarOpen ? 'w-64' : 'w-16'
        )}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-border">
          {sidebarOpen && (
            <h1 className="font-semibold text-lg truncate">Test Plan Generator</h1>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="ml-auto"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <Button
                key={item.id}
                variant={isActive ? 'secondary' : 'ghost'}
                className={cn(
                  'w-full justify-start',
                  !sidebarOpen && 'justify-center px-2'
                )}
                onClick={() => setCurrentPage(item.id)}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {sidebarOpen && <span className="ml-3">{item.label}</span>}
              </Button>
            );
          })}
        </nav>

        {/* Footer */}
        {sidebarOpen && (
          <div className="p-4 border-t border-border text-xs text-muted-foreground">
            <p>v1.0.0</p>
            <p className="mt-1">JIRA + LLM Integration</p>
            <p className="mt-2 font-medium text-primary">Develop by Bhaumik Gohel</p>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="h-full">{renderPage()}</div>
      </main>
    </div>
  );
}

export default App;
