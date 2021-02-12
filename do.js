const md5file = require('md5-file');
const fs = require('fs');

class DataObject{
    constructor(name, version){
        this._name = name;
        this._version = version;
        this._timestamp = Date.now()
    }

    set path(path){
        this._path = path;
    }

    set md5(md5){
        this._md5 = md5;
    }

    get name(){
        return this._name;
    }

    get version(){
        return this._version;
    }

    get path(){
        return this._path;
    }

    get md5(){
        return this._md5;
    }

    calmd5(){
        if(self._path && fs.existsSync(self._path)){
            md5file(self._path).then(hash => {
                return hash
            })
        }
        return null;
    }
};

module.exports ={
    DataObject
}