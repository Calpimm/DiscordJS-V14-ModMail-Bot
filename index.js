const { QuickDB } = require('quick.db');
const colors = require('colors');
const ms = require('ms');
const db = new QuickDB();
const config = require("./config.js");
const {
  Client,
  GatewayIntentBits,
  PermissionFlagsBits,
  PermissionsBitField,
  Partials,
  REST,
  Routes,
  ChannelType,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  InteractionType,
  bold,
  italic
} = require('discord.js');

// Creating a new client:
const client = new Client(
  {
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildIntegrations,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMessageReactions,
      GatewayIntentBits.GuildMessageTyping,
      GatewayIntentBits.DirectMessages,
      GatewayIntentBits.DirectMessageReactions,
      GatewayIntentBits.DirectMessageTyping,
      GatewayIntentBits.MessageContent,
    ],
    partials: [
      Partials.Message,
      Partials.Channel,
      Partials.GuildMember,
      Partials.GuildScheduledEvent,
      Partials.User
    ],
    presence: {
      activities: [{
        name: "DM Me for ModMail!",
        type: 1,
        url: "https://twitch.tv/discord"
      }]
    }
  }
);

// Host the bot:
require('http')
  .createServer((req, res) => res.end('Ready.'))
  .listen(3030);

// Cool message logger: (DO NOT REMOVE T.F.A#7524, YOU'VE BEEN WARNED.)
const asciiText = `
███╗░░░███╗░█████╗░██████╗░███╗░░░███╗░█████╗░██╗██╗░░░░░
████╗░████║██╔══██╗██╔══██╗████╗░████║██╔══██╗██║██║░░░░░
██╔████╔██║██║░░██║██║░░██║██╔████╔██║███████║██║██║░░░░░
██║╚██╔╝██║██║░░██║██║░░██║██║╚██╔╝██║██╔══██║██║██║░░░░░
██║░╚═╝░██║╚█████╔╝██████╔╝██║░╚═╝░██║██║░░██║██║███████╗
╚═╝░░░░░╚═╝░╚════╝░╚═════╝░╚═╝░░░░░╚═╝╚═╝░░╚═╝╚═╝╚══════╝
Version 6.0.0 By T.F.A#7524.
`.underline.red;

console.log(asciiText);

// Variables checker:
const AuthentificationToken = config.Client.TOKEN || process.env.TOKEN;

if (!AuthentificationToken) {
  console.error("[ERROR] You need to provide your bot token!".red);
  return process.exit();
}

if (!config.Client.ID) {
  console.error("[ERROR] You need to provide your bot ID!".red);
  return process.exit();
}

if (!config.Handler.GUILD_ID) {
  console.error("[ERROR] You need to provide your server ID!".red);
  return process.exit();
}

if (!config.Handler.CATEGORY_ID) {
  console.error("[WARN] You should to provide the modmail category ID!".red);
  console.error("[WARN] Use the slash command /setup to fix this problem without using the config.js file.".red);
}

if (!config.Modmail.INTERACTION_COMMAND_PERMISSIONS) {
  console.error("[ERROR] You need to provide at least one permission for the slash commands handler!".red);
  return process.exit();
};

// Creating some slash commands:
const commands = [
  {
    name: 'ping',
    description: 'Replies with Pong!',
  },

  {
    name: 'ban',
    description: 'Ban a user from using the modmail system.',
    options: [
      {
        name: "user",
        description: "The user to ban.",
        type: 6, // Guild "USER" type.
        required: true
      },
      {
        name: "reason",
        description: "The reason for the ban.",
        type: 3 // "STRING" type.
      }
    ]
  },

  {
    name: 'unban',
    description: 'Unban a user from using the modmail system.',
    options: [
      {
        name: "user",
        description: "The user to unban.",
        type: 6, // Guild "USER" type.
        required: true
      }
    ]
  },

  {
    name: 'close',
    description: 'Close a created mail.',
    options: [
      {
        name: "reason",
        description: "The reason for closing the mail.",
        type: 3 // "STRING" type.
      }
    ]
  },

  {
    name: 'setup',
    description: 'Setup the mail caterogy system.'
  }
];

// Slash commands handler:
const rest = new REST({ version: '10' })
  .setToken(process.env.TOKEN || config.Client.TOKEN);

(async () => {
  try {
    console.log('[HANDLER] Started refreshing application (/) commands.'.brightYellow);

    await rest.put(
      Routes.applicationGuildCommands(config.Client.ID, config.Handler.GUILD_ID), { body: commands }
    );

    console.log('[HANDLER] Successfully reloaded application (/) commands.'.brightGreen);
  } catch (error) {
    console.error(error);
  }
})();

// Login to the bot:
client.login(AuthentificationToken)
  .catch(console.log);

// Client once it's ready:
client.once('ready', async () => {
  console.log(`[READY] ${client.user.tag} is up and ready to go.`.brightGreen);
});

// If there is an error, this handlers it.
process.on('unhandledRejection', async (err, promise) => {
  console.warn("[ERROR] An error has occured and been successfully handled: ".red + err, promise);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = interaction.commandName;

  // If command is "Ping":
  if (command === "ping") {
    interaction.reply(
      {
        content: `${client.ws.ping} ms!`
      }
    ).catch(() => { });
    // If command is "Ban":
  } else if (command === "ban") {
    const user = interaction.options.get('user').value;

    let reason = interaction.options.get('reason');
    let correctReason;

    if (!reason) correctReason = 'No reason was provided.';
    if (reason) correctReason = reason.value;

    if (!interaction.member.permissions.has(
      PermissionsBitField.resolve(config.Modmail.INTERACTION_COMMAND_PERMISSIONS || []))
    ) return interaction.reply(
      {
        embeds: [
          new EmbedBuilder()
            .setTitle('Missing Permissions:')
            .setDescription(`Sorry, I can't let you to use this command because you need ${bold(config.Modmail.INTERACTION_COMMAND_PERMISSIONS.join(', '))} permissions!`)
            .setColor('Red')
        ],
        ephemeral: true
      }
    );

    const bannedCheck = await db.get(`banned_guild_${config.Handler.GUILD_ID}_user_${user}`);

    if (bannedCheck) return interaction.reply(
      {
        embeds: [
          new EmbedBuilder()
            .setDescription(`That user is already banned.`)
            .setColor('Red')
        ],
        ephemeral: true
      }
    );

    await db.add(`banned_guild_${config.Handler.GUILD_ID}_user_${user}`, 1);
    await db.set(`banned_guild_${config.Handler.GUILD_ID}_user_${user}_reason`, correctReason);

    return interaction.reply(
      {
        embeds: [
          new EmbedBuilder()
            .setDescription(`That user has been successfully banned. Reason: ${bold(correctReason)}`)
            .setColor('Green')
        ],
        ephemeral: true
      }
    );

    // If command is "Unban":
  } else if (command === "unban") {
    const user = interaction.options.get('user').value;

    if (!interaction.member.permissions.has(
      PermissionsBitField.resolve(config.Modmail.INTERACTION_COMMAND_PERMISSIONS || []))
    ) return interaction.reply(
      {
        embeds: [
          new EmbedBuilder()
            .setTitle('Missing Permissions:')
            .setDescription(`Sorry, I can't let you to use this command because you need ${bold(config.Modmail.INTERACTION_COMMAND_PERMISSIONS.join(', '))} permissions!`)
            .setColor('Red')
        ],
        ephemeral: true
      }
    );

    const bannedCheck = await db.get(`banned_guild_${config.Handler.GUILD_ID}_user_${user}`);

    if (!bannedCheck) return interaction.reply(
      {
        embeds: [
          new EmbedBuilder()
            .setDescription(`That user is already unbanned.`)
            .setColor('Red')
        ],
        ephemeral: true
      }
    );

    await db.delete(`banned_guild_${config.Handler.GUILD_ID}_user_${user}`);
    await db.delete(`banned_guild_${config.Handler.GUILD_ID}_user_${user}_reason`);

    return interaction.reply(
      {
        embeds: [
          new EmbedBuilder()
            .setDescription(`That user has been successfully unbanned.`)
            .setColor('Green')
        ],
        ephemeral: true
      }
    );

    // If command is "Close":
  } else if (command === "close") {
    let reason = interaction.options.get('reason');
    let correctReason;

    if (!reason) correctReason = 'No reason was provided.';
    if (reason) correctReason = reason.value;

    if (!interaction.member.permissions.has(
      PermissionsBitField.resolve(config.Modmail.INTERACTION_COMMAND_PERMISSIONS || []))
    ) return interaction.reply(
      {
        embeds: [
          new EmbedBuilder()
            .setTitle('Missing Permissions:')
            .setDescription(`Sorry, I can't let you to use this command because you need ${bold(config.Modmail.INTERACTION_COMMAND_PERMISSIONS.join(', '))} permissions!`)
            .setColor('Red')
        ],
        ephemeral: true
      }
    );

    const guild = client.guilds.cache.get(config.Handler.GUILD_ID);
    const category = guild.channels.cache.find(CAT => CAT.id === config.Handler.CATEGORY_ID || CAT.name === "ModMail");

    if (interaction.channel.parentId === category.id) {
      const requestedUserMail = guild.members.cache.get(interaction.channel.name);

      interaction.reply(
        {
          content: "Closing..."
        }
      ).catch(() => { });

      await interaction.channel.delete()
        .catch(() => { });

      requestedUserMail.send(
        {
          embeds: [
            new EmbedBuilder()
              .setTitle('Mail Closed:')
              .setDescription(`Your mail has been successfully closed by a staff member.`)
              .addFields(
                { name: "Reason", value: `${italic(correctReason)}` }
              )
              .setColor('Green')
          ]
        }
      )
    } else {
      return interaction.reply(
        {
          embeds: [
            new EmbedBuilder()
              .setDescription(`Sorry, but you can't use this command here. This command works only in the modmail category channel!`)
              .setColor('Red')
          ],
          ephemeral: true
        }
      );
    }

    // If command is "Setup":
  } else if (command === "setup") {
    if (!interaction.member.permissions.has(
      PermissionsBitField.resolve(config.Modmail.INTERACTION_COMMAND_PERMISSIONS || []))
    ) return interaction.reply(
      {
        embeds: [
          new EmbedBuilder()
            .setTitle('Missing Permissions:')
            .setDescription(`Sorry, I can't let you to use this command because you need ${bold(config.Modmail.INTERACTION_COMMAND_PERMISSIONS.join(', '))} permissions!`)
            .setColor('Red')
        ],
        ephemeral: true
      }
    );

    const guild = client.guilds.cache.get(config.Handler.GUILD_ID);
    const category = guild.channels.cache.find(CAT => CAT.id === config.Handler.CATEGORY_ID || CAT.name === "ModMail");

    // If category is found:
    if (category) {
      interaction.reply(
        {
          embeds: [
            new EmbedBuilder()
              .setDescription(`There is already a modmail category named "ModMail". Replace the old category by a new category?\n\n:warning: If you click on **Replace**, all the mails text channels will be outside of category.`)
              .setColor('Red')
              .setFooter(
                {
                  text: "This request expires in 10 seconds, buttons won't respond to your actions after 10 seconds."
                }
              )
          ],
          components: [
            new ActionRowBuilder()
              .addComponents(
                new ButtonBuilder()
                  .setCustomId('replace_button_channel_yes')
                  .setLabel('Replace')
                  .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                  .setCustomId('replace_button_channel_no')
                  .setLabel('No')
                  .setStyle(ButtonStyle.Danger),
              )
          ],
          ephemeral: true
        }
      ).catch(() => { });

      const collectorREPLACE_CHANNEL = interaction.channel.createMessageComponentCollector({
        time: 10000
      });

      collectorREPLACE_CHANNEL.on('collect', async (i) => {
        const ID = i.customId;

        if (ID == "replace_button_channel_yes") {
          i.update(
            {
              embeds: [
                new EmbedBuilder()
                  .setDescription(`Creating a new category... This may take a while!`)
                  .setColor('Yellow')
              ],
              components: [
                new ActionRowBuilder()
                  .addComponents(
                    new ButtonBuilder()
                      .setCustomId('replace_button_channel_yes')
                      .setLabel('Replace')
                      .setStyle(ButtonStyle.Success)
                      .setDisabled(true),
                    new ButtonBuilder()
                      .setCustomId('replace_button_channel_no')
                      .setLabel('No')
                      .setStyle(ButtonStyle.Danger)
                      .setDisabled(true),
                  )
              ]
            }
          ).catch(() => { });

          await category.delete()
            .catch(() => { });

          const channel = await guild.channels.create({
            name: "ModMail",
            type: ChannelType.GuildCategory,
            permissionOverwrites: [
              {
                id: guild.roles.everyone,
                deny: [PermissionFlagsBits.ViewChannel],
              },
            ]
          }).catch(console.log);

          let roles = [];

          if (config.Modmail.MAIL_MANAGER_ROLES) {
            config.Modmail.MAIL_MANAGER_ROLES.forEach(async (role) => {
              const roleFetched = guild.roles.cache.get(role);
              if (!roleFetched) return roles.push('[INVALID ROLE]');

              roles.push(roleFetched);

              await channel.permissionOverwrites.create(roleFetched.id, {
                SendMessages: true,
                ViewChannel: true,
                AttachFiles: true
              })
            });
          } else {
            roles.push("No roles were added to config.js file");
          }

          interaction.editReply(
            {
              embeds: [
                new EmbedBuilder()
                  .setDescription(`Done, successfully created a mail category named **ModMail**.`)
                  .addFields(
                    { name: "Roles", value: roles.join(', ') + "." }
                  )
                  .setFooter(
                    {
                      text: "WARN: Please check the roles in the category channel, errors could happen in anytime."
                    }
                  )
                  .setColor('Green')
              ]
            }
          ).catch(() => { });

          return collectorREPLACE_CHANNEL.stop();
        } else if (ID == "replace_button_channel_no") {
          i.update(
            {
              embeds: [
                new EmbedBuilder()
                  .setDescription(`Cancelled.`)
                  .setFooter(
                    {
                      text: "You can now click on \"Dismiss message\" below this embed message."
                    }
                  )
                  .setColor('Green')
              ],
              components: [
                new ActionRowBuilder()
                  .addComponents(
                    new ButtonBuilder()
                      .setCustomId('replace_button_channel_yes')
                      .setLabel('Replace')
                      .setStyle(ButtonStyle.Success)
                      .setDisabled(true),
                    new ButtonBuilder()
                      .setCustomId('replace_button_channel_no')
                      .setLabel('No')
                      .setStyle(ButtonStyle.Danger)
                      .setDisabled(true),
                  )
              ],
            }
          ).catch(() => { });

          return collectorREPLACE_CHANNEL.stop();
        } else return;
      })

      // If category is not found:
    } else {
      interaction.reply(
        {
          embeds: [
            new EmbedBuilder()
              .setDescription(`Creating a new category... This may take a while!`)
              .setColor('Yellow')
          ]
        }
      ).catch(() => { });

      const channel = await guild.channels.create({
        name: "ModMail",
        type: ChannelType.GuildCategory,
        permissionOverwrites: [
          {
            id: guild.roles.everyone,
            deny: [PermissionFlagsBits.ViewChannel],
          },
        ]
      }).catch(console.log);

      let roles = [];

      if (config.Modmail.MAIL_MANAGER_ROLES) {
        config.Modmail.MAIL_MANAGER_ROLES.forEach(async (role) => {
          const roleFetched = guild.roles.cache.get(role);
          if (!roleFetched) return roles.push('[INVALID ROLE]');

          roles.push(roleFetched);

          await channel.permissionOverwrites.create(roleFetched.id, {
            SendMessages: true,
            ViewChannel: true,
            AttachFiles: true
          })
        });
      } else {
        roles.push("No roles were added to config.js file.");
      }

      return interaction.editReply(
        {
          embeds: [
            new EmbedBuilder()
              .setDescription(`Done, successfully created a mail category named **ModMail**.`)
              .addFields(
                { name: "Roles", value: roles.join(', ') + "." }
              )
              .setFooter(
                {
                  text: "WARN: Please check the roles in the category channel, errors could happen in anytime."
                }
              )
              .setColor('Green')
          ]
        }
      ).catch(() => { });
    }
  } else return;
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const guild = client.guilds.cache.get(config.Handler.GUILD_ID);

  if (!guild) {
    console.error('[CRASH] Guild is not valid.'.red);
    return process.exit();
  }

  const category = guild.channels.cache.find(CAT => CAT.id === config.Handler.CATEGORY_ID || CAT.name === "ModMail");

  const channel = guild.channels.cache.find(
    x => x.name === message.author.id && x.parentId === category.id
  );

  const bannedUserCheck = await db.get(`banned_guild_${config.Handler.GUILD_ID}_user_${message.author.id}`);

  // If the message in a DM channel:
  if (message.channel.type == ChannelType.DM) {
    if (bannedUserCheck) {
      const reason = await db.get(`banned_guild_${config.Handler.GUILD_ID}_user_${message.author.id}_reason`);

      return message.reply(
        {
          embeds: [
            new EmbedBuilder()
              .setTitle("Mail Creation Failed:")
              .setDescription(`Sorry, we couldn\'t create a mail for you because you are ${bold('banned')} from using the modmail system!`)
              .addFields(
                { name: 'Reason of the ban', value: italic(reason) }
              )
          ]
        }
      );
    };

    if (!category) return message.reply(
      {
        embeds: [
          new EmbedBuilder()
            .setDescription("The system is not ready yet.")
            .setColor("Red")
        ]
      }
    );

    // The Modmail system:
    if (!channel) {
      let embedDM = new EmbedBuilder()
        .setTitle("Mail Creation:")
        .setDescription(`Your mail has been successfully created with these details below:`)
        .addFields(
          { name: "Message", value: `${message.content || italic("(No message was sent, probably a media/embed message was sent, or an error)")}` }
        )
        .setColor('Green')
        .setFooter(
          {
            text: "You can click on \"Close\" button to close this mail."
          }
        )

      if (message.attachments.size) {
        embedDM.setImage(message.attachments.map(img => img)[0].proxyURL);
        embedDM.addFields(
          { name: "Media(s)", value: italic("(Below this message line)") }
        )
      };

      message.reply(
        {
          embeds: [
            embedDM
          ],
          components: [
            new ActionRowBuilder()
              .addComponents(
                new ButtonBuilder()
                  .setCustomId('close_button_created_mail_dm')
                  .setLabel('Close')
                  .setStyle(ButtonStyle.Secondary),
              )
          ]
        }
      );

      const channel = await guild.channels.create({
        name: message.author.id,
        type: ChannelType.GuildText,
        parent: category,
        topic: `A Mail channel created by ${message.author.tag} for requesting help, created on ${new Date().toLocaleString()}.`
      }).catch(console.log);

      let embed = new EmbedBuilder()
        .setTitle("New Mail Created:")
        .addFields(
          { name: "User", value: `${message.author.tag} (\`${message.author.id}\`)` },
          { name: "Message", value: `${message.content || italic("(No message was sent, probably a media/embed message was sent, or an error)")}` },
          { name: "Created on", value: `${new Date().toLocaleString()}` },
        )
        .setColor('Blue')
        .setFooter(
          {
            text: 'Click on \"Close\" button below to close the mail. If it responds with \"This interaction failed\", use the slash command /close.'
          }
        )

      if (message.attachments.size) {
        embed.setImage(message.attachments.map(img => img)[0].proxyURL);
        embed.addFields(
          { name: "Media(s)", value: italic("(Below this message line)") }
        )
      };

      // Collector for the buttons in DM channel:
      const collectorDM = message.channel.createMessageComponentCollector({});

      collectorDM.on('collect', async (i) => {
        const ID = i.customId;

        if (ID == "close_button_created_mail_dm") {

          const channelRECHECK = guild.channels.cache.find(
            x => x.name === message.author.id && x.parentId === category.id
          );

          if (!channelRECHECK) return i.reply(
            {
              embeds: [
                new EmbedBuilder()
                  .setDescription(`${config.Modmail.EMOJIS.WARN} Already closed by a staff member or by you.`)
                  .setColor('Yellow')
              ],
              ephemeral: true
            }
          );

          await channelRECHECK.delete()
            .catch(() => { });

          i.update(
            {
              components: [
                new ActionRowBuilder()
                  .addComponents(
                    new ButtonBuilder()
                      .setCustomId('close_button_created_mail_dm')
                      .setLabel('Close')
                      .setStyle(ButtonStyle.Success)
                      .setDisabled(true),
                  )
              ]
            }
          ).catch(() => { });

          await message.author.send(
            {
              embeds: [
                new EmbedBuilder()
                  .setTitle('Mail Closed:')
                  .setDescription(`Your mail has been successfully closed by you.`)
                  .setColor('Green')
              ],
            }
          ).catch(console.log);

          return collectorDM.stop();
        } else return;
      });

      // Collector for the channel where the mail is created.
      channel.send(
        {
          embeds: [
            embed
          ],
          components: [
            new ActionRowBuilder()
              .addComponents(
                new ButtonBuilder()
                  .setCustomId('close_button_created_mail_channel')
                  .setLabel('Close')
                  .setStyle(ButtonStyle.Danger),
              )
          ]
        }
      ).then(async (sent) => {
        sent.pin()
          .catch(() => { });
      });

      client.on('interactionCreate', async (interaction) => {
        if (interaction.isButton()) {
          const ID = interaction.customId;

          if (ID == "close_button_created_mail_channel") {
            const modal = new ModalBuilder()
              .setCustomId('modal_close')
              .setTitle('Closing Mail:');

            const REASON_TEXT_INPUT = new TextInputBuilder()
              .setCustomId('modal_close_variable_1')
              .setLabel("Reason of closing the mail.")
              .setStyle(TextInputStyle.Short)
              .setRequired(false);

            const ACTION_ROW = new ActionRowBuilder()
              .addComponents(REASON_TEXT_INPUT);

            modal.addComponents(ACTION_ROW);

            await interaction.showModal(modal)
              .catch(() => { });
          }
        } else return;
      });

      client.on('interactionCreate', async (interaction) => {
        if (interaction.type === InteractionType.ModalSubmit) {
          const ID = interaction.customId;

          if (ID == "modal_close") {
            const requestedUserMail = guild.members.cache.get(interaction.channel.name);

            let reason = interaction.fields.getTextInputValue('modal_close_variable_1');
            if (!reason) reason = "No reason was provided.";

            interaction.reply(
              {
                content: "Closing..."
              }
            ).catch(() => { });

            return interaction.channel.delete()
              .catch(() => { })
              .then(async (ch) => {
                if (!ch) return; // THIS IS 101% IMPORTANT. IF YOU REMOVE THIS LINE, THE "Mail Closed" EMBED WILL DUPLICATES IN USERS DMS. (1, and then 2, 3, 4, 5 until Infinity)

                return requestedUserMail.send(
                  {
                    embeds: [
                      new EmbedBuilder()
                        .setTitle('Mail Closed:')
                        .setDescription(`Your mail has been successfully closed by a staff member.`)
                        .addFields(
                          { name: "Reason", value: `${italic(reason)}` }
                        )
                        .setColor('Green')
                    ]
                  }
                );
              });

          }
        } else return;
      })

    } else {
      let embed = new EmbedBuilder()
        .setAuthor({ name: `${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
        .setDescription(message.content || italic("(No message was sent, probably a media/embed message was sent, or an error)"))
        .setColor('Green');

      if (message.attachments.size) embed.setImage(message.attachments.map(img => img)[0].proxyURL);

      message.react("📨").catch(() => { });

      channel.send(
        {
          embeds: [
            embed
          ]
        }
      );

    }

    // If the message is in the modmail category:
  } else if (message.channel.type === ChannelType.GuildText) {
    if (!category) return;

    if (message.channel.parentId === category.id) {
      const requestedUserMail = guild.members.cache.get(message.channel.name);

      let embed = new EmbedBuilder()
        .setAuthor({ name: `${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
        .setDescription(message.content || italic("(No message was sent, probably a media/embed message was sent, or an error)"))
        .setColor('Red');

      if (message.attachments.size) embed.setImage(message.attachments.map(img => img)[0].proxyURL);

      message.react("📨").catch(() => { });

      requestedUserMail.send(
        {
          embeds: [
            embed
          ]
        }
      );
    } else {
      return;
    }
  }
});

/*
* DiscordJS-V14-ModMail-Bot
* Yet Another Discord ModMail Bot made with discord.js v14, built on Repl.it and coded by T.F.A#7524.
* Developer: T.F.A#7524
* Support server: dsc.gg/codingdevelopment
* Please DO NOT remove these lines, these are the credits to the developer.
* Sharing this project without giving credits to me (T.F.A) ends in a Copyright warning. (©)
*/
