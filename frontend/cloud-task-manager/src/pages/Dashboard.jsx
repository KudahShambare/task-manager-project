import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, CheckSquare, UserCircle } from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
  return (
    <div className="app-shell">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <LayoutDashboard className="brand-icon" />
          <div className="brand-text">
            <p className="eyebrow">Cloud Task Manager</p>
            <h1>Workspace</h1>
          </div>
        </div>
        
        <nav className="main-nav">
          <NavLink to="/projects" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <FolderKanban className="nav-icon" />
            <span>Projects</span>
          </NavLink>
          
          <NavLink to="/tasks" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <CheckSquare className="nav-icon" />
            <span>Tasks</span>
          </NavLink>
          
          <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <UserCircle className="nav-icon" />
            <span>Profile</span>
          </NavLink>
        </nav>
      </aside>

      {/* Main Content Area - Your other pages will load inside here */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

export default Dashboard;