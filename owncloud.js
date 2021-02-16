const webdav = require('webdav');
const fs = require('fs');
const fpath = require('path');
const dbase = require('./db');
const dobject = require('./do');
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;
const prefix = '/share';
const nedb = 'nedb';
const remotedb = `${prefix}/dbfile`;

class OwnCloud{
    constructor(url, name, pass){
        this._wd = webdav.createClient(url, {
            username: name, 
            password: pass
        });
    }

    async getDir(path){
        const content = await this._wd.getDirectoryContents("/");
        return await this._wd.getDirectoryContents(path).then(data => {
            return data;
        }).catch(err => {
            throw new Error(err);
        })
    }

    async getQuota(){
        return await this._wd.getQuota().then(data => {return data}).catch(err => {
            throw new Error(err);
        });
    }

    async getstat(path){
        return await this._wd.stat(path).then(data => {return data}).catch(err => {
            throw new Error(err);
        });
    }

    async exists(file){
        return await this._wd.exists(file);
    }

    //file => file in owncloud
    //location => local destination
    downloadfile(file, location){
        this._wd.createReadStream(file).pipe(fs.createWriteStream(location));
    }

    getdownloadlink(file){
        return this._wd.getFileDownloadLink(file);
    }

    genpath(prefix, pkg, version, type){
        if(prefix && prefix[0] === '/'){
            return fpath.posix.join(prefix, type, pkg, version, 'image');
        }else if (prefix && prefix[0] !== '/'){
            return fpath.posix.join('/', prefix, type, pkg, version, 'image');
        }
        throw new Error(`could not genpath, the prefix: ${prefix} is invalid`);
    }
}

class Client extends OwnCloud{
    constructor(url, name, pass){
        super(url, name, pass);

        this.exists(`${remotedb}`).then(data =>{
            if(data){
                this.downloadfile(`${remotedb}`, `${nedb}`)
            }
        }).catch(e => {throw e});

        this._db = new dbase.DataBase(`${nedb}`);
    }

    async search(pkg){
        return await this._db.findall(pkg);
    }

    async searchpkg(pkg, version, type){
        return await this._db.find(pkg, version, type);
    }

    async download(pkg, version, type, location){
        this.searchpkg(pkg, version, type).catch(e => {throw e});
        const path = this.genpath(prefix, pkg, version, type)
        if(await this.exists(path)){
            return new Promise((resolve, reject) => {
                try{
                    this.downloadfile(path, location);
                    resolve(`download from ${path} to ${location} finished`);
                }catch(e){
                    reject(e);
                }
            })
        }else{
            throw new Error(`${path} does not exist`);
        }
    }
}

class Server extends OwnCloud{
    constructor(url, name, pass){
        super(url, name, pass);

        this.exists(`${remotedb}`).then(data =>{
            if(data){
                this.downloadfile(`${remotedb}`, `${nedb}`);
            }
        }).catch(e => {throw e});

        if(fs.existsSync(`${nedb}`) === false){
            //create file
            fs.open(`${nedb}`, 'w', function(err, fd){
                if(err) throw err;
                fs.close(fd, (e) =>{
                    if(e){
                        throw e;
                    }
                });
            });
        }
        this._db = new dbase.DataBase(`${nedb}`);
    }

    async delete(path){
        return await this._wd.deleteFile(path).then(data => {return data}).catch(err => {
            throw new Error(err);
        })
    }

    deletepkg(pkg, version, type){
        try{
            this._db.find(pkg, version, type).then(data =>{
                this._db.delete(pkg, version, type).catch(e => {throw e});
                const path = this.genpath(prefix, pkg, version, type);
                this.delete(path).catch(e => {throw e});
            });
            fs.createReadStream(`${nedb}`).pipe(this._wd.createWriteStream(`${remotedb}`, {overwrite: true}));
        }catch(e){
            throw e;
        }
    }

    uploadpkg(pkg, version, type, file){
        if(!fs.existsSync(file)){
            throw new Error(`file: ${file} does not exist`);
        }

        //create dobject
        const ob = new dobject.DataObject(pkg, version, type);
        file = fpath.resolve(file);
        ob.calmd5(file).then(data => {
            ob.md5 = data
        }).catch(e => {throw e});

        try{
            const path = this.genpath(prefix, pkg, version, type);
            //create a parant list for looping
            const dirlist = []
            const dirpaths = path.split('/');
            dirpaths.shift();
            while(dirpaths.length > 1){
                dirlist.push((dirlist[dirlist.length - 1] || '') + '/' + dirpaths.shift());
            }
            //create parant dir
            this.createDirifNotExist(dirlist).then(data =>{
                //upload package
                fs.createReadStream(file).pipe(this._wd.createWriteStream(path));
            }).catch(e => {throw e});

            //upload db file
            this._db.save(ob).then(data =>{
                fs.createReadStream(`${nedb}`).pipe(this._wd.createWriteStream(`${remotedb}`, {overwrite: true}));
            }).catch(e => {throw e});
        }catch(e){
            throw e;
        }
    }

    async createDirifNotExist(paths){
        for(let i = 0; i<paths.length; i++){
            if(await this._wd.exists(paths[i]) === false){
                await this._wd.createDirectory(paths[i]).catch(e => {
                    throw e;
                })
            }
        }
    }
}

module.exports ={
    Client,
    Server
}