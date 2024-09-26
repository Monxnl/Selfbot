const P = require('pino')
const util = require('util')
const qr = require('qrcode')
const cp = require('child_process')
const baileys = require('@whiskeysockets/baileys')
const lopp = require('../src/love.js')
const face = require('../src/face.js')

async function startSock(authFolder) {
	const authState = await baileys.useMultiFileAuthState(authFolder)
	
	global.conn = baileys.default({
		auth: authState.state,
		logger: P({ level: 'silent' }),
		markOnlineOnConnect: false,
		printQRInTerminal: false,
	})
	
	conn.ev.on('creds.update', authState.saveCreds.bind(conn))
	
	conn.ev.on('connection.update', async (up) => {
		if (up.qr) {
			let qrcode = await qr.toDataURL(up.qr, { scale: 20 })
			global._qr = Buffer.from(qrcode.split`,`[1], 'base64')
		} else if (up.connection == 'close') startSock(authFolder)
		else if (up.connection == 'open') conn.user.jid = baileys.jidNormalizedUser(conn.user.id)
		console.log(up)
	})
	
	conn.ev.on('messages.upsert', async (message) => {
		if (message.type != 'notify') return // console.log(message)
		let m = message.messages[0]
		if (!m.message) return
		if (!m.key.fromMe) return
		m.id = m.key.id
		m.sentSource = m.id.startsWith('BAE5') && m.id.length == 16 ? 'baileys' : baileys.getDevice(m.id)
		if (m.sentSource == 'baileys') return
		m.type = Object.keys(m.message).find((type) => type !== 'senderKeyDistributionMessage' && type !== 'messageContextInfo')
		m.chat = m.key.remoteJid
		m.isGroup = baileys.isJidGroup(m.chat)
		m.sender = m.key.fromMe ? conn.user.jid : m.key.participant || m.participant || m.chat
		m.msg = m.message[m.type]?.message?.[Object.keys(m.message[m.type]?.message || [])[0]]?.caption || m.message[m.type]?.caption || m.message[m.type]?.text || m.message.conversation || ''
		m.context = m.message[m.type]?.message?.[Object.keys(m.message[m.type]?.message || [])[0]]?.contextInfo || m.message[m.type]?.contextInfo
		
		m.reply = (ctx, jid = '', opt = {}) => {
			if (typeof ctx == 'string') return conn.sendMessage(jid || m.chat, { text: ctx, ...opt }, { quoted: opt.quoted || m, ephemeralExpiration: m.context?.expiration, ...opt })
			if ('text' in ctx && typeof ctx.text !== 'string') ctx.text = util.inspect(ctx.text)
			return conn.sendMessage(jid || m.chat, ctx, { quoted: opt.quoted || m, ephemeralExpiration: m.context?.expiration, ...opt })
		}
		
		let _prefix = /\p{Emoji}|\p{Emoji_Presentation}/u
		let match = ([[_prefix.exec(m.msg), _prefix]]).find(c => c[1])
		let usedPrefix, noPrefix, command, args, text
		if ((usedPrefix = (match[0] || '')[0])) {
			noPrefix = m.msg.replace(usedPrefix, '')
			;[command, ...args] = noPrefix.trim().split` `.filter(v => v)
			command = (command || '').toLowerCase()
			args = args || []
			text = noPrefix.trim().split` `.slice(1).join` `
		}
		// console.log(m)
		if (/^>> /.test(m.msg)) {
			let o
			try {
				o = await eval(`(async () => { ${m.msg.replace(/^>> /, '')} })()`)
			} catch (e) {
				o = e
			} finally {
				m.reply({ text: util.format(o) })
			}
		} else if (/^[$] /.test(m.msg)) {
			let exec = util.promisify(cp.exec).bind(cp), o
			await m.reply({ text: 'Executing...' })
			try {
				o = await exec(m.msg.replace(/^[$] /, ''))
			} catch (e) {
				o = e
			} finally {
				if (o.stdout) m.reply({ text: o.stdout })
				if (o.stderr) m.reply({ text: o.stderr })
			}
		} else if (/^(stats)$/.test(command)) {
			let used = process.memoryUsage(), str = ''
			for (let key in used) str += `${key.replace(/^(\w)/, c => c.toUpperCase())}: ${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB\n`
			await m.reply({ text: str })
		} else if (/^(lope)|00$/.test(command)) {
			for (let x of lopp) {
			await conn.relayMessage(m.chat, { protocolMessage: { key: m.key, type: 14, editedMessage: { conversation: x.repeat(5) }}}, {})
			await baileys.delay(2000)
			}
		} else if (/^(lol)$/.test(command)) {
			for (let x of face) {
			await conn.relayMessage(m.chat, { protocolMessage: { key: m.key, type: 14, editedMessage: { conversation: x }}}, {})
			await baileys.delay(2000)
			}
		}
	})
	
	return conn
}

module.exports = startSock
