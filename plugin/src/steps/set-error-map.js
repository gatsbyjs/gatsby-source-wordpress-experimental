import { ERROR_MAP } from "../utils/report"

export function setErrorMap({ reporter }) {
  if (reporter.setErrorMap) {
    reporter.setErrorMap(ERROR_MAP)
  }
}
