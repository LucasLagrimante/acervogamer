import { 
  BarChart2, 
  FolderHeart
} from 'lucide-react';
import './Sidebar.css';

interface SidebarProps {
  currentTab: string;
  setTab: (tab: string) => void;
  totalGames: number;
}

export function Sidebar({ currentTab, setTab, totalGames }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-container">
          <img src="/favicon.png" alt="Acervo Gamer Logo" className="logo-icon custom-logo" width="32" height="32" />
        </div>
        <div>
          <h1 className="logo-text">ACERVO</h1>
          <p className="logo-sub">GAMER</p>
        </div>
      </div>

      <div className="stats-mini">
        <span className="stats-mini-label">TOTAL SAVE</span>
        <span className="stats-mini-value">{totalGames}</span>
      </div>

      <nav className="sidebar-nav">
        <button 
          className={`nav-btn ${currentTab === 'library' ? 'active' : ''}`}
          onClick={() => setTab('library')}
        >
          <FolderHeart size={18} />
          <span>Biblioteca</span>
        </button>
        <button 
          className={`nav-btn ${currentTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setTab('dashboard')}
        >
          <BarChart2 size={18} />
          <span>Estatísticas</span>
        </button>
      </nav>

      <div className="sidebar-footer">
        <p className="footer-v">v1.0.0 Refactor</p>
      </div>
    </aside>
  );
}
