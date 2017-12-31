const gulp = require('gulp');
const useref = require('gulp-useref');
const watchify = require('watchify');
const watch = require('gulp-watch');
const util = require('gulp-util');
const sass = require('gulp-sass');
const del = require('del');
const vueify = require('gulp-vueify2');
const bro = require('gulp-bro');
const zip = require('gulp-zip');


// Static assets and html
const assets = ['index.html', 'manifest.json', 'icon.png'];
assets.map(x => gulp.task(`copy:${x}`, () => copy(x)));

// Node modules ( vendor files )
const node = ['/vue/dist/vue.js', '/vue-resource/dist/vue-resource.js', '/vue-router/dist/vue-router.js'];
node.map(x => gulp.task(`copy:${x}`, () => copyNodeModule(x)));

// Bundle dependencies
gulp.task('bundle', () => transpileAndBundle('src/*/*.js'));

// Non bundled javascript files
const unbundled = ['content', 'popup', 'inject', 'background'];
unbundled.map(x => gulp.task(`js:${x}`, () => transpileAndBundle(`src/${x}.js`)));

// Build Tools
gulp.task('clean', function clean() { return del(['./build/*']) });
gulp.task('copy', gulp.series('clean', gulp.parallel(taskNames('copy', assets), taskNames('copy', node))));

// SCSS styling
gulp.task('sass:build', () => gulp.src('./src/sass/**/*.scss').pipe(sass().on('error', sass.logError)).pipe(gulp.dest('./build')));
gulp.task('sass:watch', () => gulp.watch('./src/sass/**/*.scss', gulp.series('sass:build')));
gulp.task('sass', gulp.parallel('sass:build', 'sass:watch'));

gulp.task('build', gulp.parallel('copy', gulp.parallel('bundle', taskNames('js', unbundled), 'sass:build')));

// Watch
gulp.task("watch-after-build", (obj) =>  watch(["./src/**/*.js", "./src/**/*.html", "./src/**/*.json"], (obj) =>  watchType(obj.path)));
gulp.task('watch', gulp.series('build', 'sass:build', gulp.parallel('watch-after-build', 'sass:watch')));

// This is what should be used to compile and watch the extension for development.
gulp.task('run', gulp.series('watch'));

gulp.task('zip-dev', () =>
    gulp.src('./build/*')
        .pipe(zip('dev-build.zip'))
        .pipe(gulp.dest('./'))
);


// Helper methods
function taskNames(prefix, stack){ return stack.map(x => `${prefix}:${x}`); }
function copy(filepath){ return gulp.src(`./src/${filepath}`).pipe(gulp.dest(`./build/`)); }
function copyNodeModule(filepath){ return gulp.src(`./node_modules/${filepath}`).pipe(gulp.dest(`./build/vendor/`)); }
function transpileAndBundle(src){
    return gulp.src(src) // Not actually bundling yet.
        .pipe(bro()).on('error', handleError)
        .pipe(gulp.dest('./build/'))
}
function watchType(fullpath, func = null){
    function deleteAllSubFolders(){ return del(['./build/*/*']) }
    function delFrom(){ return del([`./build/${pathFromBuildRoot}`]); }
    function src(){ return gulp.src(`./build/${pathFromBuildRoot}`); }
    const filename = (x => x[x.length - 1])(fullpath.split("\\"));
    const pathFromBuildRoot = (x => x[x.length - 1])(fullpath.split("src\\"))//.replace("\\", "/");
    util.log(filename, pathFromBuildRoot);
    if(assets.indexOf(filename) > -1) return copy(pathFromBuildRoot);
    else {
        transpileAndBundle(`./src/${pathFromBuildRoot}`);
    }

    // NOT WORKING WITH VUE TEMPLATES FOR SOME REASON
    // If you're working on VUE templates just use `gulp build` for now.

    if(func) func(`./build/${pathFromBuildRoot}`);
}

function handleError(err) {
    util.log(err.toString());
    this.emit('end');
}
