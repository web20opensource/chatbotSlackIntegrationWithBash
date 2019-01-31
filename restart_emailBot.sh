#!/bin/bash

#title           :restart_emailBot.sh
#description     :This script will keep alive the emailBot
#dependencies	 :need to run from cron
#author	         :Mario Ruiz <web2.0opensource@gmail.com>
#date            :12/17/2018
#version         :1    
#usage	         :./restart_emailBot.sh
#bash_version    :4.4.12(1)-release
#==============================================================================

#get the pid
pid=$(ps aux | grep "[n]ode email" | awk '{ print $2 }')
kill -9 $pid

#echo $pid

cd /home/xb91/emailBot
slack_token_path=./slack-token  nohup node emailBot.js &

exit
