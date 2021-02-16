const md5file = require('md5-file');
const fs = require('fs');

class DataObject{
    constructor(name, version, type){
        this._name = name;
        this._version = version;
        this._type = type;
        this._timestamp = Date.now();
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

    get md5(){
        return this._md5;
    }

    get type(){
        return this._type;
    }

    calmd5(path){
        return new Promise((resolve, reject) =>{
            if(path && fs.existsSync(path)){
                md5file(path).then(data =>{
                    resolve(data)
                }).catch(e => {
                    reject(e)
                })
            }else{
                reject(`could not find ${path}`);
            }
        })
    }
};

module.exports ={
    DataObject
}