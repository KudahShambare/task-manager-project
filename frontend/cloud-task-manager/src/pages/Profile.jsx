import React from 'react';
import { Mail, Building, Briefcase, CheckCircle2, Circle } from 'lucide-react';
import './Profile.css';

const Profile = () => {
  // Placeholder data
  const user = {
    fullName: "Alex Developer",
    email: "alex@loomo.app",
    department: "Engineering & Architecture",
    role: "Lead Full-Stack Developer",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex&backgroundColor=eef2ff",
  };

  const projectHistory = [
    {
      id: 1,
      name: "Vendor PWA Migration",
      status: "Active",
      tasks: [
        { id: 101, title: "Migrate from Create React App to Vite", completed: true },
        { id: 102, title: "Remove legacy TypeScript modules", completed: true },
        { id: 103, title: "Implement Vite SSG for offline access", completed: false }
      ]
    },
    {
      id: 2,
      name: "Cashless Payment Ecosystem",
      status: "Completed",
      tasks: [
        { id: 201, title: "Design PostgreSQL database schema", completed: true },
        { id: 202, title: "Integrate 100% cashless payment gateway", completed: true },
        { id: 203, title: "Merge QR codes into digital vendor flyers", completed: true }
      ]
    },
    {
      id: 3,
      name: "Indigenous Writers Hub Platform",
      status: "Active",
      tasks: [
        { id: 301, title: "Setup Supabase backend for story management", completed: true },
        { id: 302, title: "Build team photogrid for featured writers", completed: false }
      ]
    }
  ];

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>User Profile</h1>
        <p className="subtitle">Manage your personal information and track your project history.</p>
      </div>

      <div className="profile-grid">
        {/* Left Column: Personal Info Card */}
        <div className="profile-card user-info-card">
          <div className="avatar-section">
            <img src={user.avatar} alt={user.fullName} className="avatar-img" />
            <h2>{user.fullName}</h2>
            <span className="role-badge">{user.role}</span>
          </div>
          
          <div className="info-list">
            <div className="info-item">
              <Mail className="info-icon" />
              <div>
                <span className="info-label">Email Address</span>
                <span className="info-value">{user.email}</span>
              </div>
            </div>
            
            <div className="info-item">
              <Building className="info-icon" />
              <div>
                <span className="info-label">Department</span>
                <span className="info-value">{user.department}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Project History */}
        <div className="profile-card projects-card">
          <div className="card-header">
            <Briefcase className="header-icon" />
            <h3>Project History</h3>
          </div>
          
          <div className="projects-list">
            {projectHistory.map(project => (
              <div key={project.id} className="project-item">
                <div className="project-header">
                  <h4>{project.name}</h4>
                  <span className={`status-badge ${project.status.toLowerCase()}`}>
                    {project.status}
                  </span>
                </div>
                
                <div className="tasks-list">
                  {project.tasks.map(task => (
                    <div key={task.id} className="task-item">
                      {task.completed ? (
                        <CheckCircle2 className="task-icon completed" />
                      ) : (
                        <Circle className="task-icon pending" />
                      )}
                      <span className={task.completed ? "task-text completed" : "task-text"}>
                        {task.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;