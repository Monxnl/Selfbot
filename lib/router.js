const fs = require('fs')
const path = require('path')

let routes = {}
function scanRouter(app, directory /*= path.join(__dirname, '..', 'api')*/) {
	fs.readdirSync(directory, { withFileTypes: true }).forEach((entry) => {
		if (entry.isDirectory()) scanRouter(app, path.join(directory, entry.name))
		else if (entry.isFile() && entry.name.endsWith('.js')) {
			let file = require(path.join(directory, entry.name))
			routes[entry.name] = file
			if (entry.name == 'index.js') app.use('/', file)
			else app.use('/' + entry.name.split('.js')[0], file)
		}
	})
}

scanRouter.routes = routes
module.exports = scanRouter