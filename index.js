/**
 * Changing the 'Type' variable to anything, but Null will result in "Dev" mode and the name of the bot being declared.
 */
//TEST DATA
let type = null;
// let type = "GuardianAI"
// let type = "Warden"

//! Modularity for codebase.
/**
 * @description The bot's "bot.user.username" is dictated by the Discord Dev Portal and the name of the bot you selected there. Not here.
 * @description Your responsibility is to name them appropriately. Extremely recommended to lable both the same.
 * @example       -The config.json file "botTypes[0].active" is determined by the 'hostname'.
 * @description   -Bot will fail to run if hostname does not match.
 * @description Dont place the main contents of the bot in a folder with the same name of the bot.
 * @example      - Use something like './warden.bot/' not ./warden/
 * @description  - Naming the bot root directory as the same name of the bot will cause it to fail hardcore.
 */
//! functions.js 
/**
 * @description  Houses all the ancilliary functions that the bot may need. 
 * @description  Keeps from hardcoding functions in multiple places that could otherwise be used in multiple places.
 */

//!config.json explaination
/**
 * @description Bot Name'd objects is the location that you put specific bot information to call from anywhere in your code.
 * @example 
 * {
 * 	"Warden": {},
 *  "GuardianAI": {},
 *  "botTypes" [] 
 * }
 */

//! botTypes: []
/**
 * @field      useGlobalCommands
 * @description - Allows the use of commands from any "active:false" bot.
 * @description - Within the './commands' folder you can cross load commands from an inactive bot to an active bot.
 * @description - GuardianAI is the botName
 * @description - path2 is the folder and command sets that you want to include
 * @description - ENSURE that you do not duplicate commands in the bots local folder and a globally attached folder
 * @example
 * "useGlobalCommands": ["GuardianAI.path2","GuardianAI.path1"]
 * @field       ignoreCommands:[]
 * @description - Within the './commands' folders tells the 'active' bot to ignore these folders in its subdirectories.
 * @description - Allows you to ingore command folders in the bots: './commands/someBot/sherrif/'
 * @example 
 * "ignoreCommands": ["sheriff","watch","reminder"]
 * 
 */

/**
 * @package.json Known issues
 * Upgrade node-fetch past version two will incure ES Module errors. node-fetch v3 is ES Module only.
 */

// Imported Modules
const { Client, IntentsBitField, EmbedBuilder, Collection, ActivityType, Partials } = require("discord.js")
const { REST } = require('@discordjs/rest')
const { Routes } = require('discord-api-types/v9')
const botFunc = require('./functions.js')
const cron = require('node-cron');
const fs = require('fs');
const path = require('path')
const colors = require('colors')

//Void3 variables for index.js
let void3_vars = {};


// Retrieve hostname so the bot knows where its being launched from.
//!! If you are running *NOT* running all bots from the SAME HOST. You'll have to come up with another solution on your own if you want to.
//!! Best case is to run it from a separate folder/repo if you want to do the same host. 
//!!      or make a map of the remaining code and run as a loop.
const os = require('os');

/**
 * @description Sets the config.json file in memory with "active:true" for the correct bot based on the hostname.
 * @description Loads the specific bot based on the hostname and annotates the mode (Dev/Prod) to the bot.
 * @description HOSTNAME is configured in the appropriate *.env file.
 * @param {string} hostname - The current hostname provided by os.hostname().
 * @param {string} BotName - The name of the bot for development purposes. Omit for PROD mode.
 * @param @type Declared on Line 2.
 * @returns {truthy/falsy}
 * @author testfax (Medi0cre) @testfax
 */
if (botFunc.adjustActive(os.hostname(),type)) {
	console.log("[STARTUP]".yellow,`${botFunc.botIdent().activeBot.botName}`.green,"Hostname Retrieved:".magenta,`${os.hostname()}`.yellow)
	mainOperation()
}
//Separated to provide control over execution during hostname retrieval.
function mainOperation(){ 
	// Start the bot with the correct .env
	require("dotenv").config({ path: `${botFunc.botIdent().activeBot.env}` });

	// Bot Determination
	// Local Modules determined by bot "active" state.
	// Specific bots need specific things, load them here.
	// if (botFunc.botIdent().activeBot.botName == 'Warden') {
	//     const leaderboardInteraction = require(`./${botFunc.botIdent().activeBot.botName}/interaction/submission.js`)
	// 	warden_vars[leaderboardInteraction] = leaderboardInteraction
	// 	const { query } = require(`./${botFunc.botIdent().activeBot.botName}/db`)
	// 	warden_vars[query] = query
		
	// }
	if (botFunc.botIdent().activeBot.botName == 'VOID3') {
		const database = require(`./${botFunc.botIdent().activeBot.botName}/db/database`)
		void3_vars = database
		
	}
	console.log("[STARTUP]".yellow, `${botFunc.botIdent().activeBot.botName}`.green,"Loading Commands:".magenta,"🕗")
	// Discord client setup
	const serverIntents = new IntentsBitField(3276799);
	const bot = new Client({ intents: serverIntents, partials: [Partials.Message, Partials.Channel, Partials.Reaction] })
	
	/**
	 * Loads command objects from the commands folder
	 * @author  (testfax) Medi0cr3 @testfax
	 */
	let commandsColl = bot.commands = new Collection()
	
	bot.on("ready", async() => {
		await botFunc.deployCommands(commandsColl,REST,Routes,bot);
		botFunc.botLog(bot,new EmbedBuilder().setDescription(`💡 ${bot.user.username} online! logged in as ${bot.user.tag}`).setTitle(`${bot.user.username} Online`),0);
		global.guild = bot.guilds.cache.first()
		
		// if (botFunc.botIdent().activeBot.botName == 'GuardianAI') {
		// 	// if (process.env.SOCKET_TOKEN) { require('./socket/taskManager.js') }
		// 	/**
		// 	* @description Socket Connection - Allows communication between Warden and GuardianAI. Gathers role information for GuardianAI.
		// 	*/
			
		// 	//Assigns the ActivityType (status) of the bot with the system name.
		// 	const currentSystem_sql = 'SELECT starSystem FROM `carrier_jump` ORDER BY id DESC LIMIT 1';
		// 	const currentSystem_response = await void3_vars.query(currentSystem_sql)
		// 	if (currentSystem_response.length > 0) {
		// 		let void3 = await guild.members.fetch({query: botFunc.botIdent().activeBot.botName, limit: 1})
		// 		void3 = void3.first()
		// 		void3.user.setActivity(`${currentSystem_response[0].starSystem}`, { type: ActivityType.Custom })
		// 	}
		// }
		// if (botFunc.botIdent().activeBot.botName == 'Warden') {
		// 	// Scheduled Role Backup Task
		// 	if(process.env.MODE == "PROD") {
		// 		cron.schedule('*/5 * * * *', function () {
		// 			backupClubRoles()
		// 		});
		// 		/**
		// 		 * Role backup system, takes the targetted role and table and backs up to SQL database.
		// 		 * @author  (Mgram) Marcus Ingram @MgramTheDuck
		// 		 */
		// 		async function backupClubRoles() {
		// 			let guilds = bot.guilds.cache.map((guild) => guild);
		// 			let guild = guilds[0]
		// 			await guild.members.fetch()
		// 			let members = guild.roles.cache.get('974673947784269824').members.map(m=>m.user)
		// 			try {
		// 				await warden_vars.query(`DELETE FROM club10`)
		// 			} catch (err) {
		// 				console.log(`Unable to delete rows from table`)
		// 				return;
		// 			}
		// 			for (let member of members) {
		// 				let name = await guild.members.cache.get(member.id).nickname
		// 				await warden_vars.query(`INSERT INTO club10(user_id, name, avatar) VALUES($1,$2,$3)`, [
		// 					member.id,
		// 					name,
		// 					member.avatar
		// 				])
		// 			}
		// 			console.log('Club 10 table updated')
		// 		}
		// 		// //the following part handles the triggering of reminders
		// 		// let minutes = 0.1, the_interval = minutes * 60 * 1000; //this sets at what interval are the reminder due times getting checked
		// 		// setInterval(async function() {
		// 		// 	let currentDate = new Date(Date.now());
			
		// 		// 	let res = await warden_vars.query("SELECT * FROM reminders WHERE duetime < $1", [currentDate]);
			
		// 		// 	if (res.rowCount == 0) return; //if there are no due reminders, exit the function
			
		// 		// 	for (let row = 0; row < res.rowCount; row++) { //send all
		// 		// 		const channel = await bot.channels.cache.get(res.rows[row].channelid);
		// 		// 		channel.send(`<@${res.rows[row].discid}>: ${res.rows[row].memo}`);
		// 		// 	}
			
		// 		// 	try {
		// 		// 		res = await warden_vars.query("DELETE FROM reminders WHERE duetime < $1", [currentDate]);
		// 		// 	} catch (err) {
		// 		// 		console.log(err);
		// 		// 	}
		// 		// }, the_interval);
		// 	}
		// 	// If socket token is configured, bot will try to run the task manager.
		// 	// if (process.env.SOCKET_TOKEN) { require('./socket/taskManager.js') }
		// 	/**
		//  	* @description Socket Connection - Allows communication between Warden and GuardianAI. Gathers role information for GuardianAI.
		//  	*/
		// }
		console.log("[STARTUP]".yellow,`${botFunc.botIdent().activeBot.botName}`.green,"Bot has Logged In:".magenta,'✅');
	})

	// Have the bot login
	function checkENV(item) {
		if (item) { return item}
		else { console.log("[ENV]".red,"ERROR".bgRed,"ENV file Malformed or Missing".yellow); return false }
	}
	if (checkENV(process.env.TOKEN)) { bot.login(process.env.TOKEN) }
	// General error handling
	process.on('uncaughtException', function (err) {
		const dateTime = botFunc.generateDateTime();
		console.log('[ERROR]'.red,`${dateTime} ⛔ Fatal error occured:`)
		console.error(err);
		bot.channels.cache.get(process.env.LOGCHANNEL).send({ content: `⛔ Fatal error experienced:\n ${err.stack}` })
	})
}
