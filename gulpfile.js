var karma = require('gulp-karma'),
    gulp = require('gulp'),
    concat = require('gulp-concat'),
    sourcemaps = require('gulp-sourcemaps'),
    buildDir = 'app/build',
    libDir = buildDir + '/lib',
    libFiles = [
        'node_modules/angular/angular.min.js',  
        'node_modules/d3/d3.min.js',
        'node_modules/bootstrap/dist/js/bootstrap.min.js',
        'node_modules/bootstrap/dist/css/bootstrap.min.css'
    ],
    sourceFiles = [
        'app/js/**/*.js',
        'app/js/*.js'
    ],
    testFiles = [
        'node_modules/angular/angular.js',
        'node_modules/d3/d3.min.js',
        'node_modules/angular-mocks/angular-mocks.js',
        'app/js/*.js',
        'app/js/**/*.js',
        'test/*.js',
        'test/**/*.js'
    ];

gulp.task('libs', function() {
    return gulp.src(libFiles[0])
        .pipe(gulp.dest(libDir))
});
gulp.task('javascript', function() {
    return gulp.src(sourceFiles)
        .pipe(sourcemaps.init())
        .pipe(concat('all.js'))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(buildDir))
});
gulp.task('test', function() {
    return gulp.src(testFiles)
        .pipe(karma({
            configFile: 'karma.conf.js',
            action: 'run'
        }))
        .on('error', function(err) {
            console.log(err);
        });
});

gulp.task('default', function() {
    gulp.run(['libs', 'javascript', 'test']);
    gulp.watch(sourceFiles, ['javascript']);
    gulp.watch(testFiles, ['test']);
});
