const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const Discord = require("discord.js");
const { Client, Intents } = require("discord.js");
const fs = require("node:fs");

const client = new Discord.Client({
  intents: [
    Intents.FLAGS.DIRECT_MESSAGES,
    Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
    Intents.FLAGS.DIRECT_MESSAGE_TYPING,
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    Intents.FLAGS.GUILD_MESSAGE_TYPING,
  ],
});
const data = require("./secrets.json");
const eventsData = require("./events.json");
const events = eventsData.events;

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.login(data.TOKEN);

const { SlashCommandBuilder } = require("@discordjs/builders");

const commands = [
  new SlashCommandBuilder()
    .setName("am-i-registered")
    .setDescription(
      "provides a url for texas residents to find out where to vote"
    )
    .toJSON(),
  new SlashCommandBuilder()
    .setName("events")
    .setDescription(
      "Series of posted events, from election dates and deadlines to candidate filing deadlines"
    )
    .toJSON(),
  new SlashCommandBuilder()
    .setName("voter-registration-deadline")
    .setDescription("texas voter registration deadline for next election")
    .toJSON(),
  new SlashCommandBuilder()
    .setName("valid-ids")
    .setDescription("list of valid IDs to take with you when you vote")
    .toJSON(),
  new SlashCommandBuilder()
    .setName("event")
    .setDescription("look up events by date")
    .addStringOption((option) =>
      option
        .setName("date")
        .setDescription("the date in the format of MM/DD/YYYY")
        .setRequired(true)
    )
    .toJSON(),
];

const clientID = data.CLIENT_ID;
const guildID = data.GUILD_ID;

const rest = new REST({ version: "9" }).setToken(data.TOKEN);

rest
  .put(Routes.applicationGuildCommands(clientID, guildID), { body: commands })
  .then(() => console.log("Successfully registered application commands."))
  .catch(console.error);

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;
  if (commandName === "am-i-registered") {
    await interaction.reply({
      content:
        "if you are a texas resident please go to the following website to check your registration status: https://teamrv-mvp.sos.texas.gov/MVP/mvp.do \n if you are not registered to vote please visit this site for more information: https://www.votetexas.gov/register-to-vote/ \n **The voter registration deadline for the Nov 8, 2022 Election is Oct 11, 2022.** ",
      ephemeral: true,
    });
  }
  if (commandName === "events") {
    await eventsParser(events, interaction);
  }
  if (commandName === "voter-registration-deadline") {
    await interaction.reply({
      content: `**The voter registration deadline for the Nov 8, 2022 Election is Oct 11, 2022.**`,
      ephemeral: true,
    });
  }
  if (commandName === "valid-ids") {
    let str = "";
    str += "Acceptable Forms of Identification: \n";
    str += " - Texas Drivers License*\n";
    str += " - Texas Election ID Certificate*\n";
    str += " - Texas Personal ID Card*\n";
    str += " - Texas Handgun License*\n";
    str += " - U.S. Citizenship Certificate with Photo\n";
    str += " - U.S. Military ID Card*\n";
    str += " - U.S. Passport* (Book or Card)\n\n";
    str +=
      " \\* *For voters aged 18-69 years, photo ID can be expired for up to four years. For voters aged 70 and older, photo ID can be expired for any length of time if otherwise valid.*\n\n";
    str += "Resources: (PDFS DOWNLOADED TO DOWNLOADS FOLDER)\n";
    str +=
      " - Acceptable Forms of Identification: https://www.sos.state.tx.us/elections/forms/id/acceptable-forms-of-ID.pdf\n";
    str +=
      " - Notice of Acceptable Identification Poster (English): https://www.votetexas.gov/docs/sos-voter-ed-8-5x11-eng.pdf \n";
    str +=
      " - Notice of Acceptable Identificaiton Poster (Spanish): https://www.votetexas.gov/docs/sos-voter-ed-8-5x11-spn.pdf \n";
    str +=
      " - Ready. Check. Vote. Information Card (English): https://www.votetexas.gov/docs/sos-voter-ed-infocard-eng.pdf\n";
    str +=
      " - Ready. Check. Vote. Information Card (Spanish): https://www.votetexas.gov/docs/sos-voter-ed-infocard-spn.pdf\n";
    str +=
      " - Forms: https://www.sos.state.tx.us/elections/forms/pol-sub/index.shtml#photo-id\n";
    await interaction.reply({ content: str, ephemeral: true });
  }
  if (commandName === "event") {
    //console.log(interaction);
    let result = interaction.options.getString("date");
    const regex = /[0-9]{1,2}\/[0-9]{1,2}\/[0-9]{4}/;
    console.log(result);
    if (!regex.test(result)) {
      interaction.reply({
        content: "please enter a valid date format MM/DD/YYYY",
        ephemeral: true,
      });
      return;
    }

    //find the date
    let filteredEvents = events.filter(
      (event) => Date.parse(event.date) === Date.parse(result)
    );
    console.log(filteredEvents);
    if (filteredEvents.length == 0) {
      await interaction.reply({
        content: `there are no events on the provided date of ${result}`,
        ephemeral: true,
      });
      return;
    }
    //spit out the coresponding data
    await eventsParser(filteredEvents, interaction);
  }
});

/**
 * the event parser will parse through the list of events and provide a prettified list to display to discord
 * @param {*} events - the list of events to parse
 * @param {*} interaction - the interaction to reply back to discord
 */
async function eventsParser(events, interaction) {
  let str = "";

  events.forEach((event) => {
    str += ` - **${event.date} :** \n\t ${event.description}\n`;
  });
  await interaction.reply({
    content: `list of events and their dates: \n${str}\n for more information please visit the following link: https://tinyurl.com/mr3r4rt6`,
    ephemeral: true,
  });
}
