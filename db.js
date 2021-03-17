const Datastore = require('nedb');
const dobject = require('./do')

const ops = ['lte', 'lt', 'gt', 'gte'];

class DataBase{
    constructor(filepath){
        this._db = new Datastore({filename: filepath, autoload: true});
    }

    save(record){
        if(!record instanceof(dobject.DataObject)){
            throw new Error(`the record is not instance of DataObject`);
        }

        this._db.count({_name: record.name, _version: record.version, _type: record.type}, function(err, count){
            if(err){
                throw new Error(`can not count data ${record}, error: ${err}`);
            }
            if(count > 0){
                throw new Error(`record already exists ${record.name}:${record.version}:${record.type}`);
            }
        })

        return new Promise((resolve, reject) =>{
            this._db.insert(record, function(err, doc){
                if(err){
                    reject(`can not insert data: ${record.name}:${record.version}:${record.type} into nedb, error:${err}`);
                }
                resolve(doc._id);
                });
        });
    }

    findall(name){
        return new Promise((resolve, reject) =>{
            this._db.find({_name: name}).sort({_timestamp: -1}).exec(function(err, docs){
                if(err){
                    reject(`can not find data: name: ${name}`);
                }
                resolve(docs);
            });
        });
    }

    find(name, version, type){
        return new Promise((resolve, reject) =>{
            this._db.findOne({_name: name, _version: version, _type: type}, function(err, doc){
                if(err){
                    reject(`can not find data: ${name}:${version}:${type} from nedb, error:${err}`)
                }
                resolve(doc)
            });
        });
    }

    findregx(name, version, type, op){
        return new Promise((resolve, reject) => {
            if(ops.indexOf(op) == -1){
                reject(`op: ${op} should be one of {'lt', 'lte', 'gt','gte'}`);
            }
            
            let condi = undefined;
            if(op === 'lt'){
                condi={$lt: version};
            }else if(op === 'lte'){
                condi={$lte: version};
            }else if(op === 'gt'){
                condi={$gt: version};
            }else{
                condi={$gte: version};
            }

            if(type){
                this._db.find({_name: name, _version: condi, _type: type}).sort({_timestamp: -1}).exec(function(err, docs){
                    if(err){
                        reject(`can not find data: ${name}:${version}:${type} from nedb, error:${err}`)
                    }
                    resolve(docs);
                });
            }else{
                this._db.find({_name: name, _version: condi}).sort({_timestamp: -1}).exec(function(err, docs){
                    if(err){
                        reject(`can not find data: ${name}:${version} from nedb, error:${err}`)
                    }
                    resolve(docs);
                });
            }
        });
    }

    delete(name, version, type){
        return new Promise((resolve, reject) =>{
            this._db.remove({_name: name, _version: version, _type: type}, function(err, num){
                if(err){
                    reject(`can not delete data:${name}:${version}:${type} from nedb with error: ${err}`);
                }
                resolve(num)
            });
        });
    }

};

module.exports = {
    DataBase
}