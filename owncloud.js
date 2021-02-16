const webdav = require('webdav');
const fs = require('fs');
const dbase = require('./db');
const dobject = require('./do');
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;
const prefix = '/share';

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
        if(prefix instanceof string && prefix && prefix[0] === '/'){
            if(prefix[-1] === '/'){
                return `${prefix}${type}/${pkg}/${version}/image`;
            }else{
                return `${prefix}/${type}/${pkg}/${version}/image`;
            }
        }else if (prefix instanceof string && prefix && prefix[0] !== '/'){
            if(prefix[-1] === '/'){
                return `/${prefix}${type}/${pkg}/${version}/image`;
            }else{
                return `/${prefix}/${type}/${pkg}/${version}/image`;
            }
        }
        throw new Error(`could not genpath, the prefix: ${prefix} is invalid`);
    }
}

class Client extends OwnCloud{
    constructor(url, name, pass){
        super(url, name, pass);

        if (this.exists('/dbfile') === false){
            throw new Error(`can not find server db file`);
        }

        this.downloadfile('/dbfile', './dbfile')
        this._db = new dbase.DataBase('./dbfile');
    }

    async search(pkg){
        return await this._db.findall(pkg);
    }

    async searchpkg(pkg, version, type){
        return await this._db.find(pkg, version, type);
    }

    async download(pkg, version, type, location){
        this.searchpkg(pkg, version, type).then(data =>{
            const path = this.genpath(prefix, pkg, version, type)
            if(this.exists(path)){
                this._db.downloadfile(path, location);
            }
            throw new Error(`remote path: ${path} does not exist`);
        }).catch(err =>{
            throw err;
        })
    }
}

class Server extends OwnCloud{
    constructor(url, name, pass){
        super(url, name, pass);

        if(this.exists('/dbfile')){
            this.downloadfile('/dbfile', './dbfile');
        }
        this._db = new dbase.DataBase('./dbfile');
    }

    async delete(path){
        return await this._wd.deleteFile(path).then(data => {return data}).catch(err => {
            throw new Error(err);
        })
    }

    async deletepkg(pkg, version, type){
        try{
            this._db.find(pkg, version, type).then(data =>{
                this._db.delete(pkg, version, type);
                const path = this.genpath(prefix, pkg, version, type);
                this.delete(path);
            })
            fs.createReadStream('./dbfile').pipe(this._wd.createWriteStream('/dbfile', {overwrite: true}));
        }catch(e){
            throw e;
        }
    }

    async uploadpkg(pkg, version, type, file){
        if(!fs.existsSync(file)){
            throw new Error(`file: ${file} does not exist`);
        }

        //create dobject
        const ob = dobject.DataObject(pkg, version, type);
        ob.path = file;
        ob.md5 = ob.calmd5();

        try{
            const ret = this._db.save(ob);
            this.createDirifNotExist(`${prefix}/${type}`);
            this.createDirifNotExist(`${prefix}/${type}/${pkg}`);
            this.createDirifNotExist(`/${prefix}/${type}/${pkg}/${version}`);
            const path = this.genpath(prefix, pkg, version, type);
            fs.createReadStream(file).pipe(this._wd.createWriteStream(path));
            fs.createReadStream('./dbfile').pipe(this._wd.createWriteStream('/dbfile', {overwrite: true}));
            return ret
        }catch(e){
            throw e;
        }
    }

    async createDirifNotExist(path){
        if(await this._wd.exists(path) === false){
            await this._wd.createDirectory(path).catch(err => {
                throw new Error(err);
            })
        }
    }
}

module.exports ={
    Client,
    Server
}