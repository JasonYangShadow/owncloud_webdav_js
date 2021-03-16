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
const remotedb = `${prefix}/dbfile`;

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
                if (await this.exists(`${remotedb}`)) {
                    await this.asyncdownload(`${remotedb}`, `${nedb}`);
                    this._db = new dbase.DataBase(`${nedb}`);
                    resolve();
                } else {
                    this._db = new dbase.DataBase(`${nedb}`);
                    reject(`remote db: ${remotedb} does not exist, you can not search or download images`);
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

    genpath(prefix, pkg, version, type) {
        prefix = prefix.toLowerCase();
        pkg = pkg.toLowerCase();
        version = version.toLowerCase();
        type = type.toLowerCase();

        if (prefix && prefix[0] === '/') {
            return fpath.posix.join(prefix, type, pkg, version, 'image');
        } else if (prefix && prefix[0] !== '/') {
            return fpath.posix.join('/', prefix, type, pkg, version, 'image');
        }
        throw new Error(`could not genpath, the prefix: ${prefix} is invalid`);
    }
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
            const path = this.genpath(prefix, pkg, version, type);
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
                let num = await this._db.delete(pkg, version, type).catch(() => { });
                if (num > 0) {
                    const path = this.genpath(prefix, pkg, version, type);
                    await this._wd.deleteFile(path).catch((err) => { throw err});
                    fs.createReadStream(`${nedb}`).pipe(this._wd.createWriteStream(`${remotedb}`, { overwrite: true })).on('finish', resolve(`delete pkg: ${pkg}, version: ${version}, type: ${type} sucessfully from server`)).on('error', err => { reject(err) });
                }
                resolve(`no need to delete pkg: ${pkg}, version: ${version}, type: ${type}`);
            })().catch((err) => { 
                if(err.response){
                    reject(err.response.data);
                }else{
                    reject(err);
                }
             });
        });
    }

    async uploadpkg(pkg, version, type, file) {
        pkg = pkg.toLowerCase();
        version = version.toLowerCase();
        type = type.toLowerCase();
        file = file.toLowerCase();

        await this.init().catch(() => { });
        if (!fs.existsSync(file)) {
            throw new Error(`file: ${file} does not exist`);
        }

        //create dobject
        const ob = new dobject.DataObject(pkg, version, type);
        file = fpath.resolve(file);
        ob.calmd5(file).then(data => {
            ob.md5 = data
        }).catch(e => { throw e });

        let stats = fs.statSync(file);
        ob.filesize = stats.size;

        return new Promise((resolve, reject) => {
            try {
                const path = this.genpath(prefix, pkg, version, type);
                //create a parant list for looping
                const dirlist = []
                const dirpaths = path.split('/');
                dirpaths.shift();
                while (dirpaths.length > 1) {
                    dirlist.push((dirlist[dirlist.length - 1] || '') + '/' + dirpaths.shift());
                }
                (async () => {
                    //create parant dir
                    await this.createDirifNotExist(dirlist);

                    //upload package
                    fs.createReadStream(file).pipe(this._wd.createWriteStream(path)).on('finish', () => {
                        (async () => {
                            await this._db.save(ob).then(data => {
                                fs.createReadStream(`${nedb}`).pipe(this._wd.createWriteStream(`${remotedb}`, { overwrite: true })).on('error', err => { reject(err) });
                            });
                        })();
                    }).on('error', err => { throw err }).on('finish', resolve(`upload pkg: ${pkg} to the server finished`));
                })().catch((err) => {
                    if(err.response){
                        reject(err.response.data);
                    }else{
                        reject(err);
                    }
                 });
            } catch (e) {
                reject(`error occurs when uploading pkg: ${e}`);
            }
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

module.exports = {
    Client,
    Server
}