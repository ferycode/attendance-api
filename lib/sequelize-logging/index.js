const { highlight } = require('cli-highlight');
const chalk = require('chalk');

module.exports.colorizeQuery = (...args) => {
  const theme = {
      keyword: chalk.red.bold,
      addition: chalk.green,
      deletion: chalk.red.strikethrough,
      string: chalk.green,
      number: chalk.blue.bold
  };

  const [text, benchTime] = args;

  let query = highlight(`${text} ${benchTime}ms`, {
    language: 'sql', 
    ignoreIllegals: true,
    theme
  });
  
  // eslint-disable-next-line no-console
  console.log(`${query} \n`);
};