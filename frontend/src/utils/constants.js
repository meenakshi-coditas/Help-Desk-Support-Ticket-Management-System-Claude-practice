// Values come from requirement.md (statuses, priorities, roles) and are shared by UI and mock API.
export const ROLES = { USER: 'USER', AGENT: 'AGENT' };

export const STATUSES = ['Open', 'Assigned', 'In Progress', 'Resolved', 'Closed'];
export const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

// Provisional limits (requirement.md section 13, OQ-01 / OQ-02 / OQ-11) – confirm with the client.
export const LIMITS = {
  subjectMax: 150,
  descriptionMin: 10,
  descriptionMax: 5000,
  commentMax: 2000,
  attachmentMaxBytes: 5 * 1024 * 1024,
  attachmentTypes: ['image/png', 'image/jpeg', 'application/pdf', 'text/plain'],
  attachmentExtensions: 'png, jpg, jpeg, pdf, txt',
  pageSize: 10,
  recentTickets: 5,
};

export const SORT_OPTIONS = [
  { value: 'createdAt:desc', label: 'Newest first' },
  { value: 'createdAt:asc', label: 'Oldest first' },
  { value: 'priority:desc', label: 'Priority: high to low' },
  { value: 'priority:asc', label: 'Priority: low to high' },
  { value: 'status:asc', label: 'Status' },
];
