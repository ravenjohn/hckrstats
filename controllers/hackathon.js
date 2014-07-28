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
		send_response = function (err, data) {
			if (err) {
				logger.log('warn', 'Error on getting list of hackathons');
				return next(err);
			}

			logger.log('info', 'Successfully retrieved list of hackathons');
			res.send(data);
		};

	start();
};
