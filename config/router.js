var loc			= __dirname + '/../controllers/',
	hackathon 	= require(loc + 'hackathon');

module.exports	= function (router, logger) {

	router.del 	= router.delete;

	router.get('/hackathons', hackathon.get_list);


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

