const crypto = require('crypto');

function now() {
  return new Date().toISOString();
}

function copy(value) {
  if (value === undefined || value === null) {
    return null;
  }

  return JSON.parse(JSON.stringify(value));
}

function createMemoryStore() {
  const state = {
    users: new Map(),
    refreshTokens: new Map(),
    projects: new Map(),
    projectMembers: new Map(),
    tasks: new Map(),
  };

  function hydrateProject(project) {
    const members = state.projectMembers.get(project.id) || new Set();

    return {
      ...copy(project),
      members: [...members]
        .map((userId) => state.users.get(userId))
        .filter(Boolean)
        .map((user) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        })),
    };
  }

  return {
    async createUser(input) {
      const user = {
        id: crypto.randomUUID(),
        name: input.name,
        email: input.email,
        role: input.role,
        passwordHash: input.passwordHash,
        createdAt: now(),
      };

      state.users.set(user.id, user);
      return copy(user);
    },

    async findUserByEmail(email) {
      return copy([...state.users.values()].find((user) => user.email.toLowerCase() === email.toLowerCase()));
    },

    async findUserById(id) {
      return copy(state.users.get(id));
    },

    async listUsers() {
      return [...state.users.values()]
        .sort((a, b) => a.name.localeCompare(b.name) || a.email.localeCompare(b.email))
        .map(copy);
    },

    async saveRefreshToken(input) {
      state.refreshTokens.set(input.tokenHash, {
        id: input.id,
        userId: input.userId,
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt,
        revokedAt: null,
      });
    },

    async findRefreshTokenByHash(hash) {
      const token = state.refreshTokens.get(hash);

      if (!token || token.revokedAt || new Date(token.expiresAt) <= new Date()) {
        return null;
      }

      return copy(token);
    },

    async revokeRefreshToken(hash) {
      const token = state.refreshTokens.get(hash);
      if (token) {
        token.revokedAt = now();
      }
    },

    async createProject(input) {
      const project = {
        id: crypto.randomUUID(),
        name: input.name,
        description: input.description,
        createdBy: input.createdBy,
        createdAt: now(),
        updatedAt: now(),
      };

      state.projects.set(project.id, project);
      state.projectMembers.set(project.id, new Set());
      return hydrateProject(project);
    },

    async listProjects() {
      return [...state.projects.values()]
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .map(hydrateProject);
    },

    async listProjectsForUser(userId) {
      return [...state.projects.values()]
        .filter((project) => state.projectMembers.get(project.id)?.has(userId))
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .map(hydrateProject);
    },

    async findProjectById(id) {
      const project = state.projects.get(id);
      return project ? hydrateProject(project) : null;
    },

    async updateProject(id, input) {
      const project = state.projects.get(id);

      if (!project) {
        return null;
      }

      if (input.name !== undefined) {
        project.name = input.name;
      }

      if (input.description !== undefined) {
        project.description = input.description;
      }

      project.updatedAt = now();
      return hydrateProject(project);
    },

    async deleteProject(id) {
      state.projects.delete(id);
      state.projectMembers.delete(id);

      for (const [taskId, task] of state.tasks.entries()) {
        if (task.projectId === id) {
          state.tasks.delete(taskId);
        }
      }
    },

    async addProjectMember(projectId, userId) {
      if (!state.projectMembers.has(projectId)) {
        state.projectMembers.set(projectId, new Set());
      }

      state.projectMembers.get(projectId).add(userId);
    },

    async removeProjectMember(projectId, userId) {
      state.projectMembers.get(projectId)?.delete(userId);
    },

    async createTask(input) {
      const task = {
        id: crypto.randomUUID(),
        projectId: input.projectId,
        title: input.title,
        description: input.description,
        status: input.status,
        assigneeId: input.assigneeId,
        createdBy: input.createdBy,
        createdAt: now(),
        updatedAt: now(),
      };

      state.tasks.set(task.id, task);
      return copy(task);
    },

    async listTasksByProject(projectId) {
      return [...state.tasks.values()]
        .filter((task) => task.projectId === projectId)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .map(copy);
    },

    async findTaskById(id) {
      return copy(state.tasks.get(id));
    },

    async updateTask(id, input) {
      const task = state.tasks.get(id);

      if (!task) {
        return null;
      }

      for (const key of ['title', 'description', 'status', 'assigneeId']) {
        if (input[key] !== undefined) {
          task[key] = input[key];
        }
      }

      task.updatedAt = now();
      return copy(task);
    },

    async deleteTask(id) {
      state.tasks.delete(id);
    },

    _state: state,
  };
}

module.exports = {
  createMemoryStore,
};
