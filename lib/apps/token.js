"use strict"; 

var express       = require('../express-inherit'),
    winston       = require('winston'),
    Error404      = require('../errors').Error404;

var token_app = express();

token_app.get('/:tokenId', function(req, res, next) {

  var Token = req.popit.model('Token');
  
  // get a token, or 404
  Token.findValid( req.param('tokenId'), function(err,token) {
    if (err)    return next(err);
    if (!token) return next(new Error404());

    var action = actions[token.action];
    
    if (!action) {
      // Well this should never happen - means that some bit of code has
      // created a token that we can't deal with. Log it and then 404 so that
      // the user gets some reasonable response.
      winston.error( "Could not find action '%s' for token '%s'", token.action, token.id );
      return next( new Error404() );
    }
    
    // run the action
    action(req, res, token, next);

  });
});   

module.exports = token_app;

var actions = {
  login: function (req, res, token, next) {

    // delete the token so it can't be used again
    token.remove(function(err) {
      if (err) return next(err);
      
      // just in case, make sure that we have a clean session
      req.session.regenerate(function(err){
        if (err) return next(err);

        // Manually enter the details
        req.session.loggedInUserId = token.args.user_id;

        res.redirect( token.args.redirect_to || '/' );    
      });
      
    });
  },
};
