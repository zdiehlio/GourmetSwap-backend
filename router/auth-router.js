'use strict';

const { Router } = require('express');
const User = require('../model/user.js');
const jsonParser = require('body-parser').json();
// import basicAuth from '../middleware/basic-auth-middleware.js';
import parserBody from '../middleware/parser-body.js';
import { basicAuth, bearerAuth } from '../middleware/parser-auth.js';
import superagent from 'superagent';

const authRouter = module.exports = new Router();

authRouter.post('/api/signup', jsonParser, (req, res, next) => {
  User.create(req.body)
    .then(token => {
      res.status(201).send(token);
      // console.log('res: ', res);
    })
    .catch(next);
});

authRouter.get('/api/signin', basicAuth, (req, res, next) => {
  req.user.tokenCreate().then(token => res.send(token)).catch(next);
});

authRouter.put('/api/users', bearerAuth, parserBody, (req, res, next) => {
  let options = {
    new: true,
    runValidators: true,
  };

  User.findOneAndUpdate(req.user._id, req.body, options)
    .then(profile => res.status(202).json(profile))
    .catch(next);
});


authRouter.get('/oauth/google/code', (req, res, next) => {
  console.log('req.query', req.query);
  if(!req.query.code) {
    // user has denied access
    res.redirect(process.env.CLIENT_URL);
  } else {
    // exchange the code for a google access token
    superagent.post('https://www.googleapis.com/oauth2/v4/token')
    .type('form')
    .send({
      code: req.query.code,
      grant_type: 'authorization_code',
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: `${process.env.API_URL}/oauth/google/code`,
    })
    .then(response => {
      console.log('google token data', response.body);
      // get the user profile
      return superagent.get('https://www.googleapis.com/plus/v1/people/me/openIdConnect')
      .set('Authorization', `Bearer ${response.body.access_token}`);
    })
    .then(response => {
      console.log('google profile', response.body);
      // login or create user from profile
      return User.handleOAUTH(response.body);
    })
    .then(user => user.tokenCreate())
    .then(token => {
      res.cookie('Gourmet-Swap-Token', token);
      res.redirect(process.env.CLIENT_URL);
    })
    .catch((error) => {
      console.error(error);
      res.redirect(process.env.CLIENT_URL);
    });
  }
});
