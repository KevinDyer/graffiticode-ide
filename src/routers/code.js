const express = require('express');

const { decodeID, encodeID, nilID } = require('./../id');
const { isNonEmptyString, parseJSON } = require('./../utils');

exports.buildCodeRouter = ({
  getPiece,
  validateUser,
  itemToID,
  updatePieceAST,
  postItem,
  dot2num,
}) => {
  const codeRouter = new express.Router();
  codeRouter.get('/', (req, res) => {
    const id = req.query.id;

    if (!isNonEmptyString(id)) {
      res.status(400).send(`Invalid id: ${id}`);
      return;
    }

    const ids = decodeID(id);
    if (JSON.stringify(ids) === JSON.stringify(decodeID(nilID))) {
      res.status(400).send(`Invalid id: ${id}`);
      return;
    }

    const codeId = ids[1];
    getPiece(codeId, (err, row) => {
      if (err) {
        console.trace(`Failed to getPiece when retrieving code: ${err.message}`);
        res.sendStatus(500);
      } else if (!row) {
        res.sendStatus(404);
      } else {
        if (typeof row.ast === 'string') {
          const ast = parseJSON(row.ast);
          if (ast) {
            row.ast = ast;
          }
        }
        res.status(200).json({ src: row.src, ast: row.ast });
      }
    });
  });

  codeRouter.post('/', (req, res) => {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const lang = body.language;
    const langID = lang.charAt(0) === 'L' ? +lang.substring(1) : +lang;
    const t0 = new Date;
    validateUser(body.jwt, lang, (err, data) => {
      if (err && err.length) {
        console.log(`ERROR POST /code validateUser err=${err.message}`);
        res.sendStatus(401);
      } else {
        // TODO user is known but might not have access to this operation. Check
        // user id against registered user table for this host.
        // Map AST or SRC into OBJ. Store OBJ and return ID.
        // Compile AST or SRC to OBJ. Insert or add item.
        const { forkID = 0, src, ast, parent = 0 } = body;
        const ip = req.headers['x-forwarded-for'] ||
          req.connection.remoteAddress ||
          req.socket.remoteAddress ||
          req.connection.socket.remoteAddress;
        const user = +body.userID || dot2num(ip);  // Use IP address if userID not avaiable.
        itemToID(user, lang, ast, (err, itemID) => {
          if (err) {
            itemID = null;
          }
          compileInternal({ res, itemID });
        });
        function compileInternal({ res, itemID }) {
          const img = '';
          const obj = '';
          const label = 'show';
          if (itemID) {
            const ids = [langID, itemID, 0];
            const id = encodeID(ids);
            updatePieceAST(itemID, user, lang, ast, (err) => {
              if (err && err.length) {
                console.log(`ERROR POST /code updatePiece err=${err.message}`);
                res.sendStatus(500);
              } else {
                console.log(`POST /code?id=${ids.join('+')} (${id}) in ${(new Date - t0)}ms (update)`);
                res.json({ id });
              }
            });
          } else {
            postItem(lang, src, ast, obj, user, parent, img, label, forkID, (err, codeID) => {
              if (err && err.length) {
                console.log(`ERROR POST /code postItem err=${err.message}`);
                res.sendStatus(500);
              } else {
                if (forkID === 0) {
                  forkID = id;
                }
                const ids = [langID, codeID, 0];
                const id = encodeID(ids);
                console.log(`POST /code?id=${ids.join('+')} (${id}) in ${(new Date - t0)}ms (post)`);
                res.json({ forkID, id });
              }
            });
          }
        }
      }
    });
  });
  return codeRouter;
};