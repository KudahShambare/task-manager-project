import { useCallback, useEffect, useMemo, useState } from 'react';
import './App.css';
import { apiRequest } from './api';

const emptyAuthForm = {
  name: '',
  email: '',
  password: '',
};

const statusLabels = {
  TODO: 'To do',
  IN_PROGRESS: 'In progress',
  DONE: 'Done',
};

function loadStoredSession() {
  const rawSession = localStorage.getItem('task-manager-session') || sessionStorage.getItem('task-manager-session');

  if (!rawSession) {
    return null;
  }

  try {
    return JSON.parse(rawSession);
  } catch {
    localStorage.removeItem('task-manager-session');
    sessionStorage.removeItem('task-manager-session');
    return null;
  }
}

function App() {
  const [session, setSession] = useState(loadStoredSession);
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState(emptyAuthForm);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState('');
  const [projectForm, setProjectForm] = useState({ name: '', description: '' });
  const [memberId, setMemberId] = useState('');
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    assigneeId: '',
    status: 'TODO',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [resetToken, setResetToken] = useState('');
  const [resetUrl, setResetUrl] = useState('');
  const [liveStatus, setLiveStatus] = useState(null);
  const [liveTaskId, setLiveTaskId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState('');

  const token = session?.accessToken;
  const activeProject = useMemo(
    () => projects.find((project) => project.id === activeProjectId),
    [activeProjectId, projects],
  );
  const visibleAssignees = activeProject?.members || users;
  const assigneeNames = useMemo(() => {
    const people = [...users, ...(activeProject?.members || [])];
    return new Map(people.map((person) => [person.id, person.name]));
  }, [activeProject?.members, users]);
  const liveTask = useMemo(
    () => tasks.find((task) => task.id === liveTaskId),
    [liveTaskId, tasks],
  );

  function authButtonLabel() {
    if (loading && authMode === 'login') {
      return 'Signing in...';
    }

    if (loading && authMode === 'register') {
      return 'Creating account...';
    }

    if (loading && authMode === 'forgot') {
      return 'Preparing reset...';
    }

    if (loading && authMode === 'reset') {
      return 'Resetting password...';
    }

    if (authMode === 'register') {
      return 'Create account';
    }

    if (authMode === 'forgot') {
      return 'Send reset link';
    }

    if (authMode === 'reset') {
      return 'Reset password';
    }

    return 'Sign in';
  }

  function authTitle() {
    if (authMode === 'register') {
      return 'Create account';
    }

    if (authMode === 'forgot') {
      return 'Reset access';
    }

    if (authMode === 'reset') {
      return 'Set new password';
    }

    return 'Welcome back';
  }

  function authCopy() {
    if (authMode === 'register') {
      return 'Join your team workspace as a member.';
    }

    if (authMode === 'forgot') {
      return 'Enter your email to prepare a secure reset token.';
    }

    if (authMode === 'reset') {
      return 'Choose a new password for your account.';
    }

    return 'Sign in to manage projects, tasks, and team status.';
  }

  function switchAuthMode(nextMode) {
    clearNotice();
    setAuthMode(nextMode);
    setShowPassword(false);

    if (nextMode !== 'reset') {
      setResetToken('');
      setResetUrl('');
    }
  }

  function persistSession(nextSession, shouldRemember = true) {
    setSession(nextSession);
    const storage = shouldRemember ? localStorage : sessionStorage;
    const otherStorage = shouldRemember ? sessionStorage : localStorage;

    otherStorage.removeItem('task-manager-session');
    storage.setItem('task-manager-session', JSON.stringify(nextSession));
  }

  function clearSession() {
    localStorage.removeItem('task-manager-session');
    sessionStorage.removeItem('task-manager-session');
    setSession(null);
    setProjects([]);
    setTasks([]);
    setUsers([]);
    setActiveProjectId('');
    setLiveStatus(null);
    setLiveTaskId('');
  }

  function clearNotice() {
    setError('');
    setMessage('');
  }

  async function runAction(action, successMessage, formatError) {
    clearNotice();
    setLoading(true);

    try {
      const result = await action();
      if (successMessage) {
        setMessage(successMessage);
      }
      return result;
    } catch (actionError) {
      if (actionError.status === 401 && session) {
        clearSession();
        setError('Session expired. Please log in again.');
      } else {
        setError(formatError ? formatError(actionError) : actionError.message);
      }
      return null;
    } finally {
      setLoading(false);
    }
  }

  const loadProjects = useCallback(async () => {
    const projectResult = await apiRequest('/projects', { token });
    setProjects(projectResult.data);

    if (!activeProjectId && projectResult.data.length > 0) {
      setActiveProjectId(projectResult.data[0].id);
    }

    if (session?.user.role === 'ADMIN') {
      const userResult = await apiRequest('/users', { token });
      setUsers(userResult.data);
    }
  }, [activeProjectId, session?.user.role, token]);

  const loadTasks = useCallback(async (projectId = activeProjectId) => {
    if (!projectId) {
      setTasks([]);
      setLiveStatus(null);
      setLiveTaskId('');
      return;
    }

    const taskResult = await apiRequest(`/projects/${projectId}/tasks`, { token });
    setTasks(taskResult.data);
    if (taskResult.data.length === 0) {
      setLiveStatus(null);
      setLiveTaskId('');
    } else if (!liveTaskId || !taskResult.data.some((task) => task.id === liveTaskId)) {
      setLiveTaskId(taskResult.data[0].id);
    }
  }, [activeProjectId, liveTaskId, token]);

  useEffect(() => {
    const queryToken = new URLSearchParams(window.location.search).get('token');

    if (queryToken) {
      setResetToken(queryToken);
      setAuthMode('reset');
    }
  }, []);

  useEffect(() => {
    if (!token) {
      return;
    }

    loadProjects().catch((loadError) => {
      if (loadError.status === 401) {
        clearSession();
        setError('Session expired. Please log in again.');
      } else {
        setError(loadError.message);
      }
    });
  }, [loadProjects, token]);

  useEffect(() => {
    if (!token || !activeProjectId) {
      return;
    }

    loadTasks(activeProjectId).catch((loadError) => {
      if (loadError.status === 401) {
        clearSession();
        setError('Session expired. Please log in again.');
      } else {
        setError(loadError.message);
      }
    });
  }, [activeProjectId, loadTasks, token]);

  useEffect(() => {
    if (!token || !liveTaskId) {
      return undefined;
    }

    async function pollStatus() {
      const status = await apiRequest(`/tasks/${liveTaskId}/status`, { token });
      setLiveStatus(status);
    }

    pollStatus().catch((pollError) => {
      if (pollError.status === 401) {
        clearSession();
        setError('Session expired. Please log in again.');
      }
    });
    const intervalId = window.setInterval(() => {
      pollStatus().catch((pollError) => {
        if (pollError.status === 401) {
          clearSession();
          setError('Session expired. Please log in again.');
        }
      });
    }, 15000);

    return () => window.clearInterval(intervalId);
  }, [liveTaskId, token]);

  async function handleAuth(event) {
    event.preventDefault();

    if (authMode === 'forgot') {
      const result = await runAction(
        () => apiRequest('/auth/forgot-password', {
          method: 'POST',
          body: { email: authForm.email },
        }),
        '',
      );

      if (result) {
        setResetToken(result.resetToken || '');
        setResetUrl(result.resetUrl || '');
        setAuthMode('reset');
        setMessage(result.resetToken
          ? 'Reset token prepared. Enter a new password to continue.'
          : result.message);
      }
      return;
    }

    if (authMode === 'reset') {
      const result = await runAction(
        () => apiRequest('/auth/reset-password', {
          method: 'POST',
          body: { token: resetToken, password: authForm.password },
        }),
        '',
      );

      if (result) {
        setAuthMode('login');
        setAuthForm(emptyAuthForm);
        setResetToken('');
        setResetUrl('');
        setMessage(result.message);
      }
      return;
    }

    const path = authMode === 'register' ? '/auth/register' : '/auth/login';
    const body = authMode === 'register'
      ? { name: authForm.name, email: authForm.email, password: authForm.password }
      : { email: authForm.email, password: authForm.password };

    const result = await runAction(
      () => apiRequest(path, { method: 'POST', body }),
      authMode === 'register' ? 'Account created.' : 'Signed in.',
      (authError) => (
        authMode === 'login' && authError.status === 401
          ? 'Incorrect email or password.'
          : authError.message
      ),
    );

    if (result) {
      persistSession(result, rememberMe);
      setAuthForm(emptyAuthForm);
    }
  }

  function handleForgotPassword() {
    switchAuthMode('forgot');
  }

  async function handleLogout() {
    await runAction(async () => {
      if (session?.refreshToken) {
        await apiRequest('/auth/logout', {
          method: 'POST',
          body: { refreshToken: session.refreshToken },
        });
      }
    });

    clearSession();
  }

  async function handleProjectCreate(event) {
    event.preventDefault();

    const project = await runAction(
      () => apiRequest('/projects', {
        method: 'POST',
        token,
        body: projectForm,
      }),
      'Project created.',
    );

    if (project) {
      setProjectForm({ name: '', description: '' });
      setActiveProjectId(project.id);
      await loadProjects();
    }
  }

  async function handleMemberAssign(event) {
    event.preventDefault();

    if (!memberId || !activeProjectId) {
      return;
    }

    const project = await runAction(
      () => apiRequest(`/projects/${activeProjectId}/members`, {
        method: 'POST',
        token,
        body: { userId: memberId },
      }),
      'Member assigned.',
    );

    if (project) {
      setProjects((current) => current.map((item) => (item.id === project.id ? project : item)));
      setMemberId('');
    }
  }

  async function handleTaskCreate(event) {
    event.preventDefault();

    if (!activeProjectId) {
      return;
    }

    const task = await runAction(
      () => apiRequest(`/projects/${activeProjectId}/tasks`, {
        method: 'POST',
        token,
        body: {
          ...taskForm,
          assigneeId: taskForm.assigneeId || null,
        },
      }),
      'Task created.',
    );

    if (task) {
      setTaskForm({ title: '', description: '', assigneeId: '', status: 'TODO' });
      await loadTasks();
    }
  }

  async function updateTaskStatus(taskId, status) {
    setUpdatingTaskId(taskId);
    try {
      const task = await runAction(
        () => apiRequest(`/tasks/${taskId}`, {
          method: 'PUT',
          token,
          body: { status },
        }),
        'Task status updated.',
      );

      if (task) {
        setTasks((current) => current.map((item) => (item.id === task.id ? task : item)));
        setLiveTaskId(task.id);
        const statusResult = await apiRequest(`/tasks/${task.id}/status`, { token });
        setLiveStatus(statusResult);
      }
    } catch (statusError) {
      if (statusError.status === 401) {
        clearSession();
        setError('Session expired. Please log in again.');
      } else {
        setError(statusError.message);
      }
    } finally {
      setUpdatingTaskId('');
    }
  }

  async function deleteTask(taskId) {
    const deleted = await runAction(
      () => apiRequest(`/tasks/${taskId}`, {
        method: 'DELETE',
        token,
      }),
      'Task deleted.',
    );

    if (deleted === null) {
      setTasks((current) => current.filter((task) => task.id !== taskId));
    }
  }

  if (!session) {
    return (
      <main className="auth-page">
        <section className="auth-panel" aria-labelledby="auth-title">
          <div className="brand-mark" aria-hidden="true">TM</div>
          <div>
            <p className="eyebrow">Task Management SaaS</p>
            <h1 id="auth-title">{authTitle()}</h1>
            <p className="auth-copy">{authCopy()}</p>
          </div>

          <form className="stack-form" onSubmit={handleAuth}>
            {authMode === 'register' && (
              <>
                <label htmlFor="name">Name</label>
                <input
                  id="name"
                  autoComplete="name"
                  value={authForm.name}
                  onChange={(event) => setAuthForm({ ...authForm, name: event.target.value })}
                  required
                  minLength={2}
                />

              </>
            )}

            {authMode !== 'reset' && (
              <>
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  value={authForm.email}
                  onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })}
                  required
                />
              </>
            )}

            {authMode === 'reset' && (
              <>
                <label htmlFor="reset-token">Reset token</label>
                <textarea
                  id="reset-token"
                  rows="3"
                  value={resetToken}
                  onChange={(event) => setResetToken(event.target.value)}
                  required
                />
              </>
            )}

            {authMode !== 'forgot' && (
              <>
                <label htmlFor="password">{authMode === 'reset' ? 'New password' : 'Password'}</label>
                <div className="password-field">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                    value={authForm.password}
                    onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })}
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </>
            )}

            {resetUrl && authMode === 'reset' && (
              <div className="dev-reset-panel">
                <span>Development reset link</span>
                <code>{resetUrl}</code>
              </div>
            )}

            {authMode === 'login' && (
              <div className="login-options">
                <label className="checkbox-option" htmlFor="remember-me">
                  <input
                    id="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                  />
                  <span>Remember me</span>
                </label>
                <button type="button" className="link-action" onClick={handleForgotPassword}>
                  Forgot password?
                </button>
              </div>
            )}

            <button className="primary-action" type="submit" disabled={loading}>
              {authButtonLabel()}
            </button>

            {authMode === 'login' && (
              <p className="auth-switch">
                New to Task Manager?
                <button type="button" className="link-action" onClick={() => switchAuthMode('register')}>
                  Create account
                </button>
              </p>
            )}

            {authMode === 'register' && (
              <p className="auth-switch">
                Already have an account?
                <button type="button" className="link-action" onClick={() => switchAuthMode('login')}>
                  Sign in
                </button>
              </p>
            )}

            {(authMode === 'forgot' || authMode === 'reset') && (
              <button type="button" className="link-action centered-link" onClick={() => switchAuthMode('login')}>
                Back to login
              </button>
            )}
          </form>
          <StatusMessage message={message} error={error} />
        </section>
      </main>
    );
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Cloud Task Manager</p>
          <h1>Workspace</h1>
        </div>
        <div className="user-strip">
          <span>{session.user.name}</span>
          <span className="role-pill">{session.user.role}</span>
          <button type="button" className="ghost-action" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <main className="workspace-grid">
        <aside className="side-panel" aria-labelledby="projects-title">
          <div className="section-heading">
            <h2 id="projects-title">Projects</h2>
            <span>{projects.length}</span>
          </div>

          <div className="project-list">
            {projects.length === 0 ? (
              <p className="empty-state">No projects yet.</p>
            ) : (
              projects.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  className={project.id === activeProjectId ? 'project-button active' : 'project-button'}
                  onClick={() => setActiveProjectId(project.id)}
                >
                  <strong>{project.name}</strong>
                  <span>{project.members.length} members</span>
                </button>
              ))
            )}
          </div>

          {session.user.role === 'ADMIN' && (
            <form className="stack-form compact-form" onSubmit={handleProjectCreate}>
              <h3>New project</h3>
              <label htmlFor="project-name">Name</label>
              <input
                id="project-name"
                value={projectForm.name}
                onChange={(event) => setProjectForm({ ...projectForm, name: event.target.value })}
                required
                minLength={2}
              />
              <label htmlFor="project-description">Description</label>
              <textarea
                id="project-description"
                rows="3"
                value={projectForm.description}
                onChange={(event) => setProjectForm({ ...projectForm, description: event.target.value })}
              />
              <button className="primary-action" type="submit" disabled={loading}>Create project</button>
            </form>
          )}
        </aside>

        <section className="work-panel" aria-labelledby="work-title">
          <div className="work-header">
            <div>
              <p className="eyebrow">Active project</p>
              <h2 id="work-title">{activeProject?.name || 'No project selected'}</h2>
              <p>{activeProject?.description || 'Create or select a project to start assigning tasks.'}</p>
            </div>
            {liveStatus && (
              <div className="status-readout" aria-live="polite">
                <span>Live status{liveTask ? `: ${liveTask.title}` : ''}</span>
                <strong>{statusLabels[liveStatus.status]}</strong>
              </div>
            )}
          </div>

          <StatusMessage message={message} error={error} />

          {activeProject && (
            <div className="management-grid">
              <section className="plain-section" aria-labelledby="team-title">
                <div className="section-heading">
                  <h3 id="team-title">Team</h3>
                  <span>{activeProject.members.length}</span>
                </div>
                <ul className="member-list">
                  {activeProject.members.length === 0 ? (
                    <li className="empty-state">No members assigned yet.</li>
                  ) : (
                    activeProject.members.map((member) => (
                      <li key={member.id}>
                        <span>{member.name}</span>
                        <small>{member.role}</small>
                      </li>
                    ))
                  )}
                </ul>

                {session.user.role === 'ADMIN' && users.length > 0 && (
                  <form className="inline-form" onSubmit={handleMemberAssign}>
                    <label htmlFor="member-select">Add member</label>
                    <select
                      id="member-select"
                      value={memberId}
                      onChange={(event) => setMemberId(event.target.value)}
                    >
                      <option value="">Select user</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name} ({user.role})
                        </option>
                      ))}
                    </select>
                    <button type="submit" className="secondary-action" disabled={!memberId || loading}>Add</button>
                  </form>
                )}
              </section>

              {session.user.role === 'ADMIN' && (
                <section className="plain-section" aria-labelledby="new-task-title">
                  <h3 id="new-task-title">New task</h3>
                  <form className="task-form" onSubmit={handleTaskCreate}>
                    <label htmlFor="task-title">Title</label>
                    <input
                      id="task-title"
                      value={taskForm.title}
                      onChange={(event) => setTaskForm({ ...taskForm, title: event.target.value })}
                      required
                      minLength={2}
                    />
                    <label htmlFor="task-description">Description</label>
                    <textarea
                      id="task-description"
                      rows="3"
                      value={taskForm.description}
                      onChange={(event) => setTaskForm({ ...taskForm, description: event.target.value })}
                    />
                    <div className="two-column-fields">
                      <div>
                        <label htmlFor="task-assignee">Assignee</label>
                        <select
                          id="task-assignee"
                          value={taskForm.assigneeId}
                          onChange={(event) => setTaskForm({ ...taskForm, assigneeId: event.target.value })}
                        >
                          <option value="">Unassigned</option>
                          {visibleAssignees.map((user) => (
                            <option key={user.id} value={user.id}>{user.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="task-status">Status</label>
                        <select
                          id="task-status"
                          value={taskForm.status}
                          onChange={(event) => setTaskForm({ ...taskForm, status: event.target.value })}
                        >
                          {Object.entries(statusLabels).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <button className="primary-action" type="submit" disabled={loading}>Create task</button>
                  </form>
                </section>
              )}
            </div>
          )}

          <section className="task-board" aria-labelledby="tasks-title">
            <div className="section-heading">
              <h3 id="tasks-title">Tasks</h3>
              <span>{tasks.length}</span>
            </div>

            <div className="task-list">
              {tasks.length === 0 ? (
                <p className="empty-state">No tasks in this project.</p>
              ) : (
                tasks.map((task) => (
                  <article className="task-item" key={task.id}>
                    <div>
                      <span className={`status-chip ${task.status.toLowerCase()}`}>
                        {statusLabels[task.status]}
                      </span>
                      <h4>{task.title}</h4>
                      <p>{task.description || 'No description'}</p>
                      <p className="task-meta">
                        Assigned to: {task.assigneeId ? assigneeNames.get(task.assigneeId) || 'Unknown member' : 'Unassigned'}
                      </p>
                    </div>
                    <div className="task-actions">
                      <button
                        type="button"
                        className={liveTaskId === task.id ? 'secondary-action active-track' : 'secondary-action'}
                        onClick={() => setLiveTaskId(task.id)}
                      >
                        {liveTaskId === task.id ? 'Tracking' : 'Track live'}
                      </button>
                      <select
                        aria-label={`Status for ${task.title}`}
                        value={task.status}
                        onChange={(event) => updateTaskStatus(task.id, event.target.value)}
                        disabled={updatingTaskId === task.id}
                      >
                        {Object.entries(statusLabels).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                      {session.user.role === 'ADMIN' && (
                        <button type="button" className="danger-action" onClick={() => deleteTask(task.id)}>Delete</button>
                      )}
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}

function StatusMessage({ message, error }) {
  if (!message && !error) {
    return null;
  }

  return (
    <p className={error ? 'notice error' : 'notice'} role={error ? 'alert' : 'status'}>
      {error || message}
    </p>
  );
}

export default App;
