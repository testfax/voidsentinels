const Discord = require("discord.js");
const { botIdent,fetcher } = require('../../../functions');


module.exports = {
    data: new Discord.SlashCommandBuilder()
    .setName('rsiuser')
	.setDescription('Checks RSI website for user information')
	.addStringOption(option =>
		option.setName('citizen')
			.setDescription('Add player name')
    ),
    async execute (interaction) {
        await interaction.deferReply({ ephemeral: true });
        const inputs = interaction.options._hoistedOptions
        // https://api.starcitizen-api.com/p9aHTOTpStpQGYFYUJmRaj1l6QmbZHGI/v1/live/user/
        const rsi_response = await fetcher(`https://api.starcitizen-api.com/p9aHTOTpStpQGYFYUJmRaj1l6QmbZHGI/v1/live/user/${inputs[0].value}`)

        const citizen_info = {
            "organization": rsi_response.data.organization.name  != null ? rsi_response.data.organization.name : "No Main Org Found",
            "rank": rsi_response.data.organization.rank != null ? rsi_response.data.organization.rank : "N/A",
            "SID": rsi_response.data.organization.sid  != null ? rsi_response.data.organization.sid : "N/A" ,
            "citizen_display": rsi_response.data.profile.display,
            "citizen_handle": rsi_response.data.profile.handle,
            "citizen_id": rsi_response.data.profile.id.replace('#',''),
            "enlisted": rsi_response.data.profile.enlisted
        }

        const returnEmbed = new Discord.EmbedBuilder()
        .setTitle('RSI User Information')
        .setAuthor({name: botIdent().activeBot.botName,iconURL: botIdent().activeBot.icon})
        .setThumbnail(botIdent().activeBot.icon)
        .addFields(
            { name: "Citizen", value: citizen_info.citizen_handle + ` (${citizen_info.citizen_display})\n#${citizen_info.citizen_id}` },
            { name: "Organization", value: citizen_info.organization + ` (${citizen_info.SID})` },
            { name: "Rank", value: citizen_info.rank },
            { name: "Enlisted", value: citizen_info.enlisted }
        )
        
        const buttonRow = new Discord.ActionRowBuilder()
        .addComponents(new Discord.ButtonBuilder().setLabel('Show on RSI Website').setStyle(Discord.ButtonStyle.Link).setURL(`https://robertsspaceindustries.com/citizens/${inputs[0].value}`),)
        interaction.editReply({ embeds: [returnEmbed.setTimestamp()], components: [buttonRow] });
    }
}