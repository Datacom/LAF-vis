# site_starter

> This uses Browserify and npm-css for bundling of js and css respectively

## Getting Started

Install dependencies:

```bash
$ npm install
```

### Usage

To run this during development use:

```bash
$ npm start
```

This will use watchify and watch to update the bundled js and css respectively.
It will use browser-sync to serve and should automatically cause this application to open in your browser.
bundle.css must be created before the first stare (npm run build:css)

***

To build this locally and start a simple server so you can test it use:

```bash
$ npm run dist
$ cd dist && python -m SimpleHTTPServer
```

This will put all static files and bundled js & css into the dist folder
(It will ignore any files in the js and css folders inside app) before starting the server.

***

To deploy the build execute:

```bash
$ npm run deploy
```

This won't automatically clean & build the dist folder so you will need to execute that first.
