export class InvalidCredentialsError extends Error {
  constructor(message = 'Invalid username or password') {
    super(message);
    this.name = 'InvalidCredentialsError';
  }
}

export class AuthenticationRequiredError extends Error {
  constructor(message = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationRequiredError';
  }
}


