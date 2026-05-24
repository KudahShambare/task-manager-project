import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Calendar, 
  Users, 
  FolderKanban,
  CircleDashed,
  Activity,
  CheckCircle2
} from 'lucide-react';
import './Projects.css';

const Projects = () => {
  // Placeholder data mapping to your public.projects schema
  const [projects] = useState([
    {
      id: "p1-a1b2c3d4",
      name: "LooMo Cashless Ecosystem",
      description: "Phase 2 of the delivery platform, focusing on seamless wallet integrations for vendors and couriers in Harare.",
      start_date: "2026-02-01",
      deadline: "2026-06-30",
      max_members: 8,
      current_members: 5, // UI helper (derived from a hypothetical members table join)
      status: "active",
    },
    {
      id: "p2-e5f6g7h8",
      name: "Indigenous Writers Hub Portal",
      description: "Development of the main website including story management systems, team photogrids, and publisher profiles.",
      start_date: "2026-02-15",
      deadline: "2026-05-30",
      max_members: 12,
      current_members: 9,
      status: "active",
    },
    {
      id: "p3-i9j0k1l2",
      name: "Vite SSG Migration",
      description: "Technical debt sprint to migrate the frontend architecture from CRA to Vite, removing legacy TypeScript modules.",
      start_date: "2026-03-01",
      deadline: "2026-03-30",
      max_members: 3,
      current_members: 2,
      status: "completed",
    },
    {
      id: "p4-m3n4o5p6",
      name: "Cloud Storage Network Integration",
      description: "University lab setup for SIEM solutions and ESXi configuration on the storage network.",
      start_date: "2026-06-01",
      deadline: "2026-06-15",
      max_members: 4,
      current_members: 1,
      status: "draft",
    }
  ]);

  const getStatusDisplay = (status) => {
    switch (status.toLowerCase()) {
      case 'draft':
        return { icon: <CircleDashed size={16} />, class: 'status-draft', label: 'Draft' };
      case 'active':
        return { icon: <Activity size={16} />, class: 'status-active', label: 'Active' };
      case 'completed':
        return { icon: <CheckCircle2 size={16} />, class: 'status-completed', label: 'Completed' };
      default:
        return { icon: <FolderKanban size={16} />, class: 'status-draft', label: status };
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Helper to calculate progress based on dates
  const calculateTimelineProgress = (start, end) => {
    const startDate = new Date(start).getTime();
    const endDate = new Date(end).getTime();
    const today = new Date().getTime(); // "Current" time
    
    if (today < startDate) return 0;
    if (today > endDate) return 100;
    return Math.round(((today - startDate) / (endDate - startDate)) * 100);
  };

  return (
    <div className="projects-container">
      {/* Page Header */}
      <div className="projects-header">
        <div>
          <h1>Projects</h1>
          <p className="subtitle">Manage workspaces, timelines, and team capacity.</p>
        </div>
        <button className="btn-primary">
          <Plus size={20} />
          <span>New Project</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="projects-toolbar">
        <div className="search-bar">
          <Search size={18} className="search-icon" />
          <input type="text" placeholder="Search projects by name..." />
        </div>
        <button className="btn-secondary">
          <Filter size={18} />
          <span>Filter</span>
        </button>
      </div>

      {/* Projects Grid */}
      <div className="projects-grid">
        {projects.map((project) => {
          const status = getStatusDisplay(project.status);
          const progress = calculateTimelineProgress(project.start_date, project.deadline);
          
          return (
            <div key={project.id} className="project-card">
              <div className="project-card-header">
                <div className={`project-badge ${status.class}`}>
                  {status.icon}
                  <span>{status.label}</span>
                </div>
                <button className="btn-icon">
                  <MoreVertical size={18} />
                </button>
              </div>

              <div className="project-card-body">
                <h3 className="project-name">{project.name}</h3>
                <p className="project-desc">{project.description}</p>
              </div>
              
              {/* Timeline Progress Bar */}
              <div className="project-timeline">
                <div className="timeline-labels">
                  <span>Timeline</span>
                  <span>{progress}%</span>
                </div>
                <div className="progress-track">
                  <div 
                    className={`progress-fill ${project.status === 'completed' ? 'completed' : ''}`} 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>

              <div className="project-card-footer">
                <div className="project-meta">
                  <div className="meta-item tooltip-container" title="Timeline">
                    <Calendar size={16} />
                    <span>{formatDate(project.start_date)} - {formatDate(project.deadline)}</span>
                  </div>
                  
                  <div className="meta-item tooltip-container" title={`Capacity: ${project.max_members} max members`}>
                    <Users size={16} />
                    <span>{project.current_members} / {project.max_members}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Projects;