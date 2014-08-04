var config         = require(__dirname + '/../config/config'),
    util           = require(__dirname + '/../helpers/util'),
    mongo          = require(__dirname + '/../lib/mongoskin'),
    logger         = require(__dirname + '/../lib/logger');


exports.get_by_id = function (req, res, next) {
	var data = {},
		async_queue = 0,

		start = function () {
			logger.log('info', 'Getting hacker');

			mongo.collection('hackers')
				.findOne(
					{_id : req.params.id},
					get_teams_and_badges
				);
		},

		get_teams_and_badges = function (err, result) {
			if (err) {
				return next(err);
			}

			if (!result) {
				return next('Hacker not found');
			}

			data = result;

			mongo.collection('badges')
				.find(
				{_id : {$in : data.badges}},
				{_id : 0}
				)
				.toArray(store_badges);

			mongo.collection('teams')
				.find(
				{hackers : {$in : [data._id]}},
				{
					_id : 0,
					hackathons : 1,
				}
				)
				.toArray(get_hackathons);
		},

		store_badges = function (err, result) {
			if (err) {
				return next(err);
			}

			data.badges = result;
		},

		get_hackathons = function (err, result) {
			if (err) {
				return next(err);
			}

			data.hackathons = [].concat.apply([], result.map(function (a) {
				return a.hackathons;
			}));

			data.total_hackathons_joined = data.hackathons.length;
			data.total_wins = data
				.hackathons
				.filter(function (a) {
					return a.awards.length > 0;
				})
				.length;
			data.win_lose_ratio = data.total_wins / data.total_hackathons_joined;

			mongo.collection('hackathons')
				.find(
				{_id :
					{$in :
						data.hackathons.map(function (a) {
							return a.hackathon_id;
						})
					}
				},
				{
					portrait_image : 1,
					name : 1,
					date : 1,
					_id : 0
				})
				.toArray(send_response);
		},

		send_response = function (err, result) {
			if (err) {
				return next(err);
			}

			data.hackathons = data.hackathons.map(function (a, i) {
				result.forEach(function (b) {
					if (a.hackathon_id === b._id) {
						a.hackathon = b;
					}
				});
				return a;
			});

			res.send(data);
		};

	start();
};

