const Discord = require("discord.js");

module.exports = {
    data: new Discord.SlashCommandBuilder()
	.setName('github')
	.setDescription('Link to the Void Sentinels Github Page'),
    // .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    permissions:0,
    execute(interaction) {
        interaction.reply({ content: "🛠 https://github.com/testfax/voidsentinels" });
    }
};