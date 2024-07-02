const Discord = require("discord.js");
const { botIdent,fetcher, hasSpecifiedRole } = require('../../../functions');
const config = require('../../../config.json')


module.exports = {
    data: new Discord.SlashCommandBuilder()
    .setName('rsiinfo')
	.setDescription('Checks RSI website for user information')
    .addSubcommand(subcommand =>
        subcommand
            .setName('citizen')
            .setDescription('Input any player name')
            .addStringOption(option =>
                option.setName('citizen_name')
                    .setDescription('citizen dude')
                    .setRequired(true)
            )
        )
    .addSubcommand(subcommand =>
        subcommand
            .setName('org_list')
            .setDescription('Pick or Enter an Organization SID')
            .addStringOption(option =>
                option.setName('organization')
                .setRequired(true)
                .setDescription(`Lists out organization members.`)
                .addChoices(
                    { name: 'V0ID3', value: "V0ID3" }
                )
            )
    ),
    async execute (interaction) {
        await interaction.deferReply({ ephemeral: true });
        const inputs = interaction.options._hoistedOptions
        const member = interaction.member;
        const approvalRanks = config[botIdent().activeBot.botName].rsiinfo
        const approvalRanks_string = approvalRanks.map(rank => rank.rank_name).join(', ').replace(/,([^,]*)$/, ', or$1');
        if (hasSpecifiedRole(member, approvalRanks) == 0) {
            botLog(interaction.guild,new Discord.EmbedBuilder()
            .setDescription(`${interaction.member.nickname} does not have access. Requires ${approvalRanks_string}`)
            .setTitle(`/rsiinfo ${interaction.options.getSubcommand()}`)
            ,
            )
            await interaction.editReply({ content: `You do not have the roles to view this Command. Contact ${approvalRanks_string}`, ephemeral: true });
            return
        }
        if (interaction.options.getSubcommand() === 'org_list') {
            const rsi_response = await fetcher(`https://api.starcitizen-api.com/p9aHTOTpStpQGYFYUJmRaj1l6QmbZHGI/v1/auto/organization_members/${inputs[0].value}`)
            try {
                const member_info = []
                rsi_response.data.forEach(i => { 
                    member_info.push({
                        "citizen_handle": i.handle,
                        "citizen_display": i.display,
                        "rank": i.rank
                    })
                })
                const rankOrder = config.VOID3.general_stuff.allRanks.map(rank => rank.rank_name)
                const sorted_members = member_info.sort((a, b) => {
                    const rankComparison = rankOrder.indexOf(a.rank) - rankOrder.indexOf(b.rank);
                    if (rankComparison !== 0) {
                        return rankComparison;
                    }
                    return a.citizen_handle.localeCompare(b.citizen_handle);
                });
                
                let returnEmbed = new Discord.EmbedBuilder()
                .setTitle(`${botIdent().activeBot.communityName}`)
                .setAuthor({name: botIdent().activeBot.botName,iconURL: botIdent().activeBot.icon})
                .setThumbnail(botIdent().activeBot.icon)
    
                function thisRank(specified_rank,sorted_members) {
                    const array = sorted_members.filter(i => i.rank === specified_rank).map(member => member.citizen_handle)
                    const string = array.join(",").replace(/,/g, "\n")
                    return string.length > 0 ? string : "\u0020"
                }
                returnEmbed.addFields(
                    { name: `${rankOrder[0]}`, value: thisRank(`${rankOrder[0]}`,sorted_members) },
                    { name: `${rankOrder[1]}`, value: thisRank(`${rankOrder[1]}`,sorted_members) },
                    { name: `${rankOrder[2]}`, value: thisRank(`${rankOrder[2]}`,sorted_members) },
                    { name: `${rankOrder[3]}`, value: thisRank(`${rankOrder[3]}`,sorted_members) },
                    { name: `${rankOrder[4]}`, value: thisRank(`${rankOrder[4]}`,sorted_members) },
                    { name: `${rankOrder[5]}`, value: thisRank(`${rankOrder[5]}`,sorted_members) }
                    
                )
                
                const buttonRow = new Discord.ActionRowBuilder()
                .addComponents(new Discord.ButtonBuilder().setLabel('Show on RSI Website').setStyle(Discord.ButtonStyle.Link).setURL(`https://robertsspaceindustries.com/orgs/${inputs[0].value}/members`),)
                interaction.editReply({ embeds: [returnEmbed.setTimestamp()], components: [buttonRow] });
            }
            catch (e) {
                let returnEmbed = new Discord.EmbedBuilder()
                .setTitle(`${botIdent().activeBot.communityName}`)
                .setAuthor({name: botIdent().activeBot.botName,iconURL: botIdent().activeBot.icon})
                .setThumbnail(botIdent().activeBot.icon)
                .setDescription("starcitizen-api.com ERROR")
                .addFields(
                    { name: 'Message:', value: rsi_response.message }
                )
                
                const buttonRow = new Discord.ActionRowBuilder()
                .addComponents(new Discord.ButtonBuilder().setLabel('Show on RSI Website').setStyle(Discord.ButtonStyle.Link).setURL(`https://robertsspaceindustries.com/orgs/${inputs[0].value}/members`),)
                interaction.editReply({ embeds: [returnEmbed.setTimestamp()], components: [buttonRow] });
            }
        }
        if (interaction.options.getSubcommand() === 'citizen') {
            const rsi_response = await fetcher(`https://api.starcitizen-api.com/p9aHTOTpStpQGYFYUJmRaj1l6QmbZHGI/v1/auto/user/${inputs[0].value}`)
            try {
    
                const citizen_info = {
                    "organization": rsi_response.data.organization.name  != null ? rsi_response.data.organization.name : "No Main Org Found",
                    "rank": rsi_response.data.organization.rank != null ? rsi_response.data.organization.rank : "N/A",
                    "SID": rsi_response.data.organization.sid  != null ? rsi_response.data.organization.sid : "N/A" ,
                    "citizen_handle": rsi_response.data.profile.handle,
                    "citizen_id": rsi_response.data.profile.id.replace('#',''),
                    "enlisted": rsi_response.data.profile.enlisted
                }
    
                const returnEmbed = new Discord.EmbedBuilder()
                .setTitle('RSI User Information')
                .setAuthor({name: botIdent().activeBot.botName,iconURL: botIdent().activeBot.icon})
                .setThumbnail(botIdent().activeBot.icon)
                .addFields(
                    { name: "Citizen", value: citizen_info.citizen_handle + `#${citizen_info.citizen_id}` },
                    { name: "Organization", value: citizen_info.organization + ` (${citizen_info.SID})` },
                    { name: "Rank", value: citizen_info.rank },
                    { name: "Enlisted", value: citizen_info.enlisted }
                )
                
                const buttonRow = new Discord.ActionRowBuilder()
                .addComponents(new Discord.ButtonBuilder().setLabel('Show on RSI Website').setStyle(Discord.ButtonStyle.Link).setURL(`https://robertsspaceindustries.com/citizens/${inputs[0].value}`),)
                interaction.editReply({ embeds: [returnEmbed.setTimestamp()], components: [buttonRow] })
            }
            catch (e) {
                let returnEmbed = new Discord.EmbedBuilder()
                .setTitle(`${botIdent().activeBot.communityName}`)
                .setAuthor({name: botIdent().activeBot.botName,iconURL: botIdent().activeBot.icon})
                .setThumbnail(botIdent().activeBot.icon)
                .setDescription("starcitizen-api.com ERROR")
                .addFields(
                    { name: 'Message:', value: rsi_response.message }
                )
                
                const buttonRow = new Discord.ActionRowBuilder()
                .addComponents(new Discord.ButtonBuilder().setLabel('Show on RSI Website').setStyle(Discord.ButtonStyle.Link).setURL(`https://robertsspaceindustries.com/citizens/${inputs[0].value}`),)
                interaction.editReply({ embeds: [returnEmbed.setTimestamp()], components: [buttonRow] });
            }
        }
    }
}