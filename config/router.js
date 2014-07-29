var loc			= __dirname + '/../controllers/',
	hackathon 	= require(loc + 'hackathon'),
	team 		= require(loc + 'team');

module.exports	= function (router, logger) {

	router.del 	= router.delete;

	router.get('/hackathons', hackathon.get_list);
	router.get('/hackathon/:id', hackathon.get_by_id);
	router.get('/hackathon/:id/teams', hackathon.get_teams);

	router.get('/team/:id', team.get_by_id);

	router.all('*', function (req, res, next) {
		logger.log('debug', '--REQUEST BODY--', req.body);
		logger.log('debug', '--REQUEST QUERY--', req.query);
		next();
	});

	router.all('*', function (req, res) {
		res.send(404, {message : 'Nothing to do here.'});
	});

	return router;
};

