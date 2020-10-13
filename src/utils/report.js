/**
 * First draft for error code categories and values.
 * Very much up for discussion.
 */
export const CODES = {
  WordPressFilters: 2,
  BadUrl: 3,
  CustomUserCode: 4,
  Permissions: 5,
  Authentication: 6,
  Timeout: 7,
};

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
};

export function structuredReporter(reporter) {
  if (!reporter.setErrorMap) {
    return reporter;
  }

  /**
   * Use a higher order function to create a wrapper
   * around reporter methods. Alternively we could use
   * an ES6 proxy.
   */
  function structuredReport(method) {
    return function report(message, code) {
      reporter[method]({
        id: code,
        context: {
          message,
        },
      });
    };
  }

  return {
    panic: structuredReport("panic"),
    error: structuredReport("error"),
    warn: reporter.warn,
    log: reporter.log,
  };
}
