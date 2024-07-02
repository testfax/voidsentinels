const Discord = require("discord.js");
const { botIdent, fetcher, hasSpecifiedRole } = require('../../../functions');
const config = require('../../../config.json');


//Allow changes to ranks
let evaluateRolesStatus = 0
function checker(memberroles, rolesToCheck,type) {
    let found = null
    let containsAllRoles = null;
    if (type == 'Sentinel') { 
        containsAllRoles = rolesToCheck.some(role => memberroles.includes(role))
    }
    if (type == 'officerRanks') { 
        containsAllRoles = rolesToCheck.some(role => memberroles.includes(role))
    }
    found = containsAllRoles ? found = containsAllRoles : found = false
    return found
}
module.exports = {
    data: new Discord.SlashCommandBuilder()
    .setName('roleupdate')
	.setDescription('Checks RSI website for Org information and updates the discord roles appropriately')
    .setDefaultMemberPermissions(Discord.PermissionFlagsBits.Administrator)
    ,
    async execute (interaction) {
        await interaction.deferReply({ ephemeral: true });
        // const inputs = interaction.options._hoistedOptions
        const member = interaction.member;
        const approvalRanks = config[botIdent().activeBot.botName].roleupdate.roleupdate_authRanks
        const approvalRanks_string = approvalRanks.map(rank => rank.rank_name).join(', ').replace(/,([^,]*)$/, ', or$1');
        if (hasSpecifiedRole(member, approvalRanks) == 0) {
            botLog(interaction.guild,new Discord.EmbedBuilder()
            .setDescription(`${interaction.member.nickname} does not have access. Requires ${approvalRanks_string}`)
            .setTitle(`/roleupdate`)
            ,
            )
            await interaction.editReply({ content: `You do not have the roles to view this Command. Contact ${approvalRanks_string}`, ephemeral: true });
            return
        }

        // const member_channel = interaction.guild.channels.cache.get(config[botIdent().activeBot.botName].roleupdate.members_channel_test)
            
        // const lastMessage = await member_channel.messages.fetch({ limit: 1 })
        // if (lastMessage.size == 0) { 
        //     await member_channel.send({ embeds: [returnEmbed.setTimestamp()] })
        // }
        // if (lastMessage.size > 0) { 
        //     const receivedEmbed = lastMessage.last().embeds[0];
        //     // console.log(lastMessage.last().embeds[0])
        //     console.log(lastMessage.last().author.username)
        // }

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
            
            const roleMap = config[botIdent().activeBot.botName].general_stuff.onboarding_roles 
            const roles = roleMap.map(id => id.id)
            const allRolesMap = config[botIdent().activeBot.botName].general_stuff.allRanks
            const allRoles = allRolesMap.map(id => id.id)

            let discrepant_discord = []
            let sorted_discord_users = []

            sorted_members.forEach(member => {
                const foundMember = interaction.guild.members.cache.find(guildMember => guildMember.displayName === member.citizen_handle);
                if (!foundMember) {
                    discrepant_discord.push(member.citizen_handle)
                }
            })
            // console.log(discrepant_discord)

            interaction.guild.members.cache.each(async member => {
                if (!member.user.bot) {
                    // console.log("memberDisplayName:",member.displayName)
                    // console.log("memberID:",member.id)
                    // console.log("member roles:",member._roles)
                    // console.log("roles to check:",roles)
                    // //!Makes a list of people who dont have Sentinel in their roles.
                    let isSentinel = checker(member._roles,roles,'Sentinel')
                    let isOfficerRanks = checker(member._roles,allRoles,'officerRanks')
                    let org_cit_rank = null;
                    const badName = !sorted_members.find(i=>i.citizen_handle === member.displayName)
                    //!Makes a list of people 
                    
                    // console.log("TEST: isSentinel",isSentinel)
                    // console.log("TEST: isOfficerRanks",isOfficerRanks)
                    // console.log("Org Citizen Name:", sorted_members.find(i=>i.citizen_handle === member.displayName))
                    // console.log("BadName/NotInDiscord:", badName)
                    // console.log("++++++++++++++++++")


                    if (badName != true && sorted_members.find(i=>i.citizen_handle === member.displayName)) {
                        org_cit_rank = sorted_members.find(i=>i.citizen_handle === member.displayName).rank
                    }
                    if (!sorted_members.find(i=>i.citizen_handle === member.displayName)) {
                        //!Discord nickname does not match Citizen Handle
                        //Remove all roles from user that is not in the Org
                        // const discrepant_user = sorted_discord_users.find(i => i.memberDisplayName === member.displayName)
                        if (evaluateRolesStatus) { await member.roles.set([]) }
                    }

                    if (isSentinel == false && badName != true && org_cit_rank != null) {
                        if (isOfficerRanks == false) {
                            //Has Sentinel, but no officer ranks, give appropriate rank
                            if (evaluateRolesStatus) { await member.roles.add(allRolesMap.find(i => i.rank_name == org_cit_rank).id) }
                            // console.log("✔️ Promoted to:",org_cit_rank)
                        }
                        //Assign Sentinel, because they are in the Org, but dont have the role.
                        if (evaluateRolesStatus) { await member.roles.add(roleMap.find(i => i.rank_name == 'Sentinel').id) }
                        // console.log("✔️ Assigned Sentinel")
                    }
                    if (isSentinel == true && isOfficerRanks == true && badName != false && org_cit_rank != null) {
                        if (evaluateRolesStatus) { 
                            await member.roles.remove(allRoles)
                            await member.roles.add(allRolesMap.find(i => i.rank_name == org_cit_rank).id) 
                        }
                        // console.log("✔️ Updated Officer Roles")
                    }
                    if (isSentinel == true && isOfficerRanks == false && badName != false && org_cit_rank != null) {
                        if (evaluateRolesStatus) { await member.roles.add(allRolesMap.find(i => i.rank_name == org_cit_rank.rank).id) }
                        // console.log("✔️ Promoted to:",org_cit_rank.rank)
                    }
                    if (evaluateRolesStatus) { await member.roles.add(config[botIdent().activeBot.botName].general_stuff.onboarding_roles_dividers.map(i => i.id) ) }
                    // console.log("✔️ Dividers Assigned")

                    sorted_discord_users.push({
                        "memberDisplayName": member.displayName,
                        "isSentinel": isSentinel,
                        "isOfficerRanks": isOfficerRanks,
                        "org_citizen": sorted_members.find(i=>i.citizen_handle === member.displayName),
                        "badName": badName
                    })
                    // console.log("-------------")
                }
            })
            sorted_discord_users.forEach(user => {
                if (user.org_citizen && user.org_citizen.citizen_handle) {
                  user.org_citizen.citizen_handle = `${user.isSentinel ? ':white_check_mark:' : ':x:'} ${user.org_citizen.citizen_handle}`;
                }
            });
            function thisRank(specified_rank,sorted_discord_users) {
                const byRankArray = sorted_discord_users
                    .filter(user => user.org_citizen?.rank === specified_rank && user.badName != true)
                    .map(member => member.org_citizen.citizen_handle)
                const string = byRankArray.join(",").replace(/,/g, "\n")
                const final = string.length > 0 ? string : "\u0020"

                return final
            }
            function discrepant_discord_users(personnel) {
                personnel = personnel.map(i => `❌ \u200b ${i}`);
                personnel.push('Unverified Sentinels should ensure thier discord name matches their Star Citizen name and that Organization Membership is set to Visible. Type </verify:1257732436100382832>')
                const string = personnel.join(",").replace(/,/g, "\n")
                const final = string.length > 0 ? string : "\u0020"
                return final
            }
            function addMembers(newEmbed,RankOrder) {
                rankOrder.forEach(rank => {
                    newEmbed.addFields({ name: `ᐅ ${rank}`, value: thisRank(rank,sorted_discord_users) })
                })
                newEmbed.addFields(
                    { name: "Unverified Users", value: discrepant_discord_users(discrepant_discord) }
                )
                return newEmbed
            }
            let returnEmbed = new Discord.EmbedBuilder()
            .setTitle(`${botIdent().activeBot.communityName}`)
            .setAuthor({name: botIdent().activeBot.botName,iconURL: botIdent().activeBot.icon})
            .setThumbnail(botIdent().activeBot.icon)
            .setDescription("Verified Void Sentinels have full discord access.")

            
            const member_channel = interaction.guild.channels.cache.get(config[botIdent().activeBot.botName].roleupdate.members_channel_test)
            const lastMessage = await member_channel.messages.fetch({ limit: 1 })
            if (lastMessage.size == 0) { 
                addMembers(returnEmbed,rankOrder);
                await member_channel.send({ embeds: [returnEmbed.setTimestamp()] })
            }
            if (lastMessage.size > 0) { 
                const receivedEmbed = lastMessage.last().embeds[0]
                const oldEmbedSchema = {
                    title: receivedEmbed.title,
                    author: { name: lastMessage.last().author.username, iconURL: lastMessage.last().author.displayAvatarURL({ dynamic: true }) },
                    description: receivedEmbed.description,
                    fields: receivedEmbed.fields,
                    color: receivedEmbed.color
                }
                const newEmbed = new Discord.EmbedBuilder()
                    .setTitle(oldEmbedSchema.title)
                    .setDescription(oldEmbedSchema.description)
                    .setColor(oldEmbedSchema.color)
                    .setAuthor(oldEmbedSchema.author)
                    .setThumbnail(botIdent().activeBot.icon)
    
                    // oldEmbedSchema.fields.forEach((field, index) => {
                    //     newEmbed.addFields({ name: "Earned Experience Credit:", value: `derp`, inline: field.inline })
                    // })
                    addMembers(newEmbed,rankOrder);

                    //todo Add members with appropriate roles evaluations
                    const editedEmbed = Discord.EmbedBuilder.from(newEmbed)
                    await lastMessage.last().edit({ embeds: [editedEmbed] })
            }
            
            interaction.editReply({ content: 'Void Sentinels Discord updated with roles set on the RSI Website.' });
        }
        catch (e) {
            console.log(e)
            let returnEmbed = new Discord.EmbedBuilder()
            .setTitle(`${botIdent().activeBot.communityName}`)
            .setAuthor({name: botIdent().activeBot.botName,iconURL: botIdent().activeBot.icon})
            .setThumbnail(botIdent().activeBot.icon)
            .setDescription("starcitizen-api.com ERROR")
            .addFields( { name: 'Message:', value: rsi_response.message } )
            
            const buttonRow = new Discord.ActionRowBuilder()
            .addComponents(new Discord.ButtonBuilder().setLabel('Show on RSI Website').setStyle(Discord.ButtonStyle.Link).setURL(`https://robertsspaceindustries.com/orgs/V0ID3/members`),)
            interaction.editReply({ embeds: [returnEmbed.setTimestamp()], components: [buttonRow] });
        }
    }
}