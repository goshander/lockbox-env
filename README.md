# lockbox-env

---

Yandex Cloud Lockbox service one line config library

With this library you can load all Lockbox secrets directly to environment variables in runtime

### Use

You need invoke `config` function from main project endpoint

```javascript
require('lockbox-env').config({
    secrets: '', // string or array of string secret id for load, also can be specify by env variable (see below)
    saKeyFile: 'sa.json', // optional, service account json key file path, also can be specify by env variable (see below)
    iamToken: 'f1-T2dl94mf8sy5j...', // optional, also can be specify by env variable (see below)
    envPrefix: 'LOCKBOX', // optional, prefix for environment variables that loaded from secrets
    oneTimeRead: true, // optional, enable getter that clean variable from `process.env` after first read
    logger: pino(), // optional, override default library logger
    iamEndpoint, // optional, override Yandex Cloud IAM api endpoint
    lockboxEndpoint, // optional, override Yandex Cloud Lockbox api endpoint
    /* WIP */ folderId: '', // optional, Yandex Cloud project folder-id for auto load secrets by main project name, also can be specify by env variable (see below)
}) // return promise

// also you can use sync version
require('lockbox-env').configSync(...)
```

### Environment variable

| variable                                       | description                                                              |
| ---------------------------------------------- | ------------------------------------------------------------------------ |
| `LOCKBOX_SERVICE_ACCOUNT_KEY_FILE_CREDENTIALS` | specify `.json` service account key file for auth                        |
| `LOCKBOX_ACCESS_TOKEN_CREDENTIALS`             | specify `iam`-token directly (ex: from cloud function) for auth          |
| `LOCKBOX_SECRET_ID`                            | lockbox cloud secret-id for auto load secrets directly by secret-id      |
| `LOCKBOX_FOLDER_ID`                            | *WIP* lockbox cloud folder-id for auto load secrets by main package name |

---
\#lockbox \#env \#secret \#security \#credential
