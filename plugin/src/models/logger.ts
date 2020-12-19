import { Reporter } from "gatsby"
import { formatLogMessage } from "~/utils/format-log-message"
import { IPluginOptions } from "./gatsby-api"

type ITimerReporter = ReturnType<Reporter["activityTimer"]>

export interface ILoggerState {
  entityCount: number
  typeCount: { [name: string]: number }
  activityTimers: {
    [name: string]: { count: number; activity: ITimerReporter }
  }
}

const logger = {
  state: {
    entityCount: 0,
    typeCount: {},
    activityTimers: {},
  } as ILoggerState,

  reducers: {
    incrementActivityTimer(
      state: ILoggerState,
      {
        typeName,
        by,
        action = `fetched`,
      }: { typeName: string; by: number; action: string }
    ): ILoggerState {
      const logger = state.activityTimers[typeName]

      if (!logger) {
        return state
      }

      if (typeof by === `number`) {
        logger.count += by
        state.entityCount += by
      }

      logger.activity.setStatus(`${action} ${logger.count}`)

      return state
    },

    stopActivityTimer(
      state: ILoggerState,
      { typeName, action = `fetched` }: { typeName: string; action: string }
    ): ILoggerState {
      const logger = state.activityTimers[typeName]

      if (logger.count === 0) {
        logger.activity.setStatus(`${action} 0`)
      }

      logger.activity.end()

      return state
    },

    createActivityTimer(
      state: ILoggerState,
      {
        typeName,
        reporter,
        pluginOptions,
      }: { typeName: string; reporter: Reporter; pluginOptions: IPluginOptions }
    ): ILoggerState {
      if (state.activityTimers[typeName]) {
        return state
      }

      const typeActivityTimer = {
        count: 0,
        activity: reporter.activityTimer(
          formatLogMessage(typeName, {
            useVerboseStyle: pluginOptions.verbose,
          })
        ),
      }

      if (pluginOptions.verbose) {
        typeActivityTimer.activity.start()
      }

      state.activityTimers[typeName] = typeActivityTimer

      return state
    },
  },
}

export default logger
