#! /usr/bin/env node
'use strict'

const ocloud= require('./owncloud');
const yargs = require('yargs');

yargs.version('0.0.1');
yargs.command({
    command: 'search',
    describe: 'search pkg',
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
            describe: 'package name',
            demandOption: true,
            type: 'string'
        },
    },
    handler: function(argv){
        const oc = new ocloud.Client(argv.url, argv.user, argv.pass);
        oc.search(argv.pkg).then(data => {console.log(data)}).catch(e => console.error(e));
    }
}).usage('search usage: --url=webdav_url --user=user_name --pass=app_password --pkg=package_name [Note: you can use both client/server account]');

yargs.command({
    command: 'searchpkg',
    describe: 'search specific pkg',
    alias: 'e',
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
    handler: function(argv){
        const oc = new ocloud.Client(argv.url, argv.user, argv.pass);
        oc.searchpkg(argv.pkg, argv.ver, argv.type).then(data => {console.log(data)}).catch(e => console.error(e));
    }
}).usage('searchpkg usage: --url=webdav_url --user=user_name --pass=app_password --pkg=package_name --ver=package_version --type=package_type(Singularity, LPMX, Docker, OCI) [Note: you can use both client/server account]');

yargs.command({
    command: 'download',
    describe: 'download pkg',
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
    handler: function(argv){
        const oc = new ocloud.Client(argv.url, argv.user, argv.pass);
        oc.download(argv.pkg, argv.ver, argv.type, argv.location).then(data => {console.log(data)}).catch(e => console.error(e));
    }
}).usage('download usage: --url=wevdav_url --user=user_name --pass=app_password --pkg=package_name --ver=package_version --type=package_type(Singularity, LPMX, Docker, OCI) --location=path_to_write_downloaded_file [Note: you can use both client/server account]');

yargs.command({
    command: 'upload',
    describe: 'upload pkg',
    builder: {
        url: {
            describe: 'owncloud webdav url',
            demandOption: true,
            type: 'string'
        },
        user: {
            describe: 'owncloud username',
            demandOption: true,
            type: 'string'
        },
        pass: {
            describe: 'owncloud server password(app password)',
            demandOption: true,
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
    },
    handler: function(argv){
        const os = new ocloud.Server(argv.url, argv.user, argv.pass);
        os.uploadpkg(argv.pkg, argv.ver, argv.type, argv.location).then(data => {console.log(data)}).catch(e =>{
            console.error(e);
        })
    }
}).usage('upload usage: --url=webdav_url --user=user_name --pass=app_password --pkg=package_name --ver=package_version --type=package_type(Docker,Singularity,OCI,LPMX) --location=path_to_read_file_for_upload [Note: you have to use server account]');

yargs.command({
    command: 'delete',
    describe: 'delete pkg',
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
    handler: function(argv){
        const os = new ocloud.Server(argv.url, argv.user, argv.pass);
        os.deletepkg(argv.pkg, argv.ver, argv.type).then(data => {console.log(data)}).catch(e =>{
            console.error(e);
        })
    }
}).usage('delete usage: --url=webdav_url --user=user_name --pass=app_password --pkg=package_name --ver=package_version --type=package_type(Docker,Singularity,OCI,LPMX) [Note: you have to use admin account]');

yargs.parse();