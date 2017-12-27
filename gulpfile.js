const gulp = require('gulp');
const useref = require('gulp-useref');
const browserify = require('gulp-browserify');
const watchify = require('watchify');
const del = require('del');


// Copy html to build
gulp.task('copy:html', () => copy('index.html'));
gulp.task('copy:manifest', () => copy('manifest.json'));
gulp.task('copy:icon', () => copy('icon.png'));

function ctask(filepath){ return gulp.src(`./src/${filepath}`).pipe(gulp.dest(`./build/`)); }

gulp.task('bundle', () => transpileAndBundle('src/*/*.js'));
gulp.task('js:content', () => transpileAndBundle('src/content.js'));
gulp.task('js:popup', () => transpileAndBundle('src/popup.js'));
gulp.task('js:inject', () => transpileAndBundle('src/inject.js'));

gulp.task('clean', function clean() { return del(['./build/*']) });
gulp.task('copy', gulp.series('clean', gulp.parallel('copy:html', 'copy:manifest', 'copy:icon')));
gulp.task('build', gulp.series('copy', gulp.parallel('bundle', 'js:content', 'js:popup', 'js:inject')));



function copy(filepath){ return gulp.src(`./src/${filepath}`).pipe(gulp.dest(`./build/`)); }
function transpileAndBundle(src){
    return gulp.src(src)
        .pipe(useref())
        .pipe(browserify({ insertGlobals : true, debug:true }))
        .pipe(gulp.dest('./build/'));
}