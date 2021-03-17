const md5file = require('md5-file');
const fs = require('fs');

class DataObject{
    constructor(name, version, type){
        this._name = name.toLowerCase();
        this._version = version.toLowerCase();
        this._type = type.toLowerCase();
        this._timestamp = Date.now();
    }

    set md5(md5){
        this._md5 = md5;
    }

    set filesize(filesize){
        this._filesize = filesize;
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

    get filesize(){
        return this._filesize;
    }

    get type(){
        return this._type;
    }

    get ref(){
        return this._ref;
    }

    set ref(ref){
        this._ref = ref;
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