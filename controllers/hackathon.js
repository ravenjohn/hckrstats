var config         = require(__dirname + '/../config/config'),
    util           = require(__dirname + '/../helpers/util'),
    mongo          = require(__dirname + '/../lib/mongoskin');
    logger         = require(__dirname + '/../lib/logger'),


exports.get_list = function (req, res, next) {
	var start = function () {

			logger.log('info', 'Getting list of hackathons');

			mongo.collection('hackathons')
				.find({}, {
					landscape_image : 1,
					name : 1,
					date : 1,
					total_teams : 1,
					external_link : 1
				})
				.sort({start_date : -1})
				.toArray(send_response);
		},

		send_response = function (err, result) {
			if (err) {
				logger.log('warn', 'Error on getting list of hackathons');
				return next(err);
			}

			logger.log('info', 'Successfully retrieved list of hackathons');
			res.send(result);
		};

	start();
};


exports.get_by_id = function (req, res, next) {
	var data = {},
		async_queue = 0,

		start = function () {

			logger.log('info', 'Getting hackathon with id', req.params.id);

			mongo.collection('hackathons')
				.findOne(
					{_id : req.params.id},
					{
						portrait_image : 1,
						name : 1,
						description : 1,
						theme : 1,
						date : 1,
						total_teams : 1,
						external_link : 1,
						judges : 1,
						sponsors_and_partners : 1
					},
					get_judges_teams_sponsors
				);
		},

		get_judges_teams_sponsors = function (err, result) {
			var i;

			if (err) {
				logger.log('warn', 'Error getting hackathon');
				return next(err);
			}

			if (!result) {
				return next('Hackathon not found');
			}

			data.hackathon = result;


			logger.log('verbose', 'Getting judges');
			async_queue++;
			mongo.collection('judges')
				.find(
					{_id : {$in : result.judges}},
					{
						_id : 0,
						name : 1
					}
				)
				.toArray(function (err, result) {
					data.hackathon.judges = result
						.map(function (a) {
							return a.name;
						});
					merge_async_calls(err, result);
				});

			logger.log('verbose', 'Getting sponsors and partners');
			temp = result.sponsors_and_partners;
			for (i in temp) {
				(function (i) {
					async_queue++;
					mongo.collection('sponsors_and_partners')
						.find(
							{_id : {$in : temp[i]}},
							{
								_id : 0,
								name : 1
							})
						.toArray(function (err, result) {
							data.hackathon.sponsors_and_partners[i] = result
								.map(function (a) {
									return a.name;
								});
							merge_async_calls(err, result);
						});
				})(i);
			}


			logger.log('verbose', 'Getting winning teams');
			async_queue++;
			mongo.collection('teams')
				.find({
						hackathons : {$elemMatch : {hackathon_id : data.hackathon._id}},
						'hackathons.awards' : {$exists : true}
					},
					{
						'rank' : 1,
						'hackers' : 1,
						'hackathons.hackathon_id' : 1,
						'hackathons.team_name' : 1,
						'hackathons.app_name' : 1,
						'hackathons.points' : 1,
						'hackathons.awards' : 1,
					})
				.sort({'hackathons.points' : -1})
				.toArray(function (err, result) {
					data.teams = result;
					merge_async_calls(err, result);
				});
		},

		merge_async_calls = function (err, result) {
			if (err) {
				logger.log('warn', 'Error getting things');
				return next(err);
			}

			if (--async_queue === 0) {
				logger.log('verbose', 'Getting winning team hackers');

				data.teams.forEach(function (a, i) {
					async_queue++;
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
							data.teams[i].hackers = result;
							send_response(err, result);
						});
				});
			}
		},

		send_response = function (err, result) {
			if (err) {
				logger.log('warn', 'Error getting hackers');
				return next(err);
			}

			if (--async_queue === 0) {
				res.send(data);
			}
		};

	start();
};

exports.get_teams = function (req, res, next) {
	var data = {},
		async_queue = 0,

		start = function () {
			logger.log('info', 'Getting teams');

			mongo.collection('teams')
				.find({
						hackathons : {$elemMatch : {hackathon_id : req.params.id}}
					},
					{_id : 0})
				.sort({'hackathons.points' : -1})
				.toArray(get_hackers_and_stacks);
		},

		get_hackers_and_stacks = function (err, result) {
			if (err) {
				return next(err);
			}

			data = result;

			result.forEach(function (a, i) {
				data[i].hackathon = data[i].hackathons[0];
				delete data[i].hackathons;

				mongo.collection('tech_stacks')
					.find(
						{_id : {$in : a.hackathon.tech_stacks}},
						{_id : 0}
					)
					.toArray(function (err, result) {
						data[i].hackathon.tech_stacks = result.map(function (a) {
							return a.name;
						});
					});


				async_queue++;
				mongo.collection('hackers')
					.find(
						{_id : {$in : a.hackers}},
						{
							_id : 0,
							name : 1,
							image : 1,
							username : 1,
							badges : 1
						}
					)
					.toArray(function (err, result) {
						data[i].hackers = result;

						result.forEach(function (b, j) {
							mongo.collection('badges')
								.find(
									{_id : {$in : b.badges}},
									{_id : 0}
								)
								.toArray(function (_err, result) {
									b.badges = result;
									data[i].hackers[j] = b;
									send_response(err || _err, result);
								});
						});
					});
			});
		},

		send_response = function (err, result) {
			if (err) {
				logger.log('warn', 'Error getting badges');
				return next(err);
			}


			if (--async_queue === 0) {
				res.send(data);
			}
		};

	start();
};

