const gulp = require('gulp');
const useref = require('gulp-useref');
const browserify = require('gulp-browserify');
const watchify = require('watchify');
const watch = require('gulp-watch');
const util = require('gulp-util');
var sass = require('gulp-sass');
const del = require('del');


// Copy html to build
const assets = ['index.html', 'manifest.json', 'icon.png'];
assets.map(x => gulp.task(`copy:${x}`, () => copy(x)));

// Bundle dependencies
gulp.task('bundle', () => transpileAndBundle('src/*/*.js'));

// Non bundled javascript files
const unbundled = ['content', 'popup', 'inject'];
unbundled.map(x => gulp.task(`js:${x}`, () => transpileAndBundle(`src/${x}.js`)));

gulp.task('sass:build', () => gulp.src('./src/sass/**/*.scss').pipe(sass().on('error', sass.logError)).pipe(gulp.dest('./build')));
gulp.task('sass:watch', () => gulp.watch('./src/sass/**/*.scss', gulp.series('sass')));
gulp.task('sass', gulp.parallel('sass:build', 'sass:watch'));



gulp.task('clean', function clean() { return del(['./build/*']) });
gulp.task('copy', gulp.series('clean', gulp.parallel(taskNames('copy', assets))));
gulp.task('build', gulp.series('copy', gulp.parallel('bundle', taskNames('js', unbundled))));

gulp.task("watch-after-build", (obj) =>  watch(["./src/**/*.js", "./src/**/*.html", "./src/**/*.json"], (obj) =>  watchType(obj.path)));
gulp.task('watch', gulp.series('build', gulp.parallel('watch-after-build', 'sass')));

function taskNames(prefix, stack){ return stack.map(x => `${prefix}:${x}`); }
function copy(filepath){ return gulp.src(`./src/${filepath}`).pipe(gulp.dest(`./build/`)); }
function transpileAndBundle(src){
    return gulp.src(src)
        .pipe(useref())
        .pipe(browserify({ insertGlobals : true, debug:true }))
        .pipe(gulp.dest('./build/'))
}
function watchType(fullpath){
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

}
