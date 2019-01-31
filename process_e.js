var CronJob = require('cron').CronJob;
const shell = require('shelljs');

new CronJob('0 */1 * * *', function() {
  console.log('lets restart the email bot process');
  shell.exec('~/emailBot/restart_emailBot.sh')
}, null, true, 'America/Los_Angeles');
