var config         = require(__dirname + '/../config/config'),
    util           = require(__dirname + '/../helpers/util'),
    mongo          = require(__dirname + '/../lib/mongoskin');
    logger         = require(__dirname + '/../lib/logger'),


exports.get_by_id = function (req, res, next) {
	var data = {},
		async_queue = 0,

		start = function () {
			logger.log('info', 'Getting teams');

			mongo.collection('teams')
				.findOne(
					{_id : req.params.id},
					{_id : 0},
					get_hackers_and_stacks
				);
		},

		get_hackers_and_stacks = function (err, result) {
			var temp = 0;

			if (err) {
				return next(err);
			}

			data = result;

			result.hackathons.forEach(function (b, j) {
				logger.log('verbose', 'Getting tech stacks');
				temp += b.points;
				mongo.collection('tech_stacks')
					.find(
						{_id : {$in : b.tech_stacks}},
						{_id : 0}
					)
					.toArray(function (err, result) {
						data.hackathons[j].tech_stacks = result.map(function (a) {
							return a.name;
						});
					});

				logger.log('verbose', 'Getting hackathon');
				mongo.collection('hackathons')
					.findOne(
						{_id : b.hackathon_id},
						{
							_id : 0,
							portrait_image : 1,
							name : 1,
							date : 1
						},
						function (err, result) {
							data.hackathons[j].hackathon = result;
						}
					);
			});

			data.total_points = temp;
			data.total_hackathons = result.hackathons.length;

			logger.log('verbose', 'Getting hackers');
			mongo.collection('hackers')
				.find(
					{_id : {$in : result.hackers}},
					{
						_id : 0,
						name : 1,
						image : 1,
						username : 1,
						badges : 1
					}
				)
				.toArray(function (err, result) {
					data.hackers = result;

					logger.log('verbose', 'Getting badges');
					async_queue = result.length;
					result.forEach(function (b, j) {
						mongo.collection('badges')
							.find(
								{_id : {$in : b.badges}},
								{_id : 0}
							)
							.toArray(function (_err, _result) {
								data.hackers[j].badges = _result;
								send_response(err || _err);
							});
					});
				});
		},

		send_response = function (err) {
			if (err) {
				logger.log('warn', 'Error getting badges');
				return next(err);
			}

			if (--async_queue === 0) {
				logger.log('info', 'Teams successfully retrieved');
				res.send(data);
			}
		};

	start();
};

