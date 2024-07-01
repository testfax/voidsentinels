const Discord = require("discord.js");
const { eventTimeValidate } = require('../../functions')

const config = require('../../config.json')

module.exports = {
    data: new Discord.SlashCommandBuilder()
    .setName(`timegen`)
    .setDescription(`Create a discord timestamp`)
    .addStringOption(option => 
        option.setName('name')
            .setDescription('Enter the name of the player')
            .setRequired(true)
    )
    ,
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true })
        let inputs = interaction.options._hoistedOptions
        
        const embed = new  Discord.EmbedBuilder()
            .setTitle('Custom Time')
            .setDescription('Created a discord timestamp from your chosen local time inputed.')
            .addFields(
                // {name: 'Your local time input:', value: timeValue, inline: true}
            )
        // await interaction.guild.channels.cache.find(c => c.id === interaction.channelId).send(`${time}`)
        await interaction.editReply({ content: `Action Complete`, embeds:[embed], ephemeral: true });
    }
}