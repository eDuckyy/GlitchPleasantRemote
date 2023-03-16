// Pleasant Corporation

// init project
const express = require('express');
var bodyParser = require('body-parser');
const https = require('https');
const app = express();
const {
    Client,
    MessageEmbed
} = require('discord.js');
let client = new Client();



//// IMPORTANT VVV
let token = process.env.SECRET //Your token goes in key.env (Discord bot)
let prefix = '!'; // Discord bot prefix
let rolename = "Management"
/// IMPORTANT ^^^

let numbers = [
  "0️⃣",
  "1️⃣",
  "2️⃣",
  "3️⃣",
  "4️⃣"
]

async function startApp() {
    var promise = client.login(token)
    console.log("Starting...");
    promise.catch(function(error) {
      console.error("Discord Bot Login | " + error);
      process.exit(1);
    });
}
startApp();
client.on("ready", () => {
  console.log("Successfully logged into the Pleasant Remote Administration bot.");
})

const Invalid = new MessageEmbed()
  .setColor('#eb9c98')
  .setDescription("An invalid user was inserted. Please rectify this issue.")



var toBan = [];
function byUID(method,usr,message) {
  const Emb = new MessageEmbed()
      .setColor('#f0d7a3')
      //.setTitle(request.headers.username + "'s Data")
     // .setTitle("Communication Attempt")
      //.setAuthor('Pleasant Remote Administration • Roblox Error','')
      .setDescription("Attempting to "+method+" UserID "+ usr +"...")
      .setTimestamp()
      .setFooter('Pleasant Remote Administration • Pleasant Corporation');
    message.edit(Emb);
  https.get("https://api.roblox.com/users/" + usr, (res) => {
      
      let data = '';
      res.on('data', d => {
        data += d
      })
      res.on('end', () => {
        if (res.statusCode == 200) {
          toBan.push({method: method,username: JSON.parse(data).Username,value: usr,cid: message.channel.id,mid: message.id});
        } else {
          message.edit(Invalid);
        }
      });
  }).on('error', error => {
    console.error("RBLX API (UID) | " + error);
  });
}

function byUser(method,usr,message) {
  const Emb = new MessageEmbed()
        .setColor('#f0d7a3')
        //.setTitle(request.headers.username + "'s Data")
       // .setTitle("Communication Attempt")
        //.setAuthor('Pleasant Remote Administration • Roblox Error','')
        .setDescription("Attempting to "+method+" username "+ usr +"...")
        .setTimestamp()
        .setFooter('Pleasant Remote Administration • Pleasant Corporation');
  message.edit(Emb);
  https.get("https://api.roblox.com/users/get-by-username?username=" + usr, (res) => {
      let data = '';
      res.on('data', d => {
        data += d
      })
      res.on('end', () => {
        if (JSON.parse(data).Id != undefined) {
          toBan.push({method: method,value: JSON.parse(data).Id,username: JSON.parse(data).Username,cid: message.channel.id,mid: message.id});
        } else {
          message.edit(Invalid);
        }
      });
  }).on('error', error => {
    console.error("RBLX API (Username) | " + error);
  });
}

function isCommand(command, message) {
    var command = command.toLowerCase();
    var content = message.content.toLowerCase();
    return content.startsWith(prefix + command);
}

const TookTooLong = new MessageEmbed()
  .setColor('#eb9c98')
  .setDescription("You have taken too long to respond to the command, and the execution of the command was aborted.")


async function determineType(method,message,BotMsg,args) {
  if (isNaN(Number(args[1]))) {
    byUser(method,args[1],BotMsg);
  } else {
    const Emb = new MessageEmbed()
      .setColor('#ffc692')
      //.setTitle(request.headers.username + "'s Data")
      .setTitle("Is this a Roblox UserID or a Username?")
      //.setAuthor('Pleasant Remote Administration • Roblox Error','')
      .setDescription("Please react with the number that matches the answer.")
      .addField(numbers[0] + ": Username","This is a players username in game.")
      .addField(numbers[1] + ": UserID","This is the players UserID connect with the account.")
      .setTimestamp()
      .setFooter('Pleasant Remote Administration • Pleasant Corporation');
    BotMsg.edit(Emb);
    try {
      await BotMsg.react(numbers[0]);
      await BotMsg.react(numbers[1]);
    } catch (error) {
      console.error('One of the emojis failed to react.');
    }
    const filter = (reaction, user) => {
      return numbers.includes(reaction.emoji.name) && user.id === message.author.id;
    };
    BotMsg.awaitReactions(filter, { max: 1, time: 30000, errors: ['time'] })
      .then(collected => {
        const reaction = collected.first();
        const ind = numbers.findIndex(function(n){
           return n == reaction.emoji.name;
        })
        BotMsg.reactions.removeAll().catch(error => console.error('Failed to clear reactions: ', error));
        if (ind == 0) {
          byUser(method,args[1],BotMsg);
        } else if (ind == 1) {
          byUID(method,args[1],BotMsg);
        } else {
          BotMsg.edit('The Pleasant Remote Administration System ran into an issue, and the execution of the command was aborted.');
        }//
      })
      .catch(collected => {
        BotMsg.edit(TookTooLong);
        BotMsg.reactions.removeAll().catch(error => console.error('Failed to clear reactions: ', error));
      });
  }
}

client.on('message', async (message) => {
  if(message.author.bot) return;
   if (message.member.roles.cache.some(role => role.name === rolename)) {
      const args = message.content.slice(prefix.length).split(' ');
       var Emb = new MessageEmbed()
          .setColor('#eb9c98')
          .setDescription("Loading...")

      if (isCommand("Ban", message)) {
        var BotMsg = await message.channel.send("<@" + message.author.id + ">",Emb);
        determineType("Ban",message,BotMsg,args);
      } else if (isCommand("Unban", message)) {
        var BotMsg = await message.channel.send("<@" + message.author.id + ">",Emb);
        determineType("Unban",message,BotMsg,args);
      } else if (isCommand("Kick",message)) {
        var BotMsg = await message.channel.send("<@" + message.author.id + ">",Emb);
        determineType("Kick",message,BotMsg,args);
      }
    }
});
//
app.use(express.static('public'));

app.get('/', async function(request, response) {
  if (request.headers.username != undefined) { 
    const channel = await client.channels.cache.get(request.headers.cid);
    channel.messages.fetch(request.headers.mid)
      .then(msg => {
        if (request.headers.rblxerror == undefined) {
          const Emb = new MessageEmbed()
                .setColor('#a1ff75')
                .setTitle(request.headers.method + " Execution Successful")
                .addField('Username',request.headers.username)
                .addField('UserID',request.headers.value)
                //.addField('Inline field title', 'Some value here', true)
                //.setImage('https://www.roblox.com/Thumbs/Avatar.ashx?x=100&y=100&userId='+request.headers.uid)
                .setTimestamp()
                .setFooter('Pleasant Remote Administration • Pleasant Corporation');
          if (msg.author != undefined) {
            msg.edit(Emb);
          } else {
            channel.send(Emb);
          }
        } else {
          const Emb = new MessageEmbed()
                .setColor('#eb9c98')
                .setTitle(request.headers.method + " Execution Failed")
                .addField('Username',request.headers.username)
                .addField('UserID',request.headers.value)
                .addField('Rblx-Error',request.headers.rblxerror)
                //.addField('Inline field title', 'Some value here', true)
                //.setImage('https://www.roblox.com/Thumbs/Avatar.ashx?x=100&y=100&userId='+request.headers.uid)
                .setTimestamp()
                .setFooter('Pleasant Remote Administration • Pleasant Corporation');
              if (msg.author != undefined) {
                msg.edit(Emb);
              } else {
                channel.send(Emb);
              }
        }
    })
    .catch( err =>{
      console.log(err);       
    });
  }
  response.send(toBan[0]);
  toBan.shift();
});

// Listens for requests, and keeps the Pleasant Remote Administration System online

let listener = app.listen(process.env.PORT, function() {
    //setInterval(() => { // Used to work sometime ago
    //    http.get(`http://${process.env.PROJECT_DOMAIN}.glitch.me/`);
    //}, 280000);
    console.log('The Pleasant Remote Administration System is listening on port: ' + listener.address().port);
});

client.on('error', console.error)