const fetch = require('node-fetch')

function keepAlive() {
	let url = `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
	if (/(\/\/|\.)undefined\./.test(url)) return
	setInterval(() => fetch(url, { method: 'head' }).catch(console.log), 15 * 1000)
}

module.exports = keepAlive