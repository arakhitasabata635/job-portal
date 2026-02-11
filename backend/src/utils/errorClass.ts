export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    Error.captureStackTrace(this, this.constructor); //it hide the unnecessary line of error it directlly start the actual error cause file help to debug
  }
}
