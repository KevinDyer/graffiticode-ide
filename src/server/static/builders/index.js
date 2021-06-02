const { compileID } = require('./../../common');
const { decodeID } = require('./../../../common/id.js');
const { getPiece } = require('./../../storage');

const { buildWebpackBuilder } = require('./webpack');

exports.webpackBuilder = buildWebpackBuilder({
  decodeID,
  getPiece,
  compileID,
});
