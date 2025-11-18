export class RoundNotActiveError extends Error {
  constructor(message = 'Round is not currently active') {
    super(message);
    this.name = 'RoundNotActiveError';
  }
}


