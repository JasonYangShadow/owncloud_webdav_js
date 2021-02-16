'use strict'

const ocloud= require('./owncloud');
const dobject= require('./do');
const dbase= require('./db');
const yargs = require('yargs');
const { version } = require('yargs');

function server(url, user, pass, pkg, ver, type, upload, file){
    console.log(url, user, pass, pkg, ver, type, upload, file);
}

function client(url, user, pass, pkg, ver, type, download, file){
    console.log(url, user, pass, pkg, ver, type, download, file);
}

yargs.version('0.0.1');
yargs.command({
    command: 'server',
    describe: 'execute as server role, you can upload packages',
    builder: {
        url: {
            describe: 'owncloud webdav url',
            demandOption: true,
            type: 'string'
        },
        user: {
            describe: 'owncloud server username',
            demandOption: true,
            type: 'string'
        },
        pass: {
            describe: 'owncloud server password(app password)',
            demandOption: true,
            type: 'string'
        },
        pkg: {
            decribe: 'package name',
            demandOption: true,
            type: 'string'
        },
        ver: {
            describe: 'package version',
            demandOption: true,
            type: 'string'
        },
        type: {
            describe: 'package type(Docker, Singularity, OCI, LPMX)',
            demandOption: true,
            type: 'string'
        },
        upload: {
            describe: 'upload package',
            type: 'boolean'
        },
        file: {
            describe: 'package path to upload',
            type: 'string'
        }
    },
    handler: function(argv){
        server(argv.url, argv.user, argv.pass, argv.pkg, argv.ver, argv.type, argv.upload??false, argv.file??'');
    }
})

yargs.command({
    command: 'client',
    describe: 'execute as client role, you can download and search packages',
    builder: {
        url: {
            describe: 'owncloud webdav url',
            demandOption: true,
            type: 'string'
        },
        user: {
            describe: 'owncloud client username',
            demandOption: true,
            type: 'string'
        },
        pass: {
            describe: 'owncloud client password(app password)',
            demandOption: true,
            type: 'string'
        },
        pkg: {
            decribe: 'package name',
            demandOption: true,
            type: 'string'
        },
        ver: {
            describe: 'package version',
            type: 'string'
        },
        type: {
            describe: 'package type(Docker, Singularity, OCI, LPMX)',
            type: 'string'
        },
        download: {
            describe: 'download the package?',
            type: 'boolean'
        },
        file: {
            describe: 'target path',
            type: 'string'
        }
    },
    handler: function(argv){
        client(argv.url, argv.user, argv.pass, argv.pkg, argv.ver, argv.type, argv.download??false, argv.file??'');
    }
})


//yargs.parse();
//client:
//FLRTB-FCRRP-PAKFS-VVTYL

//server:
//SUNIZ-QCGJF-FRLJX-BINXT
const os = new ocloud.Server("http://192.168.0.199/remote.php/dav/files/user/", "admin", "SUNIZ-QCGJF-FRLJX-BINXT");
os.getDir('/').then(data => {console.log(data)});

//const oc= new ocloud.Client("http://192.168.0.199/remote.php/dav/files/user/", "user", "FLRTB-FCRRP-PAKFS-VVTYL");
//oc.getDir('/').then((data) => {console.log(data)}).catch(e =>{console.error(e)});
//oc.downloadfile('/ownCloud Manual.pdf', './file');
//oc.uploadfile('test.bmp', 'test file');
//const ob = new dobject.DataObject('p1', 'v1', 'Docker');
//const db = new dbase.DataBase('./nedb');
//console.log(db.save(ob).then((data) => console.log(data)))