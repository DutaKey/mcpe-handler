const {
	default: WASocket,
	DisconnectReason,
	useMultiFileAuthState,
	fetchLatestWaWebVersion,
} = require("@adiwajshing/baileys");
const Pino = require("pino");
const path = require("path").join;
const { Boom } = require("@hapi/boom");
const bedrock = require('bedrock-protocol')
const deathTranslations =  {
  'death.attack.anvil': `%1% was squashed by a falling anvil`,
  'death.attack.arrow': `%1% was shot by %2%`,
  'death.attack.bullet': `%1% was sniped by %2%`,
  'death.attack.cactus': `%1% was pricked to death`,
  'death.attack.drown': `%1% drowned`,
  'death.attack.explosion': `%1% blew up`,
  'death.attack.explosion.player': `%1% was blown up by %2%`,
  'death.attack.fall': `%1% hit the ground too hard`,
  'death.attack.fallingBlock': `%1% was squashed by a falling block`,
  'death.attack.fireball': `%1% was fireballed by %2%`,
  'death.attack.fireworks': `%1% went off with a bang`,
  'death.attack.flyIntoWall': `%1% experienced kinetic energy`,
  'death.attack.generic': `%1% died`,
  'death.attack.indirectMagic': `%1% was killed by %2% using magic`,
  'death.attack.inFire': `%1% went up in flames`,
  'death.attack.inWall': `%1% suffocated in a wall`,
  'death.attack.lava': `%1% tried to swim in lava`,
  'death.attack.lightningBolt': `%1% was struck by lightning`,
  'death.attack.magic': `%1% was killed by magic`,
  'death.attack.magma': `%1% discovered floor was lava`,
  'death.attack.mob': `%1% was slain by %2%`,
  'death.attack.onFire': `%1% burned to death`,
  'death.attack.outOfWorld': `%1% fell out of the world`,
  'death.attack.player': `%1% was slain by %2%`,
  'death.attack.spit': `%1% was spitballed by %2%`,
  'death.attack.starve': `%1% starved to death`,
  'death.attack.thorns': `%1% was killed trying to hurt %2%`,
  'death.attack.trident': `%1% was impaled to death by %2%`,
  'death.attack.wither': `%1% withered away`,
  'death.attack.freeze': `%1% froze to death`,
  'death.attack.stalactite': `%1% was skewered by a falling stalactite`,
  'death.attack.stalagmite': `%1% was impaled on a stalagmite`,
  'death.fell.accident.generic': `%1% fell from a high place`,
}
const client = bedrock.createClient({
  host: 'play.rpla.my.id',
  username: 'MyBot',
  offline: true
})
const id = '6281528972549-1587997619@g.us'

const connect = async () => {
	const { state, saveCreds } = await useMultiFileAuthState(path("./session"));
	let { version, isLatest } = await fetchLatestWaWebVersion();
	console.log(`Using: ${version}, newer: ${isLatest}`);
	const sock = WASocket({
		printQRInTerminal: true,
		auth: state,
		logger: Pino({ level: "silent" }),
		version,
	});
	// creds.update
	sock.ev.on("creds.update", saveCreds);

	// connection.update
	sock.ev.on("connection.update", async (up) => {

		const { lastDisconnect, connection } = up;
		if (connection) {
			console.log("Connection Status: ", connection);
		}

		if (connection === "close") {
			let reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
			if (reason === DisconnectReason.badSession) {
				console.log(`Bad Session File, Please Delete ${session} and Scan Again`);
				sock.logout();
			} else if (reason === DisconnectReason.connectionClosed) {
				console.log("Connection closed, reconnecting....");
				connect();
			} else if (reason === DisconnectReason.connectionLost) {
				console.log("Connection Lost from Server, reconnecting...");
				connect();
			} else if (reason === DisconnectReason.connectionReplaced) {
				console.log("Connection Replaced, Another New Session Opened, Please Close Current Session First");
				sock.logout();
			} else if (reason === DisconnectReason.loggedOut) {
				console.log(`Device Logged Out, Please Delete ${session} and Scan Again.`);
				sock.logout();
			} else if (reason === DisconnectReason.restartRequired) {
				console.log("Restart Required, Restarting...");
				connect();
			} else if (reason === DisconnectReason.timedOut) {
				console.log("Connection TimedOut, Reconnecting...");
				connect();
			} else {
				sock.end(`Unknown DisconnectReason: ${reason}|${lastDisconnect.error}`);
			}
		}
	});
  
  function userCorrection(packet) {
    let result = deathTranslations[packet.message]
  
    if (packet.parameters.length > 1 && !packet.parameters[1].startsWith("%") && !packet.parameters[1].endsWith(".name")) {
        return result.replace("%1%", packet.parameters[1]).replace("%2%", packet.parameters[0])
    } else if (packet.parameters.length > 1 && packet.parameters[1].startsWith("%") && packet.parameters[1].endsWith(".name")) {
        return result.replace("%1%", packet.parameters[0]).replace("%2%", packet.parameters[1]).replace("%entity.", "").replace(".name", "").replace("_", " ").replace("_v2", "")
      } else {
        return result.replace("%1%", packet.parameters[0])
      }
    }
    
    client.on('text', (packet) => { // Listen for chat messages and echo them back.
      if (packet.type === "translation") {
        if (!packet.message.startsWith("death")) {
            if (packet.message.endsWith("joined")) {
              sock.sendMessage(id, { text: packet.parameters +' Join The Server!' })
            } else { 
              sock.sendMessage(id, { text: packet.parameters +' Left!' })
            }
        } else {
          sock.sendMessage(id, { text: userCorrection(packet) })
        }
      }
    })
};
connect();















