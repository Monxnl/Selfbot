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
	
module.exports = r
