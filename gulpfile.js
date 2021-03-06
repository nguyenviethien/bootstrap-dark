
const gulp = require( 'gulp' );
const sass = require( 'gulp-sass' );
sass.compiler = require( 'node-sass' );
const maps = require( 'gulp-sourcemaps' );
const prfx = require( 'gulp-autoprefixer' );
const tidy = require( 'gulp-prettier' );
const mini = require( 'gulp-clean-css' );
const renm = require( 'gulp-rename' );
const imgs = require( 'gulp-imagemin' );
const _log = require( 'fancy-log' );
const __if = require( 'gulp-if' );
const sync = require( 'browser-sync' ).create();

var paths = {
	sassSrc: [
		'./scss/**/*.scss',
		'./scss/**/!_*.scss'
		],
	// sassSrc: './scss/bootstrap-nightfall.scss',  // TODO, remove this, used in debug
	sassWatch: './scss/**/*.scss',
	htmlWatch: '**/*.html',
	sassIncludes: [ /* 'node_modules/bootstrap/scss' */ ],
	cssOut: './dist',
  htDocs: './',
  imgSrc: './img/src/*.+(png|jpg|gif|svg)',
  imgOut: './img/',
};

function sassTask(name, min = false) {
	gulp.task( name, function(done) {
		return gulp.src( paths.sassSrc )
			.on( 'error', console.error.bind( console ))
			.pipe( maps.init( { largeFile: true } ) )
			.pipe( maps.identityMap() )
			.pipe( sass( {
				outputStyle: 'expanded',  // don't compress, issues with autoprefixer
				errorLogToConsole: true,
				includePaths: paths.sassIncludes
				} ) )
			.pipe( prfx( {
				overrideBrowserslist: [ 'last 2 versions', 'ie >= 9', 'android >= 4.4', 'ios >= 7' ]
				} ) )
			.pipe( __if( !min, tidy( {  // @see: https://prettier.io/docs/en/options.html
				useTabs: false,
				tabWidth: 2
				} ) ) )
			.pipe( __if( min, mini( { compatibility: 'ie9' } ) ) )
			.pipe( __if( min, renm( { suffix: '.min' } ) ) )
	 		.pipe( maps.write( '.', { includeContent: false } ) )
			.pipe( gulp.dest( paths.cssOut ) )
			.pipe( sync.stream( { match: '**/*.css' } ) );
	});
}

sassTask( 'sass:css', false );
sassTask( 'sass:min', true );
gulp.task( 'sass', gulp.parallel( 'sass:css' , 'sass:min' ) );


gulp.task('images', function(done) {
  return gulp.src( paths.imgSrc )
    .on( 'error', console.error.bind( console ))
    .pipe( imgs( [
      imgs.gifsicle({interlaced: true}),
      // imgs.jpegtran({progressive: true}),
      imgs.mozjpeg({quality: 75, progressive: true}),
      imgs.optipng({optimizationLevel: 5}),
      imgs.svgo({
        plugins: [
          {removeDoctype: true},
          {removeXMLProcInst: true},
          {removeComments: true},
          {removeMetadata: true},
          {removeTitle: true},
          {removeDesc: true},
          {removeEditorsNSData: true},
          {removeEmptyAttrs: true},
          {removeHiddenElems: true},
          {removeEmptyText: true},
          {removeEmptyContainers: true},
          {removeViewBox: true},
          {removeUselessStrokeAndFill: true},
          // maintain <style> blocks
          {removeStyleElement: false},
          {inlineStyles: false},
          {minifyStyles: true},
          {convertStyleToAttrs: false},
          // keep scripts
          {removeScriptElement: false},
          // keep id's
          {cleanupIDs: false}
          ]
        })
      ]) )
    .pipe( gulp.dest( paths.imgOut ) );
});


gulp.task('server', function(done) {
	_log( 'Serving ... \x1b[91m(Press Control-C to end.)\x1b[0m' );
	sync.init( {
		port: 80,
		ui: { port: 9090 },
		server: { baseDir: paths.htDocs }
	});
	gulp.watch( paths.sassWatch, gulp.series( 'sass' ) );
	gulp.watch( paths.htmlWatch ).on( 'change', sync.reload );
	return done();
});


gulp.task( 'watch', function(done) {
	_log( 'Watching ... \x1b[94m(Press Control-C to end.)\x1b[0m' );
	gulp.watch( paths.sassWatch, gulp.series( 'sass' ) );
	return done();
} );


gulp.task( 'default', gulp.series( 'sass', 'images' ) );
