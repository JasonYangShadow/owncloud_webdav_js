const webdav = require('webdav');
const fs = require('fs');
const fpath = require('path');
const dbase = require('./db');
const dobject = require('./do');
const md5file = require('md5-file');
const { resolve } = require('path');
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;
const prefix = '/share';
const nedb = 'nedb';
const pr = require('properties-reader');
const filepath = './config.ini'

class OwnCloud {
    constructor(url, name, pass) {
        this._wd = webdav.createClient(url, {
            username: name,
            password: pass
        });
    }

    async init() {
        return new Promise((resolve, reject) => {
            (async () => {
                const props = await readconfig().catch(e => reject(e));
                if(props.share){
                    this._remotedb = `/${props.share}/dbfile`;
                }else{
                    this._remotedb = `${prefix}/dbfile`;
                }

                if (await this.exists(this._remotedb)) {
                    await this.asyncdownload(this._remotedb, `${nedb}`);
                    this._db = new dbase.DataBase(`${nedb}`);
                    resolve();
                } else {
                    this._db = new dbase.DataBase(`${nedb}`);
                    reject(`remote db: ${this._remotedb} does not exist, you can not search or download images`);
                }
            })();
        });
    }

    async getDir(path) {
        const content = await this._wd.getDirectoryContents("/");
        return await this._wd.getDirectoryContents(path).then(data => {
            return data;
        }).catch(err => {
            throw new Error(err);
        })
    }

    async getQuota() {
        return await this._wd.getQuota().then(data => { return data }).catch(err => {
            throw new Error(err);
        });
    }

    async getstat(path) {
        return await this._wd.stat(path).then(data => { return data }).catch(err => {
            throw new Error(err);
        });
    }

    async exists(file) {
        return await this._wd.exists(file);
    }

    //file => file in owncloud
    //location => local destination
    async asyncdownload(file, location) {
        return new Promise((resolve, reject) => {
            try {
                this._wd.createReadStream(file).pipe(fs.createWriteStream(location)).on('finish', () => {
                    resolve();
                }).on('error', (error) => {
                    reject(error);
                })
            } catch (err) {
                reject(err);
            }
        })
    }

    async asyncgenpath(prefix, pkg, version, type) {
        return new Promise((resolve, reject) => {
            (async () => {
                const props = await readconfig().catch(e => { throw e });
                if (props.share) {
                    prefix = props.share.toLowerCase();
                } else {
                    prefix = prefix.toLowerCase();
                }
                pkg = pkg.toLowerCase();
                version = version.toLowerCase();
                type = type.toLowerCase();

                if (prefix && prefix[0] === '/') {
                    resolve(fpath.posix.join(prefix, type, pkg, version, 'image'));
                } else if (prefix && prefix[0] !== '/') {
                    resolve(fpath.posix.join('/', prefix, type, pkg, version, 'image'));
                }
                reject(`could not genpath, the prefix: ${prefix} is invalid`);
            })().catch(e => reject(e));
        });
    };

}

class Client extends OwnCloud {
    constructor(url, name, pass) {
        super(url, name, pass);
    }

    async search(pkg) {
        await this.init();

        pkg = pkg.toLowerCase();

        return await this._db.findall(pkg);
    }

    async searchpkg(pkg, version, type) {
        await this.init();

        pkg = pkg.toLowerCase();
        version = version.toLowerCase();
        type = type.toLowerCase();

        return await this._db.find(pkg, version, type);
    }

    async searchregx(pkg, version, type, op) {
        await this.init();

        pkg = pkg.toLowerCase();
        version = version.toLowerCase();
        if (type) {
            type = type.toLowerCase();
        }

        return await this._db.findregx(pkg, version, type, op);
    }

    async download(pkg, version, type, location) {
        await this.init();

        pkg = pkg.toLowerCase();
        version = version.toLowerCase();
        type = type.toLowerCase();

        try {
            var record = await this._db.find(pkg, version, type);
            if (record === null) {
                throw Error(`pkg:${pkg}, version:${version}, type:${type} does not exist`);
            }
            const md5 = record._md5;
            const path = record._ref;
            return new Promise((resolve, reject) => {
                try {
                    this.asyncdownload(path, location).then(_ => {
                        if (location && fs.existsSync(location)) {
                            md5file(location).then(data => {
                                if (data.trim() === md5.trim()) {
                                    resolve();
                                } else {
                                    reject(`download from ${path} has different md5 value, the file might be corrupted`);
                                }
                            }).catch(e => {
                                reject(e)
                            })
                        } else {
                            reject(`could not find ${path}`);
                        }
                    }).catch(err => { throw err });
                    resolve(`download from ${path} to ${location} finished`);
                } catch (e) {
                    reject(e);
                }
            });
        } catch (err) {
            throw err;
        }
    }
}

class Server extends OwnCloud {
    constructor(url, name, pass) {
        super(url, name, pass);
    }

    async deletepkg(pkg, version, type) {
        await this.init();
        pkg = pkg.toLowerCase();
        version = version.toLowerCase();
        type = type.toLowerCase();

        return new Promise((resolve, reject) => {
            (async () => {
                const record = await this._db.find(pkg, version, type).catch(() => { });
                if (record) {
                    const path = record._ref;
                    const num = await this._db.delete(pkg, version, type).catch(() => { });
                    if (num > 0) {
                        await this._wd.deleteFile(path).catch((err) => { throw err });
                        fs.createReadStream(`${nedb}`).pipe(this._wd.createWriteStream(this._remotedb, { overwrite: true })).on('finish', resolve(`delete pkg: ${pkg}, version: ${version}, type: ${type} sucessfully from server`)).on('error', err => { reject(err) });
                    }
                }
                resolve(`no need to delete pkg: ${pkg}, version: ${version}, type: ${type}`);
            })().catch((err) => {
                if (err.response) {
                    reject(err.response.data);
                } else {
                    reject(err);
                }
            });
        });
    }

    async uploadpkg(pkg, version, type, file, overwrite) {
        pkg = pkg.toLowerCase();
        version = version.toLowerCase();
        type = type.toLowerCase();
        file = file.toLowerCase();

        //ignore the init error, because we need to create and upload nedb
        await this.init().catch(() => {});

        if (!fs.existsSync(file)) {
            throw new Error(`file: ${file} does not exist`);
        }

        //create dobject
        const ob = new dobject.DataObject(pkg, version, type);
        file = fpath.resolve(file);
        await ob.calmd5(file).then(data => {
            ob.md5 = data
        }).catch(e => { throw e });

        let stats = fs.statSync(file);
        ob.filesize = stats.size;

        const thisp = this;

        return new Promise((resolve, reject) => {
            (async () => {
                //normal upload procedure
                const path = await thisp.asyncgenpath(prefix, pkg, version, type).catch(e => { reject(e) });

                ob.ref = path;
                //create a parant list for looping
                const dirlist = []
                const dirpaths = path.split('/');
                dirpaths.shift();
                while (dirpaths.length > 1) {
                    dirlist.push((dirlist[dirlist.length - 1] || '') + '/' + dirpaths.shift());
                }
                //go saving to nedb first
                await thisp._db.save(ob, overwrite).then(ret => {
                   //create parent dir 
                   if(ret){
                       //means that we need to upload image
                       (async() =>{
                            //create parant dir
                            await thisp.createDirifNotExist(dirlist);

                            //upload package
                            fs.createReadStream(file).pipe(thisp._wd.createWriteStream(path)).on('finish', () =>{
                                //upload nedb
                                fs.createReadStream(`${nedb}`).pipe(thisp._wd.createWriteStream(thisp._remotedb, {overwrite: true})).on('error', err=>{throw err});
                            }).on('error', err => {throw err});
                       })().catch(e => {throw e});
                   }else{
                        //means that we only need to upload the nedb
                        fs.createReadStream(`${nedb}`).pipe(thisp._wd.createWriteStream(thisp._remotedb, {overwrite: true})).on('error', err=>{throw err});
                   }
                }).catch(e => {throw e});

            })().catch((err) => {
                if (err.response) {
                    reject(err.response.data);
                } else {
                    reject(err);
                }
            }).then(() => {resolve(`successfully upload package: ${pkg}, version: ${version}, type: ${type}, file: ${file}  to the server`)});
        });
    }

    async createDirifNotExist(paths) {
        return new Promise((resolve, reject) => {
            (async () => {
                for (let i = 0; i < paths.length; i++) {
                    if (await this._wd.exists(paths[i]) === false) {
                        await this._wd.createDirectory(paths[i]).catch(e => {
                            reject(e);
                        });
                    }
                }
                resolve();
            })();
        });
    }
}

async function readconfig() {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(filepath)) {
            reject(`config file ${filepath} does not exist`);
        }

        const props = pr(filepath);
        let url = props.get('config.account.url');
        if (!url) {
            reject(`could not read config.account.url property from ${filepath}`);
        }
        let user = props.get('config.account.user');
        if (!user) {
            reject(`could not read config.account.user property from ${filepath}`);
        }
        let pass = props.get('config.account.pass');
        if (!user) {
            reject(`could not read config.account.pass property from ${filepath}`);
        }
        let share = props.get('owncloud.share.prefix');
        if (!share) {
            reject(`could not read owncloud.share.prefix property from ${filepath}`);
        }

        resolve({ 'url': url, 'user': user, 'pass': pass, 'share': share });
    });
};

module.exports = {
    Client,
    Server,
    readconfig
}