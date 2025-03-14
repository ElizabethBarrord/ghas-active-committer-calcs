# Overview

A POC of a tool to process repository data to track and analyze users who are considered active committers for GitHub Advanced Security purposes. It helps organizations monitor their Advanced Security usage and committer counts across repositories.

## Features

- Calculates total Advanced Security committers per organization across an enterprise
- Provides detailed breakdown of an oranization's active committers


### Command Line
```bash
npm start <enterprise-id> <github-token>
```

### Authentication

The tool requires:
- GitHub Enterprise ID
- GitHub Personal Access Token with appropriate permissions to access Advanced Security billing information

### Prerequisites

- Node.js
- TypeScript ^5.8.2

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

### Available Scripts

- `npm start <enterprise-id> <github-token>` - Run the tool with your Enterprise ID and GitHub token
- `npm test` - Run Jest tests
