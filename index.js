require("colors");
require("dotenv").config();
const { convert } = require('html-to-text');
const fs = require('fs');
const axios = require('axios');
const xml2js = require('xml2js');
const {Client, MessageEmbed, WebhookClient, Intents} = require("discord.js");

const client = new Client( {
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        Intents.FLAGS.GUILD_VOICE_STATES,
        Intents.FLAGS.DIRECT_MESSAGES,
    ],
    params: [
        "CHANNEL",
    ]
});
client.prefix = ",";
client.login(process.env.token);

function getRecord() {
    axios.get('https://github.com/AllTheMods/ATM-6/releases.atom').then((res => {
        xml2js.parseString(res.data,{ mergeAttrs: true },(err, result) => {
            if (err) throw err;
            let saved = readRecord();
            let entry = result.feed.entry[0];

            if (!saved || saved !== entry.id[0]) {
                writeRecord(entry.id[0]);
                let content = convert(result.feed.entry[0].content[0]._)
                getHook(entry, content);
            }
            else console.log("Unchanged");
        })
    })).catch((err) => {if (err) throw err})
}

function readRecord() {
    return fs.readFileSync("./entry.txt", {encoding: "utf-8"})
}

function writeRecord(id) {
    fs.writeFileSync("./entry.txt", id, {encoding: "utf-8"});
}

function getHook(entry, content) {
    axios({
        method: 'get',
        url: process.env.hook,
        responseType: 'json'
    })
    .then(function (response) {
        if (response.data && response.data.channel_id) {
            let hook = new WebhookClient({id: response.data.id, token: response.data.token});
            sendHook(hook, entry, content);
        }
    });
}

function sendHook(hook, entry, content) {
    let embed = new MessageEmbed()
        .setTitle("ATM6 " + entry.title[0])
        .setFooter(new Date(entry.updated[0]).toDateString())
        .setDescription(content)
    hook.send({
        username: 'ATM6 Updates',
        avatarURL: 'https://i.imgur.com/8RYnQfO.jpg',
        embeds: [embed],
    }).catch(console.error);;
}

client.on("ready", async () => {
    let prompt = `[Github] ${client.user.tag} is now online!`;
    console.log(prompt.cyan);
    getRecord();

    setInterval(() => {
        getRecord();
    }, 60000)
});
