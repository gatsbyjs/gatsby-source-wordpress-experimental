import { runPreviewSwarm } from "../../../../cli/build/utils/wordpress-puppeteer/run-preview-swarm"
import users from "./users"

test(`A Preview swarm returns 0 failures when testing with 1 user making 1 preview`, async () => {
  const config = {
    headless: true,
    cliOutput: false,
    maxPreviewsEach: 1,
    users,
    previewTimeout: 60000,
    wpUrl: `http://localhost:8001`,
    gatsbyPreviewFrontendUrl: `http://host.docker.internal:8000,http://localhost:8000`,
    gatsbyPreviewRefreshEndpoint: `http://host.docker.internal:8000/__refresh`,
  }

  const result = await runPreviewSwarm(config)

  expect(result).toBeTruthy()
  expect(result.failures).toBe(0)
  expect(result.successes).toBe(1)
  expect(result.userCount).toBe(config.users.length)
  expect(result.totalPreviews).toBe(
    config.users.length * config.maxPreviewsEach
  )
})