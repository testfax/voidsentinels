const Discord = require('discord.js');


module.exports = {
    data: new Discord.SlashCommandBuilder()
    .setName(`ranksubmissions`)
    .setDescription(`How to submit for ranks`),
    // .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    permissions:0,
    async execute (interaction) {
        const returnEmbed = new Discord.EmbedBuilder()
		.setColor('#FF7100')
		.setTitle("**How to Submit for Ranks**")
		.setImage('https://axicloud.blob.core.windows.net/public/images/km2_explosion.png')
		.setAuthor({ name: 'Anti-Xeno Initiative', iconURL: 'https://axicloud.blob.core.windows.net/public/images/AXI_Insignia_Hypen_128.png', url: 'https://antixenoinitiative.com' })
		.setDescription(`Once you have your evidence, either a screenshot or a video, you can post it in the #tea-and-medals channels, where it will be reviewed by staff.

**We ask you do not ping anyone to review your submission, it will be processed when possible.** If your submission was not processed within 48 hours, you are allowed to contact a staff member about it.

The proof has to be a **screenshot**, or a **video** (in some cases we may require a video), and has to clearly show the interceptor death explosion, the "bond received" message and other parts of ship UI such as the Ship Health and Radar.

For more information, please visit the AXI ranks page on our website: https://antixenoinitiative.com/ranks`)
        

        interaction.channel.send({ embeds: [returnEmbed] });
    }
}
