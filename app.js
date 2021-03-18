#! /usr/bin/env node
'use strict'

const ocloud = require('./owncloud');
const yargs = require('yargs');
const filepath = './config.ini'
const fs = require('fs');
const util = require('util');
const {Table} = require('console-table-printer');
const pr = require('properties-reader');

function retTable(){
    return new Table({
        title: 'Query Results',
        columns: [
            {name: '_name', alignment: 'middle', color: 'red'},
            {name: '_version', alignment: 'middle', color: 'yellow'},
            {name: '_type', alignment: 'middle', color: 'yellow'},
            {name: '_timestamp', alignment: 'middle', color: 'yellow'},
            {name: '_filesize', alignment: 'middle', color: 'yellow'},
            {name: '_md5', alignment: 'middle', color: 'yellow'},
            {name: '_ref', alignment: 'middle', color: 'red'},
            {name: '_id', alignment: 'middle', color: 'yellow'},
        ],
        enabledColumns: ['_name','_version', '_type', '_timestamp', '_filesize', '_md5', '_ref'],
    });
};

yargs.version('1.0.4');
yargs.command({
    command: 'init',
    describe: 'initialize the project',
    handler: function (argv) {
        (async () => {
            if (!fs.existsSync(filepath)) {
                fs.open(filepath, 'w', function (err, file) {
                    if (err) {
                        throw err;
                    }
                });
                const props = pr(filepath, { writer: { saveSections: true } });
                props.set('config.account.url', 'webdav url address of own cloud');
                props.set('config.account.user', 'user name on ownCloud service');
                props.set('config.account.pass', 'app password of the user');
                props.set('owncloud.share.prefix', 'ignored if you are a normal user');
                await props.save(filepath).catch(e => { throw e });
            }
        })().catch(err => { console.error(err) }).then(data => { console.log(`have written default config to ${filepath}`) })
    }
}).usage('init usage: call "app.js init" is enough for this command');

yargs.command({
    command: 'search',
    describe: 'search pkg',
    builder: {
        url: {
            describe: 'owncloud webdav url',
            demandOption: false,
            type: 'string'
        },
        user: {
            describe: 'owncloud server username',
            demandOption: false,
            type: 'string'
        },
        pass: {
            describe: 'owncloud server password(app password)',
            demandOption: false,
            type: 'string'
        },
        pkg: {
            describe: 'package name',
            demandOption: true,
            type: 'string'
        },
    },
    handler: function (argv) {
        (async () => {
            const account = await ocloud.readconfig().catch(() => { });
            if (account) {
                argv.url = account.url;
                argv.user = account.user;
                argv.pass = account.pass;
            }

            if (argv.url && argv.user && argv.pass) {
                const oc = new ocloud.Client(argv.url, argv.user, argv.pass);
                oc.search(argv.pkg).then(data => { 
                    if(data && Array.isArray(data) && data.length > 0){
                        let table = retTable();
                        data.forEach(item => {
                            item._timestamp = new Date(item._timestamp);
                            item._timestamp = item._timestamp.toLocaleDateString();
                        });
                        table.addRows(data);
                        table.printTable();
                    }else{
                       console.log('No records found!');
                    }
                }).catch(e => console.error(e));
            } else {
                console.error(`please set url, user, pass from CLI or write their value into ${filepath} file`);
            }
        })();
    }
}).usage('search usage: --url=webdav_url --user=user_name --pass=app_password --pkg=package_name [Note: you can use both client/server account]');

yargs.command({
    command: 'searchpkg',
    describe: 'search specific pkg',
    builder: {
        url: {
            describe: 'owncloud webdav url',
            demandOption: false,
            type: 'string'
        },
        user: {
            describe: 'owncloud server username',
            demandOption: false,
            type: 'string'
        },
        pass: {
            describe: 'owncloud server password(app password)',
            demandOption: false,
            type: 'string'
        },
        pkg: {
            describe: 'package name',
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
    },
    handler: function (argv) {
        (async () => {
            const account = await ocloud.readconfig().catch(() => { });
            if (account) {
                argv.url = account.url;
                argv.user = account.user;
                argv.pass = account.pass;
            }

            if (argv.url && argv.user && argv.pass) {
                const oc = new ocloud.Client(argv.url, argv.user, argv.pass);
                oc.searchpkg(argv.pkg, argv.ver, argv.type).then(data => { 
                    if(data){
                        let table = retTable();
                        [data].forEach(item =>{
                            item._timestamp = new Date(item._timestamp);
                            item._timestamp = item._timestamp.toLocaleDateString();
                        })
                        table.addRows([data]);
                        table.printTable();
                    }else{
                        console.log('No records found!');
                    }
                 }).catch(e => console.error(e));
            } else {
                console.error(`please set url, user, pass from CLI or write their value into ${filepath} file`);
            }
        })();
    }
}).usage('searchpkg usage: --url=webdav_url --user=user_name --pass=app_password --pkg=package_name --ver=package_version --type=package_type(Singularity, LPMX, Docker, OCI) [Note: you can use both client/server account]');

yargs.command({
    command: 'searchcond',
    describe: 'search package with condition',
    builder: {
        url: {
            describe: 'owncloud webdav url',
            demandOption: false,
            type: 'string'
        },
        user: {
            describe: 'owncloud server username',
            demandOption: false,
            type: 'string'
        },
        pass: {
            describe: 'owncloud server password(app password)',
            demandOption: false,
            type: 'string'
        },
        pkg: {
            describe: 'package name',
            demandOption: true,
            type: 'string'
        },
        ver: {
            describe: 'package version',
            demandOption: true,
            type: 'string'
        },
        op: {
            describe: 'package operation(lt, lte, gt,gte)',
            demandOption: true,
            type: 'string'
        },
        type: {
            describe: 'package type(Docker, Singularity, OCI, LPMX)',
            demandOption: false,
            type: 'string'
        },
    },
    handler: function (argv) {
        (async () => {
            const account = await ocloud.readconfig().catch(() => { });
            if (account) {
                argv.url = account.url;
                argv.user = account.user;
                argv.pass = account.pass;
            }

            if (argv.url && argv.user && argv.pass) {
                const oc = new ocloud.Client(argv.url, argv.user, argv.pass);
                oc.searchregx(argv.pkg, argv.ver, argv.type, argv.op).then(data => { 
                    if(data && Array.isArray(data) && data.length > 0){
                        let table = retTable();
                        data.forEach(item =>{
                            item._timestamp = new Date(item._timestamp);
                            item._timestamp = item._timestamp.toLocaleDateString();
                        })
                        table.addRows(data);
                        table.printTable();
                    }else{
                        console.log('No records found!');
                    }
                 }).catch(e => console.error(e));
            } else {
                console.error(`please set url, user, pass from CLI or write their value into ${filepath} file`);
            }
        })();
    }
}).usage('searchcond usage: --url=webdav_url --user=user_name --pass=app_password --pkg=package_name --ver=package_version --type=package_type(Singularity, LPMX, Docker, OCI) --op=filter_type(lt,lte,gt,gte) [Note: you can use both client/server account]');

yargs.command({
    command: 'download',
    describe: 'download pkg',
    builder: {
        url: {
            describe: 'owncloud webdav url',
            demandOption: false,
            type: 'string'
        },
        user: {
            describe: 'owncloud server username',
            demandOption: false,
            type: 'string'
        },
        pass: {
            describe: 'owncloud server password(app password)',
            demandOption: false,
            type: 'string'
        },
        pkg: {
            describe: 'package name',
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
        location: {
            describe: 'where you want to download the package',
            demandOption: true,
            type: 'string'
        },
    },
    handler: function (argv) {
        (async () => {
            const account = await ocloud.readconfig().catch(() => { });
            if (account) {
                argv.url = account.url;
                argv.user = account.user;
                argv.pass = account.pass;
            }

            if (argv.url && argv.user && argv.pass) {
                const oc = new ocloud.Client(argv.url, argv.user, argv.pass);
                oc.download(argv.pkg, argv.ver, argv.type, argv.location).then(data => { console.log(data) }).catch(e => console.error(e));
            } else {
                console.error(`please set url, user, pass from CLI or write their value into ${filepath} file`);
            }
        })();
    }
}).usage('download usage: --url=wevdav_url --user=user_name --pass=app_password --pkg=package_name --ver=package_version --type=package_type(Singularity, LPMX, Docker, OCI) --location=path_to_write_downloaded_file [Note: you can use both client/server account]');

yargs.command({
    command: 'upload',
    describe: 'upload pkg',
    builder: {
        url: {
            describe: 'owncloud webdav url',
            demandOption: false,
            type: 'string'
        },
        user: {
            describe: 'owncloud username',
            demandOption: false,
            type: 'string'
        },
        pass: {
            describe: 'owncloud server password(app password)',
            demandOption: false,
            type: 'string'
        },
        pkg: {
            describe: 'package name',
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
        location: {
            describe: 'where is the local file',
            demandOption: true,
            type: 'string'
        },
        overwrite:{
            describe: 'overwrite existing record?(true -> yes, false -> create new)',
            demandOption: false,
            type: 'boolean'
        },
    },
    handler: function (argv) {
        (async () => {
            const account = await ocloud.readconfig().catch(() => { });
            if (account) {
                argv.url = account.url;
                argv.user = account.user;
                argv.pass = account.pass;
            }

            if (argv.url && argv.user && argv.pass) {
                const os = new ocloud.Server(argv.url, argv.user, argv.pass);
                os.uploadpkg(argv.pkg, argv.ver, argv.type, argv.location, argv.overwrite).then(data => { console.log(data) }).catch(e => {
                    console.error(e);
                })
            } else {
                console.error(`please set url, user, pass from CLI or write their value into ${filepath} file`);
            }
        })();
    }
}).usage('upload usage: --url=webdav_url --user=user_name --pass=app_password --pkg=package_name --ver=package_version --type=package_type(Docker,Singularity,OCI,LPMX) --location=path_to_read_file_for_upload [Note: you have to use server account]');

yargs.command({
    command: 'delete',
    describe: 'delete pkg',
    builder: {
        url: {
            describe: 'owncloud webdav url',
            demandOption: false,
            type: 'string'
        },
        user: {
            describe: 'owncloud server username',
            demandOption: false,
            type: 'string'
        },
        pass: {
            describe: 'owncloud server password(app password)',
            demandOption: false,
            type: 'string'
        },
        pkg: {
            describe: 'package name',
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
    },
    handler: function (argv) {
        (async () => {
            const account = await ocloud.readconfig().catch(() => { });
            if (account) {
                argv.url = account.url;
                argv.user = account.user;
                argv.pass = account.pass;
            }

            if (argv.url && argv.user && argv.pass) {
                const os = new ocloud.Server(argv.url, argv.user, argv.pass);
                os.deletepkg(argv.pkg, argv.ver, argv.type).then(data => { console.log(data) }).catch(e => {
                    console.error(e);
                })
            } else {
                console.error(`please set url, user, pass from CLI or write their value into ${filepath} file`);
            }
        })();
    }
}).usage('delete usage: --url=webdav_url --user=user_name --pass=app_password --pkg=package_name --ver=package_version --type=package_type(Docker,Singularity,OCI,LPMX) [Note: you have to use admin account]');

yargs.parse();