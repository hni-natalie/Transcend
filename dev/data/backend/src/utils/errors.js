class ForbiddenError extends Error {
	constructor(message = 'Unauthorized to perform this action') {
		super(message);
		this.name = 'ForbiddenError';
		this.statusCode = 403;
	}
}

class NotFoundError extends Error {
	constructor(message = 'Resource not found') {
		super(message);
		this.name = 'NotFoundError';
		this.statusCode = 404;
	}
}

module.exports = {
	ForbiddenError,
	NotFoundError
};