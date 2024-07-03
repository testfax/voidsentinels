const Discord = require("discord.js");
const { botLog, botIdent, fetcher, hasSpecifiedRole } = require('../../../functions');
const config = require('../../../config.json')
const database = require(`../../../${botIdent().activeBot.botName}/db/database`)

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
                .setStyle(Discord.ButtonStyle.Success)
            )

        //Functional Code
        async function showVerificationModal(i, interaction, returnEmbed) {
            const fields = {
                nickChange: new Discord.TextInputBuilder()
                    .setCustomId(`nickchange`)
                    .setLabel(`Input your Star Citizen Handle`)
                    .setStyle(Discord.TextInputStyle.Short)
                    .setRequired(true)
                    .setPlaceholder(``),
                verifCode: new Discord.TextInputBuilder()
                    .setCustomId(`verifcode`)
                    .setLabel(`Input your Verification Code`)
                    .setStyle(Discord.TextInputStyle.Short)
                    .setRequired(true)
                    .setPlaceholder(``)

            }

            const modal = new Discord.ModalBuilder()
                .setCustomId('nickModal')
                .setTitle('Input Nick')
                .addComponents(
                    new Discord.ActionRowBuilder().addComponents(fields.nickChange),
                    new Discord.ActionRowBuilder().addComponents(fields.verifCode),
                )
            await i.showModal(modal);
            const submitted = await i.awaitModalSubmit({
                time: 1800000,
            }).catch(error => {
                console.error(error)
                return null
            })
            if (submitted) {
                const [nickChange,verifCode] = submitted.fields.fields.map(i => i.value)
                return [submitted, nickChange, verifCode]

            }
        }
        response = await interaction.followUp({ content: `Verification`, embeds: [returnEmbed.setTimestamp()], components: [buttonRow1,buttonRow2], ephemeral: true }).catch(console.error);
        const collector = response.createMessageComponentCollector({ componentType: Discord.ComponentType.Button, time: 604_800_000 });
        collector.on('collect', async i => {
            const selection = i.customId;
            collector.stop()
            if (selection == 'verify') {
                const modalResults = await showVerificationModal(i)
                // const modalResults = ["empty","Medi0cr3","bedffba8-103f-4480-bb99-7bf239d543a0"]
                console.log(modalResults[1],modalResults[2])
                const admin = await interaction.guild.members.fetch('194001098539925504')
                // const userObject = admin
                const userObject = await interaction.guild.members.fetch(modalResults[0].user.id)
                await i.deleteReply({ content: 'delete the original embed', embeds: [], components: [], ephemeral: true }).catch(console.error)
                await modalResults[0].reply({
                    content: 'Running Verification...',
                    embeds: [],
                    components: [],
                    ephemeral: true
                })
                
                let foundVerifCode = false;
                //Match Verification Code from Database
                try {
                    const search_values = [modalResults[2]]
                    const search_sql = 'SELECT * FROM `verifications` WHERE code = (?)'
                    const search_response = await database.query(search_sql, search_values)
                    if (search_response.length > 0) {
                        if (search_response[0].userId == userObject.id && search_response[0].code == modalResults[2]) {
                            foundVerifCode = true
                        }
                    }
                }
                catch(e) { 
                    console.log(e) 
                    botLog(
                        interaction.guild,
                        new Discord.EmbedBuilder()
                        .setTitle(`UserID/Code Did not match assignee.`)
                        .addFields(
                            { name: ":x: Error Code", value: e }
                        ),
                        1
                    )
                    await modalResults[0].editReply({
                        content: `Database Failure, contact <@${admin}`,
                        embeds: [],
                        components: [],
                        ephemeral: true
                    })
                }
                
                if (foundVerifCode) {
                    //Call org API
                    try {
                        // const rsi_response = await fetcher(`https://api.starcitizen-api.com/p9aHTOTpStpQGYFYUJmRaj1l6QmbZHGI/v1/live/organization_members/V0ID3`)
                        const rsi_response = config[botIdent().activeBot.botName].general_stuff.testServer.testOrg

                        //Update Discord
                        try {
                            let evaluateRolesStatus = 1

                            const member_info = []
                            rsi_response.data.forEach(i => { 
                                member_info.push({
                                    "citizen_handle": i.handle,
                                    "citizen_display": i.display,
                                    "rank": i.rank,
                                    "roles": i.roles
                                })
                            })
                            const rankOrder = config[botIdent().activeBot.botName].general_stuff.allRanks.map(rank => rank.rank_name)
                                
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
                            const orgRolesMap = config[botIdent().activeBot.botName].roleupdate.org_roles
                            const orgRoles = orgRolesMap.map(id => id.id)
                            const org_removalRoles = allRoles.concat(orgRoles)
                            let success = true; 
                            let checklist = {
                                "state": sorted_members.some(i=>i.citizen_handle.toLowerCase() === modalResults[1].toLowerCase()),
                                "userId": userObject.id
                            }
                            let discord_user_list = guild.members.cache
                                .filter(member => !member.user.bot)
                                .map(member => member.displayName.toLowerCase());
                            if (discord_user_list.includes(modalResults[1].toLowerCase())) {
                                console.log("Duplicate Name");
                                await modalResults[0].editReply({
                                    content: `❌ Duplicate Citizen Handle, Verification Failed`,
                                    embeds: [],
                                    components: [],
                                    ephemeral: true
                                })
                                botLog(
                                    interaction.guild,
                                    new Discord.EmbedBuilder()
                                    .setTitle(`Duplicate Citizen Handle`)
                                    .addFields(
                                        { name: "User", value: `<@${userObject.id}>`},
                                        { name: "Handle Requested", value: modalResults[1] }
                                    ),
                                    2
                                )
                                return
                            }

                            let discrepant_discord = []
                            let sorted_discord_users = []

                            sorted_members.forEach(member => {
                                const foundMember = guild.members.cache.find(guildMember => guildMember.displayName === member.citizen_handle);
                                if (!foundMember) {
                                    discrepant_discord.push(member.citizen_handle)
                                }
                            })
                            const promises = guild.members.cache.map(async member => {
                                if (!member.user.bot) {
                                    if (evaluateRolesStatus == 0) { console.log("memberDisplayName:",member.displayName) }
                                    // //!Makes a list of people who dont have Sentinel in their roles.
                                    // let isSentinel = checker(member._roles,roles,'Sentinel')
                                    let isSentinel = sorted_members.some(i=>i.citizen_handle === member.displayName)
                                    // let isOfficerRanks = checker(member._roles,allRoles,'officerRanks')
                                    // let isOrgRoles = checker(member._roles,orgRoles,'isOrgRoles')
                                    let org_cit_rank = null;
                                    let org_cit_rolesMap = null;
                                    let org_cit_roleIds = null;
                                    let badName = !sorted_members.some(i=>i.citizen_handle === member.displayName)
                                    
                                    if (checklist.state && checklist.userId == member.id) { 
                                        // console.log("Checklist:",checklist)
                                        badName = false 
                                        citizen_handle = sorted_members.find(i=>i.citizen_handle.toLowerCase() === modalResults[1].toLowerCase()).citizen_handle
                                        // console.log("--",citizen_handle)
                                        org_cit_rank = sorted_members.find(i=>i.citizen_handle.toLowerCase() === modalResults[1].toLowerCase()).rank
                                        // console.log("--",org_cit_rank)
                                        org_cit_rolesMap = sorted_members.find(i=>i.citizen_handle.toLowerCase() === modalResults[1].toLowerCase()).roles
                                        // console.log("--",org_cit_rolesMap)
                                        org_cit_roleIds = org_cit_rolesMap.map(roleName => {
                                            const role = orgRolesMap.find(role => role.rank_name === roleName);
                                            return role ? role.id : null;
                                        });
                                        
                                        isSentinel = true
                                    }
                                    
                                    if (checklist.state != true && badName != true && sorted_members.find(i=>i.citizen_handle === member.displayName)) {
                                        citizen_handle = sorted_members.find(i=>i.citizen_handle === member.displayName).citizen_handle
                                        org_cit_rank = sorted_members.find(i=>i.citizen_handle === member.displayName).rank
                                        org_cit_rolesMap = sorted_members.find(i=>i.citizen_handle === member.displayName).roles
                                        org_cit_roleIds = org_cit_rolesMap.map(roleName => {
                                            const role = orgRolesMap.find(role => role.rank_name === roleName);
                                            return role ? role.id : null;
                                        });
                                    }

                                    //!Makes a list of people
                                    if (evaluateRolesStatus == 0) {
                                        console.log("TEST: isSentinel",isSentinel)
                                        console.log("BadName/NotInDiscord:", badName)
                                        console.log("++++++++++++++++++")
                                    }


                                    if (badName) {
                                        //!Discord nickname does not match Citizen Handle
                                        //Remove all roles from user that is not in the Org
                                        // const discrepant_user = sorted_discord_users.find(i => i.memberDisplayName === member.displayName)
                                        if (evaluateRolesStatus == 1) {
                                            const rolesToRemove = org_removalRoles.concat(roleMap.find(i => i.rank_name == 'Sentinels').id,roleMap.find(i => i.rank_name == 'Guest').id)
                                            await member.roles.remove(rolesToRemove);
                                        }
                                        if (evaluateRolesStatus == 0) { 
                                            console.log("❌ Discord nickname does not match Citizen Handle")
                                        }
                                        if (member.id == userObject.id) {
                                            success = false
                                            botLog(
                                                interaction.guild,
                                                new Discord.EmbedBuilder()
                                                .setTitle(`User Verification Failure`)
                                                .addFields(
                                                    { name: "User", value: `<@${userObject.id}>`},
                                                    { name: "Star Citizen Handle", value: "Mismatch" }
                                                ),
                                                2
                                            )
                                            await modalResults[0].editReply({
                                                content: `:x: Star Citizen Handle does not match Org List.`,
                                                embeds: [],
                                                components: [],
                                                ephemeral: true
                                            })
                                        }
                                    }
                                    
                                    if (isSentinel == true && badName != true && org_cit_rank != null) {
                                        if (evaluateRolesStatus == 1) {
                                            await member.roles.remove(org_removalRoles.concat(roleMap.find(i => i.rank_name == 'Guest').id))
                                            await member.roles.add(
                                                org_cit_roleIds.concat(
                                                    allRolesMap.find(i => i.rank_name == org_cit_rank).id,
                                                    roleMap.find(i => i.rank_name == 'Sentinel').id
                                                )
                                            )
                                            await member.setNickname(citizen_handle)
                                        }
                                        if (evaluateRolesStatus == 0) { 
                                            console.log("✔️ Assigned Sentinel")
                                            console.log("✔️ Promoted to:",org_cit_rank)
                                            console.log("✔️ Assigned Org Roles:",org_cit_rolesMap)
                                            console.log("✔️ Discord Name Changed to:",citizen_handle)
                                        }
                                    }
  
                                    if (evaluateRolesStatus == 1){ 
                                        await member.roles.add(config[botIdent().activeBot.botName].general_stuff.onboarding_roles_dividers.map(i => i.id) ) 
                                    }
                                    if (evaluateRolesStatus == 0) { console.log("✔️ Dividers Assigned"); console.log("-------------") }
                                    
                                    sorted_discord_users.push({
                                        "memberDisplayName": member.displayName,
                                        "isSentinel": isSentinel,
                                        "org_citizen": sorted_members.find(i=>i.citizen_handle === member.displayName),
                                        "badName": badName
                                    })
                                    console.log(sorted_discord_users.length)
                                }
                            })
                            await Promise.all(promises);

                            sorted_discord_users.forEach(user => {
                                if (user.org_citizen && user.org_citizen.citizen_handle) {
                                user.org_citizen.citizen_handle = `${user.isSentinel ? ':white_check_mark:' : ':x:'} ${user.org_citizen.citizen_handle}`;
                                }
                            })
                            
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

                            const member_channel = guild.channels.cache.get(config[botIdent().activeBot.botName].roleupdate.members_channel)
                            const embedMessage = await member_channel.messages.fetch({ after: '0', limit: 1 })
                            if (embedMessage.size == 0) { 
                                addMembers(returnEmbed,rankOrder);
                                await member_channel.send({ embeds: [returnEmbed.setTimestamp()] })
                            }
                            if (embedMessage.size > 0) { 
                                const receivedEmbed = embedMessage.first().embeds[0]
                                const oldEmbedSchema = {
                                    title: receivedEmbed.title,
                                    author: { name: embedMessage.first().author.username, iconURL: embedMessage.first().author.displayAvatarURL({ dynamic: true }) },
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
                                    .setTimestamp()
                    
                                // oldEmbedSchema.fields.forEach((field, index) => {
                                //     newEmbed.addFields({ name: "Earned Experience Credit:", value: `derp`, inline: field.inline })
                                // })
                                addMembers(newEmbed,rankOrder);

                                const editedEmbed = Discord.EmbedBuilder.from(newEmbed)
                                await embedMessage.first().edit({ embeds: [editedEmbed] })
                            }
                            
                            if (success) { modalResults[0].editReply({ content: '✔️ Verification Completed, welcome Sentinel' }) }
                        }
                        catch (e) {
                            console.log(e)
                            botLog(
                                interaction.guild,
                                new Discord.EmbedBuilder()
                                .setTitle(`verification code failure`)
                                .addFields(
                                    { name: "User", value: `<@${userObject.id}>`},
                                    { name: "Error Code", value: e }
                                ),
                                2
                            )
                            let returnEmbed = new Discord.EmbedBuilder()
                            .setTitle(`${botIdent().activeBot.communityName}`)
                            .setAuthor({name: botIdent().activeBot.botName,iconURL: botIdent().activeBot.icon})
                            .setThumbnail(botIdent().activeBot.icon)
                            .setDescription("starcitizen-api.com ERROR")
                            .addFields( { name: 'Message:', value: rsi_response.message } )

                            interaction.editReply({ embeds: [returnEmbed.setTimestamp()] });

                            await modalResults[0].editReply({
                                content: `:x:  verification code failure contact ${admin}, ${e}`,
                                embeds: [],
                                components: [],
                                ephemeral: true
                            })
                        }
                        //!modalResults[0].editReply({ content: 'Verification Completed, welcome Sentinel' })
                    }
                    catch (e) {
                        console.log(e)
                        botLog(
                            interaction.guild,
                            new Discord.EmbedBuilder()
                            .setTitle(`https://api.starcitizen-api.com/ Failure`)
                            .addFields(
                                { name: ":x: Error Code", value: e }
                            ),
                            1
                        )
                        await i.deleteReply({ content: 'Fail', embeds: [], components: [], ephemeral: true }).catch(console.error)
                        await modalResults[0].reply({
                            content: `:x: API Server Internal Error, contact ${admin}, ${e}`,
                            embeds: [],
                            components: [],
                            ephemeral: true
                        })
                    }
                }
                else {
                    botLog(
                        interaction.guild,
                        new Discord.EmbedBuilder()
                            .setTitle(`User Entry Verification Code Failure`)
                            .addFields(
                                { name: "Citizen", value: `<@${userObject.id}>` },
                                { name: "Entered Code", value: modalResults[2] }
                            ),
                        2
                    )
                    await modalResults[0].editReply({
                        content: `:x: Verification Userid/Code Mismatch!`,
                        embeds: [],
                        components: [],
                        ephemeral: true
                    })
                }
            }
        });
    }
}