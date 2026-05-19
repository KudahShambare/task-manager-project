# Deliverable 3: Frontend Implementation

## Q7. Responsive Web Frontend

The frontend is implemented as a React single-page application in `frontend/cloud-task-manager`. It consumes the Express REST API asynchronously through the Fetch API helper in `src/api.js`.

### Requirement Mapping

| Requirement | Implementation |
| --- | --- |
| HTML5 semantic structure | The UI uses semantic landmarks and content elements including `main`, `header`, `aside`, `section`, `article`, `form`, `label`, and accessible headings. |
| CSS3 layout | The dashboard uses CSS Grid for the main workspace and management panels, and Flexbox for topbar, user controls, task actions, and member rows. |
| Responsive design | Media queries at `900px` and `560px` collapse the sidebar, management grid, and task actions into single-column mobile layouts. |
| WCAG 2.1 AA accessibility | Form controls have linked labels, status messages use `role="status"` or `role="alert"`, live task status uses `aria-live="polite"`, keyboard focus states are visible, and colour contrast is designed around the blue/indigo login palette. |
| JavaScript async REST consumption | `apiRequest()` uses `fetch()` with JSON request bodies, Bearer token headers, async/await, and error handling. Login, register, project CRUD, member assignment, task creation, task updates, deletion, and status polling all call the REST API asynchronously. |

### Files

- Main app: `frontend/cloud-task-manager/src/App.jsx`
- Styling: `frontend/cloud-task-manager/src/App.css`
- API helper: `frontend/cloud-task-manager/src/api.js`
- Environment example: `frontend/cloud-task-manager/.env.example`

### Verification Commands

```bash
cd frontend/cloud-task-manager
npm.cmd run lint
npm.cmd run build
```

### Lighthouse Accessibility Verification

Lighthouse was run against the local frontend on May 14, 2026 with the Accessibility category enabled.

Result: **95/100 Accessibility**

Generated evidence files:

- `docs/lighthouse-accessibility.json`
- `docs/lighthouse-accessibility.html`

To rerun the audit manually, start the frontend and test it in Chrome Lighthouse:

```bash
cd frontend/cloud-task-manager
npm.cmd run dev
```

Open `http://localhost:5173`, then in Chrome DevTools run Lighthouse with the **Accessibility** category selected. Save or screenshot the score for submission evidence.
