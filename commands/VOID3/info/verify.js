const Discord = require("discord.js");
const { botIdent,fetcher, hasSpecifiedRole } = require('../../../functions');
const config = require('../../../config.json')


module.exports = {
    data: new Discord.SlashCommandBuilder()
    .setName('verify')
	.setDescription('Checks RSI website for user information')
    ,
    async execute (interaction) {
        await interaction.deferReply({ ephemeral: true });
        const inputs = interaction.options._hoistedOptions
        const member = interaction.member;

        let returnEmbed = new Discord.EmbedBuilder()
            .setTitle(`${botIdent().activeBot.communityName} Verification`)
            .setAuthor({name: botIdent().activeBot.botName,iconURL: botIdent().activeBot.icon})
            .setThumbnail(botIdent().activeBot.icon)
            .setDescription("How to verify and information.")
            .addFields(
                { name: "Discord Nickname", value: "Your Discord Nickname *MUST* match your Star Citizen Handle verbatim CASE SENSITIVE. Click the `Start Verification` Button."},
                { name: "Public Test Universe", value: "Under this Account Setting, you will be able to modify your SC ingame Handle and your Community Monikier (see below)"},
                { name: "Star Citizen Handle", value: "Your SC handle can be changed only one time. This Handle is what is visible inside the game." },
                { name: "Star Citizen Community Moniker", value: "This is the displayed name when being viewed on the RSI website for Spectrum/Organization Pages" },
                { name: "Verification Process", value: "V0ID3 Bot matches what is on the Publically visible Organization Page and sets roles as appropriate. Members should ensure that their Discord Nickname matches thier In Game handle."},
            )
        const buttonRow1 = new Discord.ActionRowBuilder()
            .addComponents(new Discord.ButtonBuilder().setLabel('Visit my RSI Account Settings').setStyle(Discord.ButtonStyle.Link).setURL(`https://robertsspaceindustries.com/account/settings`))
        const buttonRow2 = new Discord.ActionRowBuilder()
        .addComponents(
            new Discord.ButtonBuilder()
            .setCustomId('verify')
            .setLabel('Start Verification')
            .setStyle(Discord.ButtonStyle.Success))
            
            //Functional Code
            async function showNickChange(i, interaction, returnEmbed) {
                const fields = {
                    reason: new Discord.TextInputBuilder()
                        .setCustomId(`nickchange`)
                        .setLabel(`Input your Star Citizen Handle`)
                        .setStyle(Discord.TextInputStyle.Short)
                        .setRequired(true)
                        .setPlaceholder(``)
                }

                const modal = new Discord.ModalBuilder()
                    .setCustomId('nickModal')
                    .setTitle('Input Nick')
                    .addComponents(
                        new Discord.ActionRowBuilder().addComponents(fields.reason),
                    )
                await i.showModal(modal);
                const submitted = await i.awaitModalSubmit({
                    time: 1800000,
                }).catch(error => {
                    console.error(error)
                    return null
                })
                if (submitted) {
                    const [reason] = submitted.fields.fields.map(i => i.value)
                    return [submitted, reason]

                }
            }
            response = await interaction.followUp({ content: `Nickname Verification`, embeds: [returnEmbed.setTimestamp()], components: [buttonRow1,buttonRow2], ephemeral: true }).catch(console.error);
            const collector = response.createMessageComponentCollector({ componentType: Discord.ComponentType.Button, time: 604_800_000 });
            collector.on('collect', async i => {
                const selection = i.customId;
                collector.stop()
                if (selection == 'verify') {
                    const modalResults = await showNickChange(i)
                    const userObject = await interaction.guild.members.fetch(modalResults[0].user.id)
                    const admin = await interaction.guild.members.fetch('194001098539925504')
                    await i.deleteReply({ content: 'Running Verification...', embeds: [], components: [], ephemeral: true }).catch(console.error)
                    try {
                        const rsi_response = await fetcher(`https://api.starcitizen-api.com/p9aHTOTpStpQGYFYUJmRaj1l6QmbZHGI/v1/live/organization_members/V0ID3`)
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
                            const namePresentInOrgList = sorted_members.some(name => 
                                name.citizen_handle === modalResults[1] ? name.citizen_handle === modalResults[1] : false
                            )
                            //todo IF name is present in org list, then check the verification code against user.
                            //todo Once code is verified, roll through with updating the members list in discord.
  



                            // await userObject.setNickname(modalResults[1])
                            await modalResults[0].reply({
                                content: `Verification Complete`,
                                embeds: [],
                                components: [],
                                ephemeral: true
                            })
                        }
                        catch (e) {
                            await modalResults[0].reply({
                                content: `:x:Verification Failed, contact ${admin}, ${e}`,
                                embeds: [],
                                components: [],
                                ephemeral: true
                            })
                        }
                        
                        
                        
                    }
                    catch (e) {
                        await i.deleteReply({ content: 'Fail', embeds: [], components: [], ephemeral: true }).catch(console.error)
                        await modalResults[0].reply({
                            content: `:x: Internal Error, contact ${admin}, ${e}`,
                            embeds: [],
                            components: [],
                            ephemeral: true
                        })
                    }
                    
                }
                
            });
        interaction.editReply({ content: 'Verification Completed, welcome Sentinel' });
    }
}