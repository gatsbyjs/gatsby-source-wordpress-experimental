import { CODES } from "../utils/report";

export function setErrorMap({ reporter }) {
  if (reporter.setErrorMap) {
    reporter.setErrorMap({
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
      [CODES.UnknownError]: {
        text: (context) => context.message,
        level: "ERROR",
        category: "THIRD_PARTY",
      },
    });
  }
}
