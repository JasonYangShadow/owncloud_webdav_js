# owncloud_webdav_js
A nodejs module for accessing owncloud instance via webdav protocol, you can search, upload, and download packages from owncloud using pure js

To manage the existing packages on owncloud, this module employs nedb to save all manipulations. The package related info includes 'package name', 'package version', 'package type'

You have to provide the url address of owncloud instance, user name, as well as app password for the user to complete the request.

you can install the core compoenents by:

```js
npm i owncloud_webdav_js
```

Examples:
1. search pkg
```js
//require owncloud
const ocloud= require('owncloud');
//initialize client with url, user, pass(app pass)
const oc = new ocloud.Client(url, user, pass);
//search pkg with name
oc.search(pkg).then(data => {console.log(data)}).catch(e => console.error(e));
```

2. search specific pkg
```js
//require owncloud
const ocloud= require('owncloud');
//initialize client with url, user, pass(app pass)
const oc = new ocloud.Client(url, user, pass);
//search pkg with specific properties, pkg name, version ,type(Docker, Singularity, OCI, LPMX and etc)
oc.searchpkg(pkg, ver, type).then(data => {console.log(data)}).catch(e => console.error(e));
```

3. download pkg
```js
//require owncloud
const ocloud= require('owncloud');
//initialize client with url, user, pass(app pass)
const oc = new ocloud.Client(url, user, pass);
//downoad pkg with pkg name, version, type, target lacation
oc.download(pkg, ver, type, location).then(data => {console.log(data)}).catch(e => console.error(e));
```

4. upload pkg
```js
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
```js
//require owncloud
const ocloud= require('owncloud');
//initialize server with url, user, pass(app pass)
const os = new ocloud.Server(url, user, pass);
//delete pkg with properties
os.deletepkg(pkg, ver, type).then(data => {console.log(data)}).catch(e =>{
    console.error(e);
});
```

The app.js file inside this repository provides a basic CLI program for accessing these features. You can directly call the program with the following commands:

For example:
```js
node app.js search --url=url --user=user --pass=password --pkg=package_name
```
For details, you can use help commands:
```js
node app.js --help
```