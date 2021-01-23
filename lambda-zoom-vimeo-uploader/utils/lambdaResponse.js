function lambdaResponse ({
	json,
	statusCode,
	allowCORS = false,
}) {
	const response = {
		statusCode,
		body: JSON.stringify(json),
	};

	if (allowCORS) {
		response.headers = {
			'Access-Control-Allow-Origin': '*',
		};
	}

	return response;
}

exports.errorResponse = function(json) {
	return lambdaResponse({
		json,
		statusCode: 500,
	});
}

exports.corsErrorResponse = function(json) {
	return lambdaResponse({
		json,
		statusCode: 500,
		allowCORS: true,
	});
}

exports.successResponse = function(json) {
	return lambdaResponse({
		json,
		statusCode: 200,
	});
}

exports.corsSuccessResponse = function(json) {
	return lambdaResponse({
		json,
		statusCode: 200,
		allowCORS: true,
	});
}
