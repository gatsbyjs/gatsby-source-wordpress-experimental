export const CODES = {
  /* Fetch errors */
  WordPressFilters: 111001,
  BadUrl: 111002,
  CustomUserCode: 111003,
  Permissions: 111004,
  Authentication: 111005,
  Timeout: 111006,

  /* GraphQL Errors */
  GQLConfiguration: 112001,
}

export const ERROR_MAP = {
  [CODES.WordPressFilters]: {
    text: (context) => context.message,
    level: "ERROR",
    category: "USER",
  },
  [CODES.BadUrl]: {
    text: (context) => context.message,
    level: "ERROR",
    category: "USER",
  },
  [CODES.CustomUserCode]: {
    text: (context) => context.message,
    level: "ERROR",
    category: "USER",
  },
  [CODES.Permissions]: {
    text: (context) => context.message,
    level: "ERROR",
    category: "USER",
  },
  [CODES.Authentication]: {
    text: (context) => context.message,
    level: "ERROR",
    category: "USER",
  },
  [CODES.Timeout]: {
    text: (context) => context.message,
    level: "ERROR",
    category: "USER",
  },
  [CODES.GQLConfiguration]: {
    text: (context) => context.message,
    level: "ERROR",
    category: "USER",
  },
}

export function makeStructuredReporter(reporter) {
  if (!reporter.setErrorMap) {
    return reporter
  }

  /**
   * Use a higher order function to create a wrapper
   * around reporter methods. Alternively we could use
   * an ES6 proxy.
   */
  function makeStructuredReport(method) {
    return function report(message, code) {
      reporter[method]({
        id: code.toString(),
        context: {
          message,
        },
      })
    }
  }

  return {
    panic: makeStructuredReport("panic"),
    error: makeStructuredReport("error"),
    warn: reporter.warn,
    log: reporter.log,
  }
}
