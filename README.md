# probot-eslint-bot

An automated js code **es**linting bot that integrates with GitHub pull requests.

## Installation

1. eslint-bot을 생성 후 deploy합니다.
   - App 생성 시 권한은 PR Read & Write, Commit statuses Read & Write, and Repository contents Read & Write가 필요합니다.
   - App 생성 시 구독할 이벤트는 Pull request, Pull request Review, Pull request review comment, and Commit comment가 필요합니다.

설정 후 배포하는 경우, zeit now를 통해 배포하는 것이 가장 간편합니다.

- `GitHub App ID`: the ID of the app, which you can get from the [app settings page](https://github.com/settings/apps).
- `GitHub App Secret`: the Webhook secret (optional) of the app, which you can get from the [app settings page](https://github.com/settings/apps).
- `Base64 encoded private key`: Encoded .pem key (`cat private-key.pem | base64`).

```bash
$ now secrets add app-id {GitHub App ID}
$ now secrets add private-key {Base64 encoded private key}
$ now secrets add webhook-secret {GitHub App Secret}
$ now
```

2. 배포 후 서버 URL를 Github App의 webhook url에 등록합니다.
3. Github org나 user에 Github App을 Install합니다. 설치와 동시에 봇을 연동할 repository를 지정합니다.
