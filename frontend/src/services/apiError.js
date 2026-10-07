// Error shape matches the provisional error contract in requirement.md section 14.
export class ApiError extends Error {
  constructor(status, message, details = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export const wait = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));
