'use strict';

var gulp = require('gulp');
var bump = require('gulp-bump');
var concat = require('gulp-concat');
var filter = require('gulp-filter');
var inject = require('gulp-inject');
var minifyCSS = require('gulp-minify-css');
var minifyHTML = require('gulp-minify-html');
var plumber = require('gulp-plumber');
var sourcemaps = require('gulp-sourcemaps');
var template = require('gulp-template');
var tsc = require('gulp-typescript');
var uglify = require('gulp-uglify');
var watch = require('gulp-watch');
var rename = require("gulp-rename");
var replace = require('gulp-replace');
var glob = require('glob');

var Builder = require('systemjs-builder');
var del = require('del');
var fs = require('fs');
var path = require('path');
var join = path.join;
var runSequence = require('run-sequence');
var semver = require('semver');
var series = require('stream-series');

var express = require('express');
var serveStatic = require('serve-static');
var openResource = require('open');

var tinylr = require('tiny-lr')();
var connectLivereload = require('connect-livereload');
var q = require('q');

// --------------
// Configuration.
var APP_BASE = '/webresources/test1_/';

var PATH = {
  dest: {
    all: 'dist',
    dev: {
      solutionName:'test1_',
      all: 'dist/dev/webresources/test1_',
      lib: 'dist/dev/webresources/test1_/lib',
      ng2: 'dist/dev/webresources/test1_/lib/angular2.js',
      bootstrap: 'dist/dev/webresources/test1_/lib/bootstrap',
      fontawesome: 'dist/dev/webresources/test1_/lib/fontawesome',
      router: 'dist/dev/webresources/test1_/lib/router.js'
    },
    prod: {
      solutionName:'test2_',
      all: 'dist/prod',
      lib: 'dist/prod/lib'
    }
  },
  src: {
    // Order is quite important here for the HTML tag injection.
    lib: [
      './node_modules/angular2/node_modules/traceur/bin/traceur-runtime.js',
      './node_modules/es6-module-loader/dist/es6-module-loader-sans-promises.js',
      './node_modules/es6-module-loader/dist/es6-module-loader-sans-promises.js.map',
      './node_modules/reflect-metadata/Reflect.js',
      './node_modules/reflect-metadata/Reflect.js.map',
      './node_modules/systemjs/dist/system.src.js',
      './node_modules/angular2/node_modules/zone.js/dist/zone.js',
      './node_modules/jquery/dist/jquery.js',
      './node_modules/chart.js/Chart.js'
      ],
      bootstrap: { 
        base:'./node_modules/bootstrap/dist',
        js:   ['./node_modules/bootstrap/dist/js/bootstrap.js'],
        css:  ['./node_modules/bootstrap/dist/css/bootstrap.css',
               './node_modules/bootstrap/dist/css/bootstrap-theme.css'],
        fonts: ['./node_modules/bootstrap/dist/fonts/*']},
      fontawesome:{
        base: './node_modules/font-awesome',
        css: ['./node_modules/font-awesome/css/font-awesome.css'],
        fonts: ['./node_modules/font-awesome/fonts/*']
}}};

var PORT = 5555;
var LIVE_RELOAD_PORT = 4002;

var ng2Builder = new Builder({
  paths: {
    'angular2/*': 'node_modules/angular2/es6/dev/*.js',
    rx: 'node_modules/angular2/node_modules/rx/dist/rx.js'
  },
  meta: {
    // auto-detection fails to detect properly here - https://github.com/systemjs/builder/issues/123
    'rx': {
      format: 'cjs'
    },
    'angular2/src/router/route_definition': {
      format: 'es6'
    }
  }
});

var appProdBuilder = new Builder({
  baseURL: 'file:./tmp',
  meta: {
    'angular2/angular2': { build: false },
    'angular2/router': { build: false }
  }
});

var HTMLMinifierOpts = { conditionals: true };

var tsProject = tsc.createProject('tsconfig.json', {
  typescript: require('typescript')
});

var semverReleases = ['major', 'premajor', 'minor', 'preminor', 'patch',
                      'prepatch', 'prerelease'];

// --------------
// Clean.

gulp.task('clean', function (done) {
  del(PATH.dest.all, done);
});

gulp.task('clean.dev', function (done) {
  del(PATH.dest.dev.all, done);
});

gulp.task('clean.app.dev', function (done) {
  // TODO: rework this part.
  del([join(PATH.dest.dev.all, '**/*'), 
        '!' + PATH.dest.dev.lib, 
        '!' + join(PATH.dest.dev.lib, '*'),
        '!' + join(PATH.dest.dev.lib, '**/*')], done);
});

gulp.task('clean.prod', function (done) {
  del(PATH.dest.prod.all, done);
});

gulp.task('clean.app.prod', function (done) {
  // TODO: rework this part.
  del([join(PATH.dest.prod.all, '**/*'), '!' +
       PATH.dest.prod.lib, '!' + join(PATH.dest.prod.lib, '*')], done);
});

gulp.task('clean.tmp', function(done) {
  del('tmp', done);
});

// --------------
// Build dev.

gulp.task('build.ng2.dev', function () {
  ng2Builder.build('angular2/router', PATH.dest.dev.router, {});
  return ng2Builder.build('angular2/angular2', PATH.dest.dev.ng2, {});
});

gulp.task('build.bootstrap.dev.css', function () {
  return buildCssWitFonts(PATH.src.bootstrap.fonts,PATH.src.bootstrap.css, PATH.src.bootstrap.base,PATH.dest.dev.bootstrap);
});

gulp.task('build.bootstrap.dev.fonts', function () {
  return deployAndRename(PATH.src.bootstrap.fonts, PATH.src.bootstrap.base, PATH.dest.dev.bootstrap);
});

gulp.task('build.bootstrap.dev.js', function () {
  return deployAndRename(PATH.src.bootstrap.js, PATH.src.bootstrap.base, PATH.dest.dev.bootstrap);
});

gulp.task('build.bootstrap.dev', function (done) {
  runSequence('build.bootstrap.dev.css','build.bootstrap.dev.fonts','build.bootstrap.dev.js',done);
});

gulp.task('build.fontawesome.dev.css', function () {
  return buildCssWitFonts(PATH.src.fontawesome.fonts,PATH.src.fontawesome.css, PATH.src.fontawesome.base ,PATH.dest.dev.fontawesome);
});

gulp.task('build.fontawesome.dev.fonts', function () {
  return deployAndRename(PATH.src.fontawesome.fonts, PATH.src.fontawesome.base, PATH.dest.dev.fontawesome);
});

gulp.task('build.fontawesome.dev', function (done) {
  runSequence('build.fontawesome.dev.css','build.fontawesome.dev.fonts', done);
});

gulp.task('build.lib.dev', ['build.bootstrap.dev', 'build.fontawesome.dev','build.ng2.dev'], function () {
  return gulp.src(PATH.src.lib)
    .pipe(rename(function(path){ 
          path.basename=path.basename.replace(/-/g,"_");}))
    .pipe(gulp.dest(PATH.dest.dev.lib));
});

gulp.task('build.js.dev', function () {
  var result = gulp.src('./app/**/*ts')
    .pipe(plumber())
    .pipe(sourcemaps.init())
    .pipe(tsc(tsProject));

  return result.js
    .pipe(sourcemaps.write())
    .pipe(template(templateLocals()))
    .pipe(gulp.dest(PATH.dest.dev.all));
});

gulp.task('build.assets.dev', ['build.js.dev'], function () {
  return gulp.src(['./app/**/*.html', './app/**/*.css', './app/**/*.jpg'])
    .pipe(rename(function(path){ 
          path.basename=path.basename.replace(/-/g,"_");}))
    .pipe(gulp.dest(PATH.dest.dev.all));
});

gulp.task('build.index.dev', function() {
  var target = gulp.src(injectableDevAssetsRef(), { read: false });
  return gulp.src('./app/index.html')
    .pipe(inject(target, { transform: transformPath('dev') }))
    .pipe(template(templateLocals()))
    .pipe(gulp.dest(PATH.dest.dev.all));
});


gulp.task('build.app.dev', function (done) {
  runSequence('clean.app.dev', 'build.assets.dev', 'build.index.dev', done);
});

gulp.task('build.dev', function (done) {
  runSequence('clean.dev', 'build.lib.dev', 'build.app.dev', done);
});

// --------------
// Build prod.

gulp.task('build.ng2.prod', function () {
  ng2Builder.build('angular2/router', join('tmp', 'router.js'), {});
  return ng2Builder.build('angular2/angular2', join('tmp', 'angular2.js'), {});
});

gulp.task('build.lib.prod', ['build.ng2.prod'], function () {
  var jsOnly = filter('**/*.js');
  var lib = gulp.src(PATH.src.lib);
  var ng2 = gulp.src('tmp/angular2.js');
  var router = gulp.src('tmp/router.js');

  return series(lib, ng2, router)
    .pipe(jsOnly)
    .pipe(concat('lib.js'))
    .pipe(uglify())
    .pipe(gulp.dest(PATH.dest.prod.lib));
});

gulp.task('build.js.tmp', function () {
  var result = gulp.src(['./app/**/*ts', '!./app/init.ts'])
    .pipe(plumber())
    .pipe(tsc(tsProject));

  return result.js
    .pipe(template({ VERSION: getVersion() }))
    .pipe(gulp.dest('tmp'));
});

// TODO: add inline source maps (System only generate separate source maps file).
gulp.task('build.js.prod', ['build.js.tmp'], function() {
  return appProdBuilder.build('app', join(PATH.dest.prod.all, 'app.js'),
    { minify: true }).catch(function (e) { console.log(e); });
});

gulp.task('build.init.prod', function() {
  var result = gulp.src('./app/init.ts')
    .pipe(plumber())
    .pipe(sourcemaps.init())
    .pipe(tsc(tsProject));

  return result.js
    .pipe(uglify())
    .pipe(template(templateLocals()))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(PATH.dest.prod.all));
});

gulp.task('build.assets.prod', ['build.js.prod'], function () {
  var filterHTML = filter('**/*.html');
  var filterCSS = filter('**/*.css');
  return gulp.src(['./app/**/*.html', './app/**/*.css'])
    .pipe(filterHTML)
    .pipe(minifyHTML(HTMLMinifierOpts))
    .pipe(filterHTML.restore())
    .pipe(filterCSS)
    .pipe(minifyCSS())
    .pipe(filterCSS.restore())
    .pipe(gulp.dest(PATH.dest.prod.all));
});

gulp.task('build.index.prod', function() {
  var target = gulp.src([join(PATH.dest.prod.lib, 'lib.js'),
                         join(PATH.dest.prod.all, '**/*.css')], { read: false });
  return gulp.src('./app/index.html')
    .pipe(inject(target, { transform: transformPath('prod') }))
    .pipe(template(templateLocals()))
    .pipe(minifyHTML(HTMLMinifierOpts))
    .pipe(gulp.dest(PATH.dest.prod.all));
});

gulp.task('build.app.prod', function (done) {
  // build.init.prod does not work as sub tasks dependencies so placed it here.
  runSequence('clean.app.prod', 'build.init.prod', 'build.assets.prod',
              'build.index.prod', 'clean.tmp', done);
});

gulp.task('build.prod', function (done) {
  runSequence('clean.prod', 'build.lib.prod', 'clean.tmp', 'build.app.prod',
              done);
});

// Deploy

gulp.task('deploy.dev.copy', function () {
  var dest = join('./tmp/WebResources',PATH.dest.dev.solutionName);
  return gulp.src(join(PATH.dest.dev.all,'/**/*'))
  .pipe(gulp.dest(dest));
});


gulp.task('deploy.dev',['deploy.dev.copy'], function (done) {

  var tempPath = join('./tmp/WebResources',PATH.dest.dev.solutionName);
  tempPath = join(tempPath,"/**");
  getGlobFiles([tempPath], function (webResourceFiles) {
      for (var i = 0; i < webResourceFiles.length; i++) {
        var webResourceFile = webResourceFiles[i];
        if(!fs.statSync(webResourceFile).isDirectory()) {
          var webResourceProperties = webResourceFile + ".data.xml";
          console.log(webResourceProperties);
          webResourceProperties = path.resolve(webResourceProperties);
          //fs.writeFile(webResourceProperties, "<WebResource></WebResource>", function(err) { if(err) console.log("error:%s", err); }); 
        }
      }
      if(done) done();
});
});

function getWebResourcesPropertiesXml(filename){
  return "<WebResource>" +  
        "<Name>" + filename + "</Name>" +
        "<DisplayName>"+filename+"</DisplayName>" +
        "<WebResourceType>3</WebResourceType>" +
        "<IsCustomizable>1</IsCustomizable>" +
        "<CanBeDeleted>1</CanBeDeleted>" +
        "<IsHidden>0</IsHidden>" +
        "<FileName>/WebResources/lema_bulkDecisionFormjs130CAE45-3AD1-E311-82B9-005056AE0006</FileName>" +
        "</WebResource>";
}


// --------------
// Version.

registerBumpTasks();

gulp.task('bump.reset', function() {
  return gulp.src('package.json')
    .pipe(bump({ version: '0.0.0' }))
    .pipe(gulp.dest('./'));
});

// --------------
// Test.

// To be implemented.

// --------------
// Serve dev.

gulp.task('serve.dev', ['build.dev', 'livereload'], function () {
  watch('./app/**', function (e) {
    runSequence('build.app.dev', function () {
      notifyLiveReload(e);
    });
  });
  serveSPA('dev');
});

// --------------
// Serve prod.

gulp.task('serve.prod', ['build.prod', 'livereload'], function () {
  watch('./app/**', function (e) {
    runSequence('build.app.prod', function () {
      notifyLiveReload(e);
    });
  });
  serveSPA('prod');
});

// --------------
// Livereload.

gulp.task('livereload', function() {
  tinylr.listen(LIVE_RELOAD_PORT);
});

// --------------
// Utils.

function notifyLiveReload(e) {
  var fileName = e.path;
  tinylr.changed({
    body: {
      files: [fileName]
    }
  });
}

function transformPath(env) {
  return function (filepath) {
    var filename = filepath.replace('/' + PATH.dest[env].all, '');
    arguments[0] = join(APP_BASE, filename);
    return inject.transform.apply(inject.transform, arguments);
  };
}

function injectableDevAssetsRef() {
  var src = PATH.src.lib.map(function(path) {
    return join(PATH.dest.dev.lib, path.split('/').pop());
  });
  // add bootstrap
  src = src.concat(
  PATH.src.bootstrap.js.map(function(path){
      return join(PATH.dest.dev.bootstrap, 
                  path.substr(PATH.src.bootstrap.base.length+1));
  }));
  src = src.concat(
  PATH.src.bootstrap.css.map(function(path){
      return join(PATH.dest.dev.bootstrap, 
                  path.substr(PATH.src.bootstrap.base.length+1));
  }));
  // font awesome
  src = src.concat(
  PATH.src.fontawesome.css.map(function(path){
      return join(PATH.dest.dev.fontawesome, 
                  path.substr(PATH.src.fontawesome.base.length+1));
  })); 
  // angular router
  src.push(PATH.dest.dev.ng2, PATH.dest.dev.router,
           join(PATH.dest.dev.all, '**/*.css'));
  // remove special chars
  src = src.map(function(path){ return path.replace(/-/g,"_");});
  return src;
}

function getVersion(){
  var pkg = JSON.parse(fs.readFileSync('package.json'));
  return pkg.version;
}

function templateLocals() {
  return {
    VERSION: getVersion(),
    APP_BASE: APP_BASE
  };
}

function registerBumpTasks() {
  semverReleases.forEach(function (release) {
    var semverTaskName = 'semver.' + release;
    var bumpTaskName = 'bump.' + release;
    gulp.task(semverTaskName, function() {
      var version = semver.inc(getVersion(), release);
      return gulp.src('package.json')
        .pipe(bump({ version: version }))
        .pipe(gulp.dest('./'));
    });
    gulp.task(bumpTaskName, function(done) {
      runSequence(semverTaskName, 'build.app.prod', done);
    });
  });
}

function logRequests(req, res, next){ 
  console.log("req: %s",req.path); 
  next(); 
}

function serveSPA(env) {
  var app;
  app = express().use(APP_BASE, logRequests , connectLivereload({ port: LIVE_RELOAD_PORT }), serveStatic(join(__dirname, PATH.dest[env].all)));
  /*app.get(APP_BASE + '*', function (req, res, next) {
    res.sendFile(join(__dirname, PATH.dest[env].all, 'index.html'));
  });*/
  app.listen(PORT, function () {
    openResource('http://localhost:' + PORT + APP_BASE);
  });
}

function getGlobFiles(patterns, done, current, foundFiles) {
  if (!current) current = 0;
  if (current < patterns.length) {
    var pattern = patterns[current];
    glob(pattern, function (er, files) {
      if(!foundFiles) foundFiles = [];
      getGlobFiles(patterns,done, current+1,foundFiles.concat(files));
    });
  }
  else{
    done(foundFiles);
  }
}


/** Copies the bootstrap files from the source to the destination
renaming the files in order to adapt them to the CRM web resources syntax 
and then replace the font names inside the css, so they match the renamed 
font names also */
function buildCssWitFonts(fontsPaths,cssSource, cssSourceBase, cssDest){
  
  // TODO: The IE Fix has to be restored
  var versioningRegExp = "(\\?(#iefix&){0,1}v=((\\d\\.{0,1}))+)*"; // looks for the versioning parameter after the font name

    // Promise
  var deferred = q.defer();
  
  // Replace the name of the fonts inside the css files
  getGlobFiles(fontsPaths, function (fontFiles) {
    
    //console.log(cssSource);
    var cssFiles = gulp.src(cssSource, {base:cssSourceBase} )
          // correct file name
          .pipe(rename(function(path){ 
                        path.basename=path.basename.replace(/-/g,"_");}));
    
    for (var index = 0; index < fontFiles.length; index++) {
          var fontFile = fontFiles[index];
          //console.log(fontFile);
          fontFile = path.basename(fontFile);
          //console.log(fontFile);
          var fontFileRegExp = new RegExp(fontFile+versioningRegExp,"g");
          //console.log(fontFileRegExp);
          var correctedFileName = fontFile.replace(/-/g,"_");
          //console.log(correctedFileName);
          
          //replace the name of the font
          cssFiles.pipe(replace(fontFileRegExp,correctedFileName));
    }
    // write the file
    cssFiles.pipe(gulp.dest(cssDest));
    deferred.resolve(); // resolve promise
  });
  
  return deferred.promise;
}

function deployAndRename(source, base, dest){
  return gulp.src(source, {base:base} )
          .pipe(rename(function(path){ 
            path.basename=path.basename.replace(/-/g,"_");}))
          .pipe(gulp.dest(dest));
}