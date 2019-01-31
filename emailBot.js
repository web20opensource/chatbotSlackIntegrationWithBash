/* *****************************************************************************
Copyright 2018 Mario Ruiz

http://www.apache.org/licenses/LICENSE-2.0

Based on an example from 
https://codelabs.developers.google.com/codelabs/cloud-slack-bot/index.html?index=..%2F..index#14
********************************************************************************

This is a sample Slack bot built with Botkit.
*/

var expressions = {
  'done': ':+1:',
  'pending' : ':timer_clock:',
  'email' : ':email:',
  'failed' : ':-1:'
};

//if local
//var pathToWhitelistFile = "/home/web2_0opensource/phpdevdeploy/data extensions/MGO_Whitelist.csv";

const { exec } = require('child_process');


var Botkit = require('botkit');
var validator = require("email-validator");
var fs = require('fs') // NEW: Add this require (for loading from files).

var controller = Botkit.slackbot({debug: true})


// START: Load Slack token from file.
if (!process.env.slack_token_path) {
  console.log('Error: Specify slack_token_path in environment')
  process.exit(1)
}

fs.readFile(process.env.slack_token_path, function (err, data) {
  if (err) {
    console.log('Error: Specify token in slack_token_path file')
    process.exit(1)
  }
  data = String(data)
  data = data.replace(/\s/g, '')
  controller
    .spawn({token: data})
    .startRTM(function (err) {
      if (err) {
        throw new Error(err)
      }
    })
})
// END: Load Slack token from file.

                    //var email = response.text.substring(response.text.lastIndexOf("|") +1).slice(0,-1);

controller.hears(
  ['.*'],
  ['ambient', 'direct_message', 'direct_mention', 'mention'],
  function (bot, message) {
    bot.startConversation(message, function (err, convo) {
      if (err) {
        console.log(err)
        return
      }
      convo.ask('Do you want to whitelist an email?', [
        {
          pattern: bot.utterances.yes,
          callback: function (response, convo) {
            convo.say('Great!')
            convo.ask('Give me the email.', [
              {
                pattern: '[a-zA-z.-_@]+',
                callback: async function (response, convo) {
                  var email = response.text.substring(response.text.lastIndexOf("|") +1).slice(0,-1);
                  if (validator.validate(email)) {
                    convo.say({
                      'text': `Your email is: ${email}`
                    });
                    bot.reply(message, "Running commands, please wait... :hourglass_flowing_sand:");
                    await fs.writeFile("/tmp/MGO_Whitelist.csv", `email\r\n${email}`, function(err, stdout, stderr) {
                        if(err) {
                          convo.say({text: `Stderr: ${stderr} \r\n Error: ${err}`});
                          bot.reply(message, `ERROR! ${stdout} ${stderr} ${err}`);
                          return console.log(err);
                        }
                        console.log("Local file was saved!");
                    });
                    await exec(`scp /tmp/MGO_Whitelist.csv xb91@dmnanlx7105:".//phpdevdeploy//data\\ extensions//MGO_Whitelist.csv"`, (err, stdout, stderr) => {
                      if (err) {
                        // node couldn't execute the command
                        convo.say({text: `Stderr: ${stderr} \r\n Error: ${err}`});
                        bot.reply(message, `ERROR! ${stdout} ${stderr} ${err}`);
                        return;
                      }

                      // the *entire* stdout and stderr (buffered)
                      console.log(`File saved on remote server.`);
                      console.log(`stdout: ${stdout}`);
                      console.log(`stderr: ${stderr}`);
                    });
                    await exec(`ssh dmnanlx7105 "cd /home/xb91/phpdevdeploy; /usr/bin/php /home/xb91/phpdevdeploy/devDeployDE.php QA"`, (err, stdout, stderr) => {
                      if (err) {
                        // node couldn't execute the command
                        convo.say({text: `Stderr: ${stderr} \r\n Error: ${err}`});
                        bot.reply(message, `ERROR! ${stdout} ${stderr} ${err}`);
                        return;
                      }

                      // the *entire* stdout and stderr (buffered)
                      console.log("Whitelist updated.");
                      console.log(`stdout: ${stdout}`);
                      console.log(`stderr: ${stderr}`);
                      if (stdout.includes("[StatusCode] => OK"))
                        bot.reply(message, `Whitelist updated! :+1:`);
                      else
                        bot.reply(message, `ERROR details: ${stdout} ${stderr}`);
                    });  
                  }else{
                    convo.say("Sorry, I didn't understand that email. Try again, please.")
                    convo.repeat()
                    convo.next()
                  }
                  convo.next()
                }
              },
              {
                default: true,
                callback: function (response, convo) {
                  convo.say(
                    "Sorry, I didn't understand that. Enter a number, please.")
                  convo.repeat()
                  convo.next()
                }
              }
            ])
            convo.next()
          }
        },
        {
          pattern: bot.utterances.no,
          callback: function (response, convo) {
            convo.say('Perhaps later.')
            convo.next()
          }
        },
        {
          default: true,
          callback: function (response, convo) {
            // Repeat the question.
            convo.repeat()
            convo.next()
          }
        }
      ])
    })
  })
  // END: listen for cat emoji delivery
