export class baseError extends Error {
  constructor(e?: string) {
    super(e);
    this.name = new.target.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class buildError extends baseError {
  constructor(e?: string) {
    super(e)
  }
}

export class scanError extends baseError {
  constructor(e?: string) {
    super(e)
  }
}

export class pushError extends baseError {
  constructor(e?: string) {
    super(e)
  }
}
