var config         = require(__dirname + '/../config/config'),
    util           = require(__dirname + '/../helpers/util'),
    mongo          = require(__dirname + '/../lib/mongoskin'),
    logger         = require(__dirname + '/../lib/logger');


exports.teams = function (req, res, next) {
	var data = {},
		async_queue	= 0,

		start = function () {

			logger.log('info', 'Getting list of teams');

			mongo.collection('teams')
				.find()
				.sort({points : -1})
				.toArray(get_hackers);
		},

		get_hackers = function (err, result) {
			if (err) {
				logger.log('warn', 'Error on getting list of teams');
				return next(err);
			}

			data = result;

			logger.log('verbose', 'Getting hackers');

			async_queue = result.length;

			result.forEach(function (a, i) {
				mongo.collection('hackers')
					.find(
						{_id : {$in : a.hackers}},
						{
							_id : 0,
							name : 1,
							image : 1,
							username : 1
						}
					)
					.toArray(function (err, result) {
						data[i].hackers = result;
						send_response(err, result);
					});
			});
		},

		send_response = function (err, result) {
			if (err) {
				return next(err);
			}

			if (--async_queue === 0) {
				logger.log('info', 'Teams successfully retrieved');
				res.send(data);
			}
		};

	start();
};

