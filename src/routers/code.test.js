const express = require('express');
const request = require('supertest');

const { decodeID, encodeID } = require('./../id');
const { buildCodeRouter } = require('./code');

describe('routers/code', () => {
  let getPiece;
  let getPieceError;
  let getPieceReturn;
  let app;
  beforeEach(() => {
    getPiece = jest.fn().mockImplementation((codeId, resume) => {
      setTimeout(() => resume(getPieceError, getPieceReturn), 10);
    });
    getPieceError = null;
    getPieceReturn = null;

    app = express();
    app.use(express.json({}));
    app.use('/code', buildCodeRouter({
      decodeID,
      getPiece,
    }))
  });

  it('GET should return 200 and the code piece', async () => {
    const codeId = 123;
    const id = encodeID([0, codeId, 0]);
    const row = { src: '|L0', ast: {} };
    getPieceReturn = { ...row };

    const res = await request(app).get('/code').query({ id }).expect(200, JSON.stringify(row));

    expect(res.body).toStrictEqual(row);
    expect(getPiece).toHaveBeenCalledWith(codeId, expect.anything());
  });

  it('GET without id should return 400', async () => {
    await request(app).get('/code').query({}).expect(400);

    expect(getPiece).toHaveBeenCalledTimes(0);
  });

  it('GET with invalid id should return 400', async () => {
    const id = 'InvalidId';
    await request(app).get('/code').query({ id }).expect(400);

    expect(getPiece).toHaveBeenCalledTimes(0);
  });

  it('GET should return 500 if getPiece returns an error', async () => {
    const codeId = 123;
    const id = encodeID([0, codeId, 0]);
    getPieceError = new Error('db error');

    await request(app).get('/code').query({ id }).expect(500);

    expect(getPiece).toHaveBeenCalledWith(codeId, expect.anything());
  });

  it('GET should return the ast in the row if it is a non parsable string', async () => {
    const codeId = 123;
    const id = encodeID([0, codeId, 0]);
    const ast = JSON.stringify({ root: 0 }) + 'foo';
    const row = { src: '|L0', ast };
    getPieceReturn = { ...row };

    const res = await request(app).get('/code').query({ id }).expect(200, JSON.stringify(row));

    expect(res.body).toStrictEqual(row);
    expect(getPiece).toHaveBeenCalledWith(codeId, expect.anything());
  });

  it('GET should return parsed ast if it is a string', async () => {
    const codeId = 123;
    const id = encodeID([0, codeId, 0]);
    const ast = { root: 0 };
    const row = { src: '|L0', ast: JSON.stringify(ast) };
    getPieceReturn = { ...row };

    const expectedRow = { ...row, ast };
    const res = await request(app).get('/code').query({ id }).expect(200, JSON.stringify(expectedRow));

    expect(res.body).toStrictEqual(expectedRow);
    expect(getPiece).toHaveBeenCalledWith(codeId, expect.anything());
  });

  it('POST should save code', async () => {
    const body = {
      id: undefined,
      forkID: 0,
      parent: encodeID([0, 123, 0]),
      ast: { root: 0 },
      language: 'L0',
      src: '|L0',
    };
    const res = await request(app)
      .post('/code')
      .set('Content-Type', 'application/json')
      .send(body)
      .expect(200, 'todo');

    expect(res.body).toStrictEqual(expectedRow);
    expect(getPiece).toHaveBeenCalledWith(codeId, expect.anything());
  });
});