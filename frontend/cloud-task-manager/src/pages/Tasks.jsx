/**
 * Tasks Page
 * View existing tasks
 * Create New Task
 * Edit Task
 * Delete Taj
 */


import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Clock, 
  MessageSquare,
  CircleDashed,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import './Tasks.css';

const Tasks = () => {
  // Placeholder data mapping to your public.tasks schema
  const [tasks] = useState([
    {
      id: "a1b2c3d4-...",
      project_id: "p1-...",
      title: "Design PostgreSQL database schema for payments",
      description: "Map out the schema for the cashless payment integration. Ensure we have tables for transactions, vendor balances, and dispute ledgers.",
      status: "COMPLETED",
      assignee: { name: "Alex D.", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex&backgroundColor=eef2ff" },
      created_at: "2026-05-20T10:00:00Z",
    },
    {
      id: "e5f6g7h8-...",
      project_id: "p2-...",
      title: "Implement Vite SSG for offline access",
      description: "Vendors experience spotty network connections. We need to implement Static Site Generation so the core shell of the PWA loads immediately.",
      status: "IN_PROGRESS",
      assignee: { name: "Faith N.", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Faith&backgroundColor=fce7f3" },
      created_at: "2026-05-22T14:30:00Z",
    },
    {
      id: "i9j0k1l2-...",
      project_id: "p2-...",
      title: "Merge QR codes into digital vendor flyers",
      description: "Create a utility to overlay unique merchant QR codes onto promotional flyer templates for social media sharing.",
      status: "DRAFT",
      assignee: null, // Reflecting assignee_member_id nullable constraint
      created_at: "2026-05-23T09:15:00Z",
    }
  ]);

  // Helper to render the correct icon and color based on the task_status enum
  const getStatusDisplay = (status) => {
    switch (status) {
      case 'DRAFT':
        return { icon: <CircleDashed size={16} />, class: 'status-draft', label: 'Draft' };
      case 'IN_PROGRESS':
        return { icon: <Loader2 size={16} className="spin-icon" />, class: 'status-progress', label: 'In Progress' };
      case 'COMPLETED':
        return { icon: <CheckCircle2 size={16} />, class: 'status-completed', label: 'Completed' };
      default:
        return { icon: <CircleDashed size={16} />, class: 'status-draft', label: status };
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="tasks-container">
      {/* Page Header */}
      <div className="tasks-header">
        <div>
          <h1>Tasks</h1>
          <p className="subtitle">Manage and track your project deliverables.</p>
        </div>
        <button className="btn-primary">
          <Plus size={20} />
          <span>New Task</span>
        </button>
      </div>

      {/* Toolbar: Search and Filter */}
      <div className="tasks-toolbar">
        <div className="search-bar">
          <Search size={18} className="search-icon" />
          <input type="text" placeholder="Search tasks by title or ID..." />
        </div>
        <button className="btn-secondary">
          <Filter size={18} />
          <span>Filter</span>
        </button>
      </div>

      {/* Tasks List */}
      <div className="tasks-grid">
        {tasks.map((task) => {
          const status = getStatusDisplay(task.status);
          
          return (
            <div key={task.id} className="task-card">
              <div className="task-card-header">
                <div className={`task-badge ${status.class}`}>
                  {status.icon}
                  <span>{status.label}</span>
                </div>
                <button className="btn-icon">
                  <MoreVertical size={18} />
                </button>
              </div>

              <div className="task-card-body">
                <h3 className="task-title">{task.title}</h3>
                <p className="task-desc">{task.description}</p>
              </div>

              <div className="task-card-footer">
                <div className="task-meta">
                  <span className="meta-item">
                    <Clock size={14} />
                    {formatDate(task.created_at)}
                  </span>
                  <span className="meta-item">
                    <MessageSquare size={14} />
                    0
                  </span>
                </div>
                
                <div className="task-assignee">
                  {task.assignee ? (
                    <img 
                      src={task.assignee.avatar} 
                      alt={task.assignee.name} 
                      title={`Assigned to ${task.assignee.name}`}
                      className="assignee-avatar" 
                    />
                  ) : (
                    <div className="unassigned-avatar" title="Unassigned">
                      <Plus size={14} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Tasks;

