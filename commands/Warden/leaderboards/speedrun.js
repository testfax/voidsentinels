const { botIdent, fileNameBotMatch } = require('../../../functions');
let speedRunDB = null;
try { speedRunDB  = require(`../../../${botIdent().activeBot.botName}/db/index`) }
catch (e) { speedRunDB = require(`../../../${fileNameBotMatch(e)}/db/index`) }
const Discord = require("discord.js");

// const { query } = require(`../../../Warden/db/index`);
// console.log(speedRunDB.query)

module.exports = {
    data: new Discord.SlashCommandBuilder()
	.setName('speedrun')
	.setDescription('Submit your speedrun attempt')
	.addStringOption(option => option.setName('variant')
		.setDescription('Thargoid Variant')
		.setRequired(true)
		.addChoices(
			{ name:'Cyclops', value:'cyclops' },
			{ name:'Basilisk', value:'basilisk' },
			{ name:'Medusa', value:'medusa' },
			{ name:'Hydra', value:'hydra' }
		))
    .addStringOption(option => option.setName('shipclass')
		.setDescription('Thargoid Variant')
		.setRequired(true)
        .addChoices(
			{ name: 'Small', value: 'small' },
			{ name: 'Medium', value: 'medium' },
			{ name: 'Large', value: 'large' }
		))
	.addStringOption(option => option.setName('ship')
		.setDescription('Ship Model eg: Anaconda, Krait Mk.II, etc')
		.setRequired(true))
    .addIntegerOption(option => option.setName('time')
		.setDescription('Time achieved in seconds')
		.setRequired(true))
	.addStringOption(option => option.setName('link')
		.setDescription('Include video link for proof (Please use shortened links)')
		.setRequired(true))
	.addUserOption(option => option.setName('user')
		.setDescription('Select a user to submit on behalf of')
		.setRequired(false))
	.addStringOption(option => option.setName('comments')
		.setDescription('Comment, banter, whatever')
		.setRequired(false)),
    // .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    permissions:0,
	async execute(interaction) {
		let args = {}
		let res;
		let user = interaction.member.id
		let timestamp = Date.now()
		let staffChannel = process.env.STAFFCHANNELID

        for (let key of interaction.options.data) {
            args[key.name] = key.value
        }

		// Checks
		if (!args.link.startsWith('https://')) { return interaction.reply({ content: `❌ Please enter a valid URL, eg: https://...` }) }
		if (args.user !== undefined) { user = args.user }
		let name = await interaction.guild.members.cache.get(user).nickname

		// Submit
		if(interaction.guild.channels.cache.get(staffChannel) === undefined)  { // Check for staff channel
			return interaction.reply({ content: `Staff Channel not found` })
		}
		try {
			res = await speedRunDB.query("INSERT INTO speedrun(user_id, name, time, class, ship, variant, link, approval, date) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)", [
				user,
				name,
				args.time,
				args.shipclass,
				args.ship,
				args.variant,
				args.link,
				false,
				timestamp
			])
		} catch (err) {
			console.log(err)
			return interaction.reply({ content: `Something went wrong creating a Submission, please try again or contact staff!` })
		}
		
		res = await speedRunDB.query(`SELECT id FROM speedrun WHERE date = $1`, [timestamp])

		// Print out data
		let submissionId = res.rows[0].id
		const returnEmbed = new Discord.EmbedBuilder()
		.setColor('#FF7100')
		.setTitle(`**Speedrun Submission Complete**`)
		.setDescription(`Congratulations <@${interaction.member.id}>, your submission is complete. Please be patient while our staff approve your submission. Submission ID: #${submissionId}`)
		.addFields(
		{name: "Pilot", value: `<@${user}>`, inline: true},
        {name: "Ship", value: `${args.ship}`, inline: true},
        {name: "Variant", value: `${args.variant}`, inline: true},
        {name: "Time", value: `${new Date(args.time * 1000).toISOString().substr(11, 8)}`, inline: true},
		{name: "Class", value: `${args.shipclass}`, inline: true},
		{name: "link", value: `${args.link}`, inline: true},
		{name: "Comments", value: `${args.comments}`, inline: true})
		interaction.reply({ embeds: [returnEmbed.setTimestamp()] });

		// Create staff interaction
		const staffEmbed = new Discord.EmbedBuilder()
		.setColor('#FF7100')
		.setTitle(`**New Speedrun Submission**`)
		.setDescription(`Please select Approve or Deny below if the video is legitimate and matches the fields below. NOTE: This will not assign any ranks, only approve to the Leaderboard.`)
		.addFields(
		{name: "Pilot", value: `<@${user}>`, inline: true},
        {name: "Ship", value: `${args.ship}`, inline: true},
        {name: "Variant", value: `${args.variant}`, inline: true},
        {name: "Time", value: `${new Date(args.time * 1000).toISOString().substr(11, 8)}`, inline: true},
		{name: "Class", value: `${args.shipclass}`, inline: true},
		{name: "link", value: `${args.link}`, inline: true},
		{name: "Comments", value: `${args.comments}`, inline: true})
		const row = new Discord.ActionRowBuilder()
        .addComponents(new Discord.ButtonBuilder().setCustomId(`submission-speedrun-approve-${submissionId}`).setLabel('Approve').setStyle(Discord.ButtonStyle.Success),)
        .addComponents(new Discord.ButtonBuilder().setCustomId(`submission-speedrun-deny-${submissionId}`).setLabel('Delete').setStyle(Discord.ButtonStyle.Danger),)
        await interaction.guild.channels.cache.get(staffChannel).send({ embeds: [staffEmbed], components: [row] });
    }
}