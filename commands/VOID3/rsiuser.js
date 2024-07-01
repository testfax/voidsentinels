const Discord = require("discord.js");
const { botIdent,fetcher } = require('../../functions');


module.exports = {
    data: new Discord.SlashCommandBuilder()
    .setName('rsiuser')
	.setDescription('Checks RSI website for user information')
	.addStringOption(option =>
		option.setName('input')
			.setDescription('Add a player name')
    ),
    async execute (interaction) {
        await interaction.deferReply({ ephemeral: true });
        const inputs = interaction.options._hoistedOptions
        console.log(inputs)
        // https://api.starcitizen-api.com/p9aHTOTpStpQGYFYUJmRaj1l6QmbZHGI/v1/live/user/
        const rsi_response = await fetcher(`https://api.starcitizen-api.com/p9aHTOTpStpQGYFYUJmRaj1l6QmbZHGI/v1/live/user/${inputs[0].value}`)
        console.log("RSI:",rsi_response)

        const citizen_info = {
            "organization": rsi_response.data.organization.name,
            
        }


        const returnEmbed = new Discord.EmbedBuilder()
        .setTitle('RSI User Organization Information')
        .setAuthor({name: botIdent().activeBot.botName,iconURL: botIdent().activeBot.icon})
        .setThumbnail(botIdent().activeBot.icon)
        .setDescription(`Citizen Information`)
        .addFields(
            { name: "Citizen", value: inputs[0].value },
        )
        
        const buttonRow = new Discord.ActionRowBuilder()
        .addComponents(new Discord.ButtonBuilder().setLabel('Show on RSI Website').setStyle(Discord.ButtonStyle.Link).setURL(`https://robertsspaceindustries.com/citizens/${inputs[0].value}`),)
        interaction.editReply({ embeds: [returnEmbed.setTimestamp()], components: [buttonRow] });
    }
}