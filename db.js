const db = require('nedb');

class DataBase{
    constructor(filepath){
        this._db = new DataStore({filepath: filepath, autoload: true});
    }

    save(record){
        if(!record instanceof(DataObject)){
            throw new Error(`the record is not instance of DataObject`);
        }

        this._db.insert(record, function(err, doc){
            if(err){
                throw new Error(`can not insert data: ${record} into nedb, error:${err}`);
            }
            return doc._id;
        })
    }

    find(name, version){
        this._db.findOne({name: name, version: version}, function(err, doc){
            if(err){
                throw new Error(`can not find data: ${name}:${version} from nedb, error:${err}`)
            }
            return doc;
        })
    }

    delete(name, version){
        this._db.remove({name: name, version: version}, function(err, num){
            if(err){
                throw new Error(`can not delete data:${name}:${version} from nedb with error: ${err}`);
            }

            return num;
        })
    }

};

module.exports = {
    DataBase
}