// DEPENDENCIES
import bodyParser from 'body-parser';
import createError from 'http-errors';

// INTERFACE
export default (req, res, next) => {

  if(!req.headers['content-type'])
    return next(createError(400, 'VALIDATION ERROR: headers must contain content-type'));

  let contentType = req.headers['content-type'];

  if(contentType.indexOf('application/json') > -1)
    return bodyParser.json()(req, res, next);

  if(contentType.indexOf('multipart/form-data') > -1)
    return next();

  next(createError(400,
    `VALIDATION ERROR: content-type (${contentType}) not supported`));
};
