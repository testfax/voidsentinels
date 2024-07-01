const Discord = require("discord.js");
const { botIdent } = require('../../../functions')
module.exports = {
    data: new Discord.SlashCommandBuilder()
    .setName(`engineering`)
    .setDescription(`Information on engineering.`),
    // .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    permissions: 0,
    execute (interaction) {
        const returnEmbed = new Discord.EmbedBuilder()
        .setTitle('Resources on Engineering')
        .setAuthor({name: botIdent().activeBot.botName,iconURL: botIdent().activeBot.icon})
        .setThumbnail("https://edassets.org/static/img/engineers/Engineer_icon.png")
        .addFields(
            {name: "ED Materials", value: "https://www.edmaterials.app\nComprehensive guide on where and how to farm engineering materials. This is the single best resource for engineering." },
            {name: "AX Engineer Unlock Guide", value: "https://wiki.antixenoinitiative.com/en/Unlocking-Engineers\nAXI's guide for unlocking engineers and how to engineer."},
            {name: "Engineering and Module Unlock Costs", value: "https://inara.cz/elite/techbroker/\nList of module unlock costs and engineering roll costs."},
            {name: "AXI Odyssey Engineering", value: "https://wiki.antixenoinitiative.com/en/engineering-odyssey\nAXI's guide to odyssey engineering materials."},
            {name: "AXI Horizons Engineering", value: "https://wiki.antixenoinitiative.com/en/engineering\nAXI's engineering material guide."},
            {name: "AXI Synthesis Calculator", value: "https://wiki.antixenoinitiative.com/en/synthesis\nInfo on AX synth costs."},
        )
        interaction.reply({embeds: [returnEmbed.setTimestamp()]})
    }
}
