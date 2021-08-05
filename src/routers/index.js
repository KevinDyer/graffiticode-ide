const express = require('express');
const { provider } = require('../static');
const { isNonEmptyString } = require('../utils');

const { buildCodeRouter } = require('./code');
const { buildHandleGet, buildStaticRouter } = require('./static');

const handleGet = buildHandleGet({ isNonEmptyString, provider });
const newRouter = () => new express.Router();

exports.label = require('./label');
exports.stat = require('./stat');
exports.static = buildStaticRouter({ newRouter, handleGet });

exports.registerRoutes = ({
  app,
  getPiece,
  decodeID,
  encodeID,
  validateUser,
  itemToID,
  updatePieceAST,
  postItem,
  dot2num,
}) => {
  console.log('Registering HTTP routes');
  app.use('/code', buildCodeRouter({
    getPiece,
    decodeID,
    encodeID,
    validateUser,
    itemToID,
    updatePieceAST,
    postItem,
    dot2num,
  }));
};

