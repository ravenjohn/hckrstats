var mongo	= require('mongoskin'),
	config	= require(__dirname + '/../config/config').mongo_db;

module.exports = mongo.db('mongodb://'
		+ config.host
		+ ':'
		+ config.port
		+ '/'
		+ config.name,
	{native_parser : true});
