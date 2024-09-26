const express = require('express')

const r = express.Router()
	.use('/file', express.static('tmp'))
	.get('/', (_, res) => res.json({ message: 'Hello World' }))
	.get('/qr', async (_, res) => {
		if (global._qr) {
			await res.type('.jpg').send(global._qr)
			delete global._qr
		} else res.redirect('/')
	})
	/*
	.get('/nowa', async (req, res) => {
		let q = req.query.number, regex = /x/g
		if (!q) return res.json({ message: 'Input parameter number' })
		if (!q.match(regex)) return res.json({ message: 'Parameter number must fill with one letter "x"' })
		
		let random = q.match(regex).length, total = Math.pow(10, random), arr = []
		for (let i = 0; i < total; i++) {
			let list = [...i.toString().padStart(random, '0')]
			let result = q.replace(regex, () => list.shift()).replace(/\D/g, '') + '@s.whatsapp.net'
			if (((await conn.onWhatsApp(result))[0] || {}).exists) {
				let info = await conn.fetchStatus(result).catch(_ => _)
				if (info.setAt) info.setAt = +info.setAt ? info.setAt : 'Invalid Date'
				arr.push({ jid: result, exists: true, ...info })
			} else arr.push({ jid: result, exists: false })
		}
		res.json(arr)
	})
	*/

module.exports = r
