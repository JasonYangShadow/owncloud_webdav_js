# owncloud_webdav_js
A nodejs module for accessing owncloud instance via webdav protocol

Example:

1. search pkg
```javascript
//require owncloud
const ocloud= require('owncloud');
//initialize client with url, user, pass(app pass)
const oc = new ocloud.Client(url, user, pass);
//search pkg with name
oc.search(pkg).then(data => {console.log(data)}).catch(e => console.error(e));
```

2. search specific pkg
```javascript
//require owncloud
const ocloud= require('owncloud');
//initialize client with url, user, pass(app pass)
const oc = new ocloud.Client(url, user, pass);
//search pkg with specific properties, pkg name, version ,type(Docker, Singularity, OCI, LPMX and etc)
oc.searchpkg(pkg, ver, type).then(data => {console.log(data)}).catch(e => console.error(e));
```

3. download pkg
```javascript
//require owncloud
const ocloud= require('owncloud');
//initialize client with url, user, pass(app pass)
const oc = new ocloud.Client(url, user, pass);
//downoad pkg with pkg name, version, type, target lacation
oc.download(pkg, ver, type, location).then(data => {console.log(data)}).catch(e => console.error(e));
```

4. upload pkg
```javascript
//require owncloud
const ocloud= require('owncloud');
//initialize server with url, user, pass(app pass)
const os = new ocloud.Server(url, user, pass);
//upload pkg and set its properties, location => the target pkg being uploaded
os.uploadpkg(pkg, ver, type, location).then(data => {console.log(data)}).catch(e =>{
    console.error(e);
});
```

5. delete pkg 
```javascript
//require owncloud
const ocloud= require('owncloud');
//initialize server with url, user, pass(app pass)
const os = new ocloud.Server(url, user, pass);
//delete pkg with properties
os.deletepkg(pkg, ver, type).then(data => {console.log(data)}).catch(e =>{
    console.error(e);
});
```