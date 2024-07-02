const Discord = require("discord.js");
// const Redis = require('ioredis');
// const redis = new Redis({
//   port: 6379,
//   host: '127.0.0.1',
// });
const uuid = require("uuid")
const { botLog, botIdent, hasSpecifiedRole } = require('../../../functions');
const config = require('../../../config.json');
const { randomUUID } = require("crypto");
const database = require(`../../../${botIdent().activeBot.botName}/db/database`)

module.exports = {
    data: new Discord.ContextMenuCommandBuilder()
        .setName("Send Verificaiton Code")
        .setType(Discord.ApplicationCommandType.User),
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true })
        // const inputs = interaction.options._hoistedOptions
        const member = interaction.member;

        const approvalRanks = config[botIdent().activeBot.botName].general_stuff.sendVerificationCode
        const approvalRanks_string = approvalRanks.map(rank => rank.rank_name).join(', ').replace(/,([^,]*)$/, ', or$1');
        if (hasSpecifiedRole(member, approvalRanks) == 0) {
            botLog(
                interaction.guild,
                new Discord.EmbedBuilder()
                    .setDescription(`<@${member.id}> does not have access. Requires ${approvalRanks_string}`)
                    .setTitle(`Send Verification Code`),
                2
            )
            await interaction.editReply({ content: `You do not have the roles to view this Command. Contact ${approvalRanks_string}`, ephemeral: true });
            return
        }
        //--------------------------------------------------------------------------------------------------------------------------------
        

        const search_values = [interaction.targetUser.id]
        const search_sql = 'SELECT * FROM `verifications` WHERE userId = (?)'
        const search_response = await database.query(search_sql, search_values)
        let foundUserID = false;
        if (search_response.length > 0) { foundUserID = true }

        const verificationCode = randomUUID()
        const unixTimestamp = Math.floor(Date.now() / 1000)

        
        let returnEmbed = new Discord.EmbedBuilder()
            .setTitle(`${botIdent().activeBot.communityName} Verification`)
            .setColor('#f5bf42')
            .setAuthor({name: botIdent().activeBot.botName,iconURL: botIdent().activeBot.icon})
            .setThumbnail(botIdent().activeBot.icon)
            .addFields(
                { name: "Verification Code", value: '```' + verificationCode + '```' },
                { name: "Verification Process", value: 'Type `/verify` in any '+ `${botIdent().activeBot.communityName}` +' Discord channel.' }
            )
        //Insert new code to database
        let new_values = [
            unixTimestamp,
            verificationCode,
            interaction.targetUser.id,
            member.user.id
        ]
        const new_sql = `
            INSERT INTO verifications (
                unix,
                code,
                userId,
                recruiterId
            ) 
            VALUES (?,?,?,?);
        `
        if (!foundUserID) { await database.query(new_sql, new_values) }
        else {
            const update_values = [unixTimestamp,verificationCode,member.user.id]
            const update_sql = `
                UPDATE verifications
                SET unix = ?,code = ?,recruiterId = ?
                WHERE userId = ${interaction.targetUser.id};
            `;
            await database.query(update_sql, update_values)
        }
        //Send Verification Embed in a DM to user.
        await interaction.user.send({ embeds: [returnEmbed] })
        await interaction.editReply({
            content: `Verification Code Sent to <@${interaction.targetUser.id}>`
        })
        //Send admins a note that a recruiter sent a verification code.
        botLog(
            interaction.guild,
            new Discord.EmbedBuilder()
            .setTitle(`Verification Code Distributed`)
            .addFields(
                { name: "Distributed By", value: `<@${member.user.id}>` },
                { name: "Sent to", value: `<@${interaction.targetUser.id}>` }
            ),
            1
        )
    }
}