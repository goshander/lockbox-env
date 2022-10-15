const { getToken, getSecretPayload, getSecretIdByPackage } = require('./lib')

const load = async ({
  secrets,
  saKeyFile,
  iamToken,
  logger,
  iamEndpoint,
  lockboxEndpoint,
} = { }) => {
  const secretList = (typeof secrets === 'string' || secrets instanceof String) ? [secrets] : secrets

  if (logger == null) {
    const pino = require('pino')

    logger = pino({
      level: 'info',
      formatters: {
        // eslint-disable-next-line no-unused-vars
        level(label, number) {
          return { level: label }
        },
      },
    })
  }

  const apiToken = await getToken({ iamToken, saKeyFile, iamEndpoint })

  const result = {}

  for (let i = 0; i < secretList.length; i += 1) {
    const entries = await getSecretPayload(secretList[i], apiToken, { logger, lockboxEndpoint })

    entries.forEach((entry) => {
      if (entry.textValue) {
        result[entry.key] = entry.textValue
      }
    })
  }

  return result
}

const config = async ({
  secrets,
  saKeyFile,
  iamToken,
  envPrefix = false,
  oneTimeRead = false,
  logger,
  iamEndpoint,
  lockboxEndpoint,
  folderId,
} = { }) => {
  let secretList = (typeof secrets === 'string' || secrets instanceof String) ? [secrets] : secrets

  if (logger == null) {
    const pino = require('pino')

    logger = pino({
      level: 'info',
      formatters: {
        // eslint-disable-next-line no-unused-vars
        level(label, number) {
          return { level: label }
        },
      },
    })
  }

  const apiToken = await getToken({ iamToken, saKeyFile, iamEndpoint })
  if (folderId != null && (secretList == null || secretList.length < 1 || secretList[0] == null)) {
    const secretId = await getSecretIdByPackage(folderId, apiToken, {
      logger, lockboxEndpoint,
    })
    secretList = [secretId]
  }

  for (let i = 0; i < secretList.length; i += 1) {
    const entries = await getSecretPayload(secretList[i], apiToken, { logger, lockboxEndpoint })

    entries.forEach((entry) => {
      if (entry.textValue) {
        let textValue = entry.textValue

        Object.defineProperty(process.env, `${envPrefix || ''}${envPrefix ? '_' : ''}${entry.key}`, {
          get() {
            const v = textValue
            if (oneTimeRead) {
              textValue = undefined
              if (!v) logger.warn({ msg: 'lockbox-env value cleared after first time read' })
            }
            return v
          },
        })
      }
    })
  }
}

const configSync = ({
  secrets,
  saKeyFile,
  iamToken,
  envPrefix = false,
  oneTimeRead = false,
  logger,
  iamEndpoint,
  lockboxEndpoint,
  folderId,
} = { }) => {
  const sp = require('synchronized-promise')

  const sync = sp(config)

  return sync({
    secrets,
    saKeyFile,
    iamToken,
    envPrefix,
    oneTimeRead,
    logger,
    iamEndpoint,
    lockboxEndpoint,
    folderId,
  })
}

module.exports = {
  config, configSync, load,
}
