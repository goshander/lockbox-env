const axios = require('axios')

const getToken = async (
  {
    saKeyFile, iamToken, iamEndpoint = 'iam.api.cloud.yandex.net', logger,
  } = { iamEndpoint: 'iam.api.cloud.yandex.net' },
) => {
  const token = process.env.LOCKBOX_ACCESS_TOKEN_CREDENTIALS || iamToken
  if (token) return Promise.resolve(token)

  const keyFile = process.env.LOCKBOX_SERVICE_ACCOUNT_KEY_FILE_CREDENTIALS || saKeyFile
  if (!keyFile) {
    if (logger) logger.error({ msg: 'lockbox-env saKeyFile, iamToken or ENV credentials is empty' })
    return null
  }

  const fs = require('fs')
  const jose = require('node-jose')

  let saKey = fs.readFileSync(process.env.LOCKBOX_SERVICE_ACCOUNT_KEY_FILE_CREDENTIALS)
  saKey = JSON.parse(saKey.toString())

  const key = saKey.private_key

  const serviceAccountId = saKey.service_account_id
  const keyId = saKey.id
  const now = Math.floor(new Date().getTime() / 1000)

  const payload = {
    aud: `https://${iamEndpoint}/iam/v1/tokens`,
    iss: serviceAccountId,
    iat: now,
    exp: now + 3600,
  }

  const jwtSeed = await jose.JWK.asKey(key, 'pem', { kid: keyId, alg: 'PS256' })
  const jwtKey = await jose.JWS.createSign({ format: 'compact' }, jwtSeed).update(JSON.stringify(payload)).final()

  const iamTokenResponse = await axios.post(`https://${iamEndpoint}/iam/v1/tokens`, { jwt: jwtKey })
  if (iamTokenResponse.status !== 200) {
    if (logger) logger.error({ msg: 'lockbox-env error receive iam-token', status: iamTokenResponse.status })
    return null
  }

  return iamTokenResponse.data.iamToken
}

const getSecretPayload = async (
  secretId,
  apiToken,
  { logger, lockboxEndpoint = 'lockbox.api.cloud.yandex.net' } = { lockboxEndpoint: 'lockbox.api.cloud.yandex.net' },
) => {
  const secretResponse = await axios.get(`https://payload.${lockboxEndpoint}/lockbox/v1/secrets/${secretId}/payload`, {
    headers: {
      Authorization: `Bearer ${apiToken}`,
    },
  })
  if (secretResponse.status !== 200) {
    if (logger) logger.warn({ msg: 'lockbox-env value cleared after first time read', status: secretResponse.status })
    return []
  }

  if (secretResponse.data && secretResponse.data.entries) {
    return secretResponse.data.entries
  }

  return []
}

const getSecretIdByPackage = async (
  folderId,
  apiToken,
  { logger, lockboxEndpoint = 'lockbox.api.cloud.yandex.net' } = { lockboxEndpoint: 'lockbox.api.cloud.yandex.net' },
) => {
  const pkgName = 'imap-mail'

  const listResponse = await axios.get(`https://${lockboxEndpoint}/lockbox/v1/secrets?folderId=${folderId}`, {
    headers: {
      Authorization: `Bearer ${apiToken}`,
    },
  })
  if (listResponse.status !== 200) {
    if (logger) logger.warn({ msg: 'lockbox-env get pkg name secret error', status: listResponse.status })
    return null
  }

  return (listResponse.data.secrets.find((secret) => secret.name === pkgName) || {}).id
}

module.exports = { getToken, getSecretPayload, getSecretIdByPackage }
