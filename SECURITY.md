# Security Policy

## Supported versions

ResumifyAI is maintained on a single line of development. Security fixes are applied to the latest commit on `main` only.

| Version           | Supported |
|-------------------|-----------|
| `main` (latest) | Yes       |
| Older commits     | No        |

## Reporting a vulnerability

Please **do not** open a public issue for security problems.

Report vulnerabilities privately through GitHub's private vulnerability reporting:

1. Go to the [Security tab](https://github.com/ismailbentabett/ResumifyAI/security) of this repository.
2. Click **Report a vulnerability**.
3. Describe the issue, the affected file(s) and the steps to reproduce it.

If private reporting is unavailable, contact the maintainer through their [GitHub profile](https://github.com/ismailbentabett) and ask for a private channel. Do not post exploit details publicly.

## What to expect

- Acknowledgement of your report as soon as the maintainer is able to review it.
- An assessment of impact and, where confirmed, a fix on `main`.
- Credit in the fix commit or release notes, unless you prefer to remain anonymous.

## Scope

In scope: source code in this repository.
Out of scope: third-party dependencies (report those upstream) and issues that require an already compromised local machine.

Especially relevant for this project: exposure of the OpenAI or Upstash credentials, bypass of the upload size/type checks, path traversal through uploaded file names, and leakage of uploaded resume content.
