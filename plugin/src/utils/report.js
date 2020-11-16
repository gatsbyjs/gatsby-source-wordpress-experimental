export const CODES = {
  /* Fetch errors */
  WordPressFilters: `111001`,
  BadResponse: `111002`,
  RequestDenied: `111004`,
  Authentication: `111005`,
  Timeout: `111006`,

  /* GraphQL Errors */
  RemoteGraphQLError: `112001`,
  MissingAppendedPath: `112002`,
}

export const ERROR_MAP = {
  [CODES.WordPressFilters]: {
    text: (context) => context.sourceMessage,
    level: `ERROR`,
    category: `USER`,
  },
  [CODES.BadResponse]: {
    text: (context) => context.sourceMessage,
    level: `ERROR`,
    category: `USER`,
  },
  [CODES.RequestDenied]: {
    text: (context) => context.sourceMessage,
    level: `ERROR`,
    category: `USER`,
  },
  [CODES.Authentication]: {
    text: (context) => context.sourceMessage,
    level: `ERROR`,
    category: `USER`,
  },
  [CODES.Timeout]: {
    text: (context) => context.sourceMessage,
    level: `ERROR`,
    category: `USER`,
  },
  [CODES.RemoteGraphQLError]: {
    text: (context) => context.sourceMessage,
    level: `ERROR`,
    category: `THIRD_PARTY`,
  },
  [CODES.MissingAppendedPath]: {
    text: (context) => context.sourceMessage,
    level: `ERROR`,
    category: `THIRD_PARTY`,
  },
}
