## Table `admins`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `user_id` | `uuid` | Primary |
| `employee_id` | `text` |  Nullable Unique |
| `department` | `text` |  Nullable |
| `created_at` | `timestamptz` |  |
| `updated_at` | `timestamptz` |  |

## Table `members`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `user_id` | `uuid` | Primary |
| `student_id` | `text` |  Nullable Unique |
| `enrollment_date` | `date` |  Nullable |
| `created_at` | `timestamptz` |  |
| `updated_at` | `timestamptz` |  |

## Table `profiles`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `email` | `text` |  Unique |
| `full_name` | `text` |  Nullable |
| `avatar_url` | `text` |  Nullable |
| `created_at` | `timestamptz` |  |
| `updated_at` | `timestamptz` |  |

## Table `project_members`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `project_id` | `uuid` | Primary |
| `member_id` | `uuid` | Primary |
| `role` | `project_role` |  |
| `created_at` | `timestamptz` |  |

## Table `projects`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `name` | `text` |  |
| `description` | `text` |  |
| `start_date` | `date` |  |
| `deadline` | `date` |  |
| `max_members` | `int4` |  |
| `status` | `project_status` |  |
| `created_by` | `uuid` |  |
| `created_at` | `timestamptz` |  |
| `updated_at` | `timestamptz` |  |

## Table `tasks`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `project_id` | `uuid` |  |
| `title` | `text` |  |
| `description` | `text` |  |
| `status` | `task_status` |  |
| `assignee_member_id` | `uuid` |  Nullable |
| `created_by` | `uuid` |  |
| `created_at` | `timestamptz` |  |
| `updated_at` | `timestamptz` |  |

