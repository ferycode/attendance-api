"use strict";

function base_error(status, message) {
  if ("object" === typeof message) {
    var messages = [];
    for (var columnName in message) {
      messages.push([columnName, message[columnName]].join(" "));
    }

    message = messages.join(", ") + ".";
  }
  var error = new Error(message);
  error.status = status;
  return error;
}

function boundedError(status) {
  var defaultMessages = {
    "400": "Bad Request",
    "401": "Unauthorized",
    "403": "Forbidden",
    "404": "Not Found",
    "422": "Unprocessed Entity",
    "500": "Internal Server Error"
  };

  return function(message) {
    message = message || defaultMessages[status] || "Internal Server Error";
    return base_error(status, message);
  };
}

var error400 = boundedError(400);
var error401 = boundedError(401);
var error403 = boundedError(403);
var error404 = boundedError(404);
var error422 = boundedError(422);
var error500 = boundedError(500);

exports.error400 = error400;
exports.error401 = error401;
exports.error403 = error403;
exports.error404 = error404;
exports.error422 = error422;
exports.error500 = error500;

function errorJson(error) {
  return {
    message: error.message,
    error: error.stack,
    title: "["+process.env.NODE_ENV+"] Error"
  };
}

function validationErrorJson(error) {
  var errors = { fullMessages: [] };
  error.errors.forEach(function(err) {
    errors[err.path] = errors[err.path] || [];
    errors[err.path].push(err.message);
    errors.fullMessages.push((err.path+" "+err.message).trim());
  });
  return {
    message: "Validation error",
    error: errors.fullMessages,
    title: "["+process.env.NODE_ENV+"] Validation Error"
  };
}

exports.errorJson = errorJson;

exports.error = function error(responder) {
  return function(err) {
    if (err.name && err.name === "SequelizeValidationError") {
      responder.status(422);
      responder.json(validationErrorJson(err));
    } else {
      var json = errorJson(err);
      responder.status(err.status || 500);
      responder.json(json);
    }
  };
};

exports.json = function json(responder, status) {
  return function(object) {
    responder.status(status || 200);
    responder.json(object);
  };
};

exports.if404 = function if404(message) {
  return function(object) {
    if (!object) {
      throw error404(message);
    }
    return object;
  };
};

exports.buildError = function(error) {
  if(error && error.message){
    if(error.isJoi){
      error.status = 422;
    }
    return error;
  }else{error.status = 400;
    return error;
  }
};
