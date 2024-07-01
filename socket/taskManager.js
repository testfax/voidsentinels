// const { io, Manager } = require('socket.io-client')
// const { botIdent } = require('../functions')
// const Discord = require("discord.js");

// const { socket } = require('./socketMain')
// const uuid = require('uuid');



// socket.on('fromSocketServer', async (data) => { 
//     console.log(`[SOCKET SERVER]`.blue, `${data.type}`.bgGreen, `${data.user.id}`.green)
//     if (data.type == 'roles_request') { //Server asks all servers in room
//         let identifiedUser = null
//         try {
//             identifiedUser = await guild.members.fetch(data.user.id)
//         }
//         catch (e) {
//             console.log(e)
//         }
//         if (identifiedUser) {
//             let roles = await identifiedUser.roles.cache.map(role => role.name)
//             roles = roles.filter(role=>role != '@everyone')
//             let rolesPackage = {
//                 type: "roles_return_data",
//                 person_asking: data.person_asking,
//                 from_server: guild.name,
//                 from_serverID: guild.id,
//                 requestor_socket: data.requestor_socket,
//                 user: { state: true, id: identifiedUser.id, roles: roles }
//             }
//             socket.emit('roles_return',rolesPackage)
//         }
//         else {
//             let rolesPackage = {
//                 type: "roles_return_data",
//                 person_asking: data.person_asking,
//                 from_server: guild.name,
//                 from_serverID: guild.id,
//                 requestor_socket: data.requestor_socket,
//                 user: { state: false, id: data.user.id, roles: ['unknown user'], }
//             }
//             socket.emit('roles_return',rolesPackage)
//         }
//     }
//     if (data.type == 'roles_return_data') { //Server responds to the requesting bot with the role information from any reply server..
//         let color = null
//         if (color = data.user.state == true) { color = "#87FF2A" } //green
//         else { color = "#FD0E35" } //red
//         const identifiedUser_requestor = await guild.members.fetch(data.person_asking)
//         const identifiedUser_subject = await guild.members.fetch(data.user.id)
//         const roles = Array.isArray(data.user.roles) ? data.user.roles.join(' \n') : data.user.roles
//         let discoveredUsername = null
//         identifiedUser_subject.nickname
//         if (identifiedUser_subject.nickname) { discoveredUsername = identifiedUser_subject.nickname }
//         else { discoveredUsername = identifiedUser_subject.user.globalName + "<> User has not changed their nickname '/nick'" }
//         const embed = new Discord.EmbedBuilder()
//             .setTitle('Role List Request')
//             .setAuthor({name: identifiedUser_requestor.nickname, iconURL: identifiedUser_requestor.user.displayAvatarURL({dynamic:true})})
//             .setThumbnail(botIdent().activeBot.icon)
//             .setColor(color)
//             .addFields(
//                 {name: "Server", value: data.from_server },
//                 {name: "Who", value: discoveredUsername },
//                 {name: "Roles Found", value: roles }
//             )
//         await guild.channels.cache.get(process.env.LOGCHANNEL).send({ embeds: [embed] })
//     }
// }) 


// const taskList = {
//     socket_joinRoom: async function(requestedRoom) {
//         return new Promise(async (resolve,reject) => {
//             try { socket.emit('joinRoom',requestedRoom, async (response) => { 
//                 resolve(response);
                
//              }); }
//             catch(error) { console.log(error); reject(error) }
//         })
//     },
//     socket_leaveRoom: async function(requestedRoom) {
//         return new Promise(async (resolve,reject) => {
//             try { socket.emit('leaveRoom',requestedRoom, async (response) => { 
//                 resolve(response);
               
//              }); }
//             catch(error) { console.log(error); reject(error) }
//         })
//     },
//     socket_rooms: async function(requestedRoom) { 
//         return new Promise(async (resolve,reject) => {
//             try { socket.emit('roomStatus',requestedRoom, async (response) => { 
//                 resolve(response);
//                 console.log("roomStatus:",response)
//              }); }
//             catch(error) { console.log(error); reject(error) }
//         })
//     },
//     requestInfo: async function(data) {
//         try {
//             const timerID = uuid.v4().slice(-5); 
//             console.time(timerID)
//             const botClient = botIdent().activeBot.botName
//             data = {...data, "botClient":botClient, "room": botIdent().activeBot.socketConfig.id, "requestor_socket": socket.id}
            
//             let discuss = socket.emit('eventTransmit',data, (response) => {
//                 if (response.event === "redisRequest") { 
//                     callback({response})
//                 }
//                 console.log(`[SOCKET SERVER - TASK MANAGER - '${data.event}']`.yellow)
//                 console.log("[TM]".green);
//                 console.timeEnd(timerID)
//                 console.log(response)
//                 // console.log(colorize(response, {pretty:true}))
                
//             return discuss;
//             });
//         }
//         catch(error) { console.log(error) }
//     },
    
// }
// module.exports = taskList