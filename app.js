'use strict'

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;
const ocloud= require('./owncloud');
const dobject= require('./do');
const dbase= require('./db');
const wd = require('webdav');

console.log(client.getDirectoryContents("/"))