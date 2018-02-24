const { CLIEngine } = require('eslint');

const jsFileFilter = ({ filename }) => filename.match(/.*(.js|.jsx)$/);

// refer to https://github.com/Bernardstanislas/eslint-bot
const getCommentPositionMap = (patchString) => {
  let commentPosition = 0;
  let fileLinePosition = 0;
  return patchString.split('\n').reduce((prev, line) => {
    commentPosition += 1;
    if (line.match(/^@@(.*)@@/)) {
      fileLinePosition = line.match(/\+[0-9]+/)[0].replace('+', '') - 1;
      commentPosition -= 1; // can not comment on lines with '@@ -, + @@'.
    } else if (!line.startsWith('-')) {
      fileLinePosition += 1;
      if (line.startsWith('+')) {
        prev[fileLinePosition] = commentPosition; // eslint-disable-line
      }
    }
    return prev;
  }, {});
};

const lint = async (context) => {
  const eslint = new CLIEngine();

  const { pull_request: pullRequest, repository } = context.payload;
  const { base, head, number } = pullRequest;
  const [owner, repo] = repository.full_name.split('/');

  const compare = await context.github.repos.compareCommits(context.repo({
    base: base.sha,
    head: head.sha,
  }));

  const { files } = compare.data;

  const data = await Promise.all(files.filter(jsFileFilter).map(async (file) => {
    const { data: { content } } = await context.github.repos.getContent({
      owner,
      repo,
      path: file.filename,
      ref: head.sha
    });
    const decodedContent = Buffer.from(content, 'base64');

    return {
      filename: file.filename,
      lineMap: getCommentPositionMap(file.patch),
      content: decodedContent.toString(),
    };
  }));

  const comments = [];
  data.forEach((data) => {
    const { results: [result] } = eslint.executeOnText(data.content, data.filename);
    const eslintErrors = result.messages;
    comments.push(...eslintErrors.filter(error => data.lineMap[error.line]).map(error => ({
      path: data.filename,
      position: data.lineMap[error.line],
      body: `**${error.ruleId}**: ${error.message}`,
    })));
  });

  if (comments.length > 0) {
    await context.github.pullRequests.createReview({
      owner,
      repo,
      number,
      comments,
      event: 'REQUEST_CHANGES',
      body: 'ESLint found some errors. Please fix them and try committing again.',
    });
  }
};

module.exports = (robot) => {
  robot.on('pull_request.opened', lint);
  robot.on('pull_request.synchronize', lint);
};
