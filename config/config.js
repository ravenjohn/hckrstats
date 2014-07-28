var config = {
		testing : {
		},
		development : {
			env : 'development',
			port : 666,
			mongo_db : {
				host : 'localhost',
				port : 27017,
				name : 'hckrstats'
			}
		},
		staging : {
		},
		production : {
		}
	};


// set development as default environment
!process.env['NODE_ENV'] && (process.env['NODE_ENV'] = 'development');
config = config[process.env['NODE_ENV']];

module.exports = config;
