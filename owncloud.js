const webdav = require('webdav');
const fs = require('fs');
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;

class OwnCloud{
    constructor(url, name, pass){
        this._wd = webdav.createClient(url, name, pass);
    }

    async createDirifNotExist(path){
        if(await this._wd.exists(path) === false){
            await this._wd.createDirectory(path).catch(err => {
                throw new Error(err);
            })
        }
    }

    async getDir(path){
        const content = await this._wd.getDirectoryContents("/");
        console.log(content);
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

    async delete(path){
        await this._wd.deleteFile(path).then(data => {return data}).catch(err => {
            throw new Error(err);
        })
    }

    async uploadfile(file, path, overwrite){
        await this._wd.uploadfile(file, path, {onUploadProgress: progress => {
            console.log(`Uploaded ${progress.loaded} bytes of ${progress.total}`)}, overwrite:overwrite}).catch(err => {
                throw new Error(err);
            })
    }

    downloadlargefile(file, location){
        this._wd.createReadStream(file).pipe(fs.createWriteStream(location));
    }

    getdownloadlink(file){
        return this._wd.getFileDownloadLink(file);
    }
}

class Client extends OwnCloud{
    constructor(url, name, pass){
        super(url, name, pass);
    }
}

class Server extends OwnCloud{
    constructor(url, name, pass){
        super(url, name, pass)
    }
}

module.exports ={
    Client,
    Server
}