function mapUser(row) {
  return row && {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    passwordHash: row.password_hash,
    createdAt: row.created_at,
  };
}

function mapProject(row) {
  return row && {
    id: row.id,
    name: row.name,
    description: row.description,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    members: row.members || [],
  };
}

function mapTask(row) {
  return row && {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    description: row.description,
    status: row.status,
    assigneeId: row.assignee_id,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function buildUpdate(input, allowedColumns) {
  const assignments = [];
  const values = [];

  for (const [key, column] of Object.entries(allowedColumns)) {
    if (input[key] !== undefined) {
      values.push(input[key]);
      assignments.push(`${column} = $${values.length}`);
    }
  }

  return { assignments, values };
}

function createPostgresStore(pool) {
  async function projectById(id) {
    const result = await pool.query(
      `
        SELECT p.*,
          COALESCE(
            json_agg(
              json_build_object('id', u.id, 'name', u.name, 'email', u.email, 'role', u.role)
              ORDER BY u.name
            ) FILTER (WHERE u.id IS NOT NULL),
            '[]'
          ) AS members
        FROM projects p
        LEFT JOIN project_members pm ON pm.project_id = p.id
        LEFT JOIN app_users u ON u.id = pm.user_id
        WHERE p.id = $1
        GROUP BY p.id
      `,
      [id],
    );

    return mapProject(result.rows[0]);
  }

  return {
    async createUser(input) {
      const result = await pool.query(
        `
          INSERT INTO app_users (name, email, role, password_hash)
          VALUES ($1, $2, $3, $4)
          RETURNING *
        `,
        [input.name, input.email, input.role, input.passwordHash],
      );

      return mapUser(result.rows[0]);
    },

    async findUserByEmail(email) {
      const result = await pool.query(
        'SELECT * FROM app_users WHERE lower(email) = lower($1)',
        [email],
      );
      return mapUser(result.rows[0]);
    },

    async findUserById(id) {
      const result = await pool.query('SELECT * FROM app_users WHERE id = $1', [id]);
      return mapUser(result.rows[0]);
    },

    async listUsers() {
      const result = await pool.query(
        'SELECT * FROM app_users ORDER BY name ASC, email ASC',
      );
      return result.rows.map(mapUser);
    },

    async saveRefreshToken(input) {
      await pool.query(
        `
          INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at)
          VALUES ($1, $2, $3, $4)
        `,
        [input.id, input.userId, input.tokenHash, input.expiresAt],
      );
    },

    async findRefreshTokenByHash(hash) {
      const result = await pool.query(
        `
          SELECT id, user_id, token_hash, expires_at, revoked_at
          FROM refresh_tokens
          WHERE token_hash = $1 AND revoked_at IS NULL AND expires_at > NOW()
        `,
        [hash],
      );

      const row = result.rows[0];
      return row && {
        id: row.id,
        userId: row.user_id,
        tokenHash: row.token_hash,
        expiresAt: row.expires_at,
        revokedAt: row.revoked_at,
      };
    },

    async revokeRefreshToken(hash) {
      await pool.query(
        'UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1 AND revoked_at IS NULL',
        [hash],
      );
    },

    async revokeRefreshTokensForUser(userId) {
      await pool.query(
        'UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL',
        [userId],
      );
    },

    async savePasswordResetToken(input) {
      await pool.query(
        `
          INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at)
          VALUES ($1, $2, $3, $4)
        `,
        [input.id, input.userId, input.tokenHash, input.expiresAt],
      );
    },

    async findPasswordResetTokenByHash(hash) {
      const result = await pool.query(
        `
          SELECT id, user_id, token_hash, expires_at, used_at
          FROM password_reset_tokens
          WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW()
        `,
        [hash],
      );

      const row = result.rows[0];
      return row && {
        id: row.id,
        userId: row.user_id,
        tokenHash: row.token_hash,
        expiresAt: row.expires_at,
        usedAt: row.used_at,
      };
    },

    async markPasswordResetTokenUsed(hash) {
      await pool.query(
        'UPDATE password_reset_tokens SET used_at = NOW() WHERE token_hash = $1 AND used_at IS NULL',
        [hash],
      );
    },

    async updateUserPassword(userId, passwordHash) {
      const result = await pool.query(
        'UPDATE app_users SET password_hash = $1 WHERE id = $2 RETURNING *',
        [passwordHash, userId],
      );
      return mapUser(result.rows[0]);
    },

    async createProject(input) {
      const result = await pool.query(
        `
          INSERT INTO projects (name, description, created_by)
          VALUES ($1, $2, $3)
          RETURNING *
        `,
        [input.name, input.description, input.createdBy],
      );

      return mapProject({ ...result.rows[0], members: [] });
    },

    async listProjects() {
      const result = await pool.query('SELECT id FROM projects ORDER BY updated_at DESC');
      return Promise.all(result.rows.map((row) => projectById(row.id)));
    },

    async listProjectsForUser(userId) {
      const result = await pool.query(
        `
          SELECT p.id
          FROM projects p
          JOIN project_members pm ON pm.project_id = p.id
          WHERE pm.user_id = $1
          ORDER BY p.updated_at DESC
        `,
        [userId],
      );
      return Promise.all(result.rows.map((row) => projectById(row.id)));
    },

    findProjectById: projectById,

    async updateProject(id, input) {
      const { assignments, values } = buildUpdate(input, {
        name: 'name',
        description: 'description',
      });

      if (assignments.length > 0) {
        values.push(id);
        await pool.query(
          `
            UPDATE projects
            SET ${assignments.join(', ')}, updated_at = NOW()
            WHERE id = $${values.length}
          `,
          values,
        );
      }

      return projectById(id);
    },

    async deleteProject(id) {
      await pool.query('DELETE FROM projects WHERE id = $1', [id]);
    },

    async addProjectMember(projectId, userId) {
      await pool.query(
        `
          INSERT INTO project_members (project_id, user_id)
          VALUES ($1, $2)
          ON CONFLICT DO NOTHING
        `,
        [projectId, userId],
      );
    },

    async removeProjectMember(projectId, userId) {
      await pool.query(
        'DELETE FROM project_members WHERE project_id = $1 AND user_id = $2',
        [projectId, userId],
      );
    },

    async createTask(input) {
      const result = await pool.query(
        `
          INSERT INTO tasks (project_id, title, description, status, assignee_id, created_by)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *
        `,
        [
          input.projectId,
          input.title,
          input.description,
          input.status,
          input.assigneeId,
          input.createdBy,
        ],
      );

      return mapTask(result.rows[0]);
    },

    async listTasksByProject(projectId) {
      const result = await pool.query(
        'SELECT * FROM tasks WHERE project_id = $1 ORDER BY updated_at DESC',
        [projectId],
      );
      return result.rows.map(mapTask);
    },

    async findTaskById(id) {
      const result = await pool.query('SELECT * FROM tasks WHERE id = $1', [id]);
      return mapTask(result.rows[0]);
    },

    async updateTask(id, input) {
      const { assignments, values } = buildUpdate(input, {
        title: 'title',
        description: 'description',
        status: 'status',
        assigneeId: 'assignee_id',
      });

      if (assignments.length > 0) {
        values.push(id);
        await pool.query(
          `
            UPDATE tasks
            SET ${assignments.join(', ')}, updated_at = NOW()
            WHERE id = $${values.length}
          `,
          values,
        );
      }

      return this.findTaskById(id);
    },

    async deleteTask(id) {
      await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
    },
  };
}

module.exports = {
  createPostgresStore,
};
