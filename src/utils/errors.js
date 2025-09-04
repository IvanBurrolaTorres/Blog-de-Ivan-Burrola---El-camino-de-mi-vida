
export class ValidationError extends Error {
  constructor(details) {
    super('Validation failed');
    this.details = details;
    this.status = 400;
  }
}

export class NotFoundError extends Error {
  constructor(message = 'Not found') {
    super(message);
    this.status = 404;
  }
}
