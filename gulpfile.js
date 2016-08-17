var gulp = require('gulp'),
    ts = require('gulp-typescript'),
    merge = require('merge2'),
    connect = require('gulp-connect');

var tsProject = ts.createProject({
  noImplicitAny: true,
  out: 'app.js'
});

gulp.task('build', function() {
  var tsResult = gulp.src('app/app.ts')
    .pipe(ts(tsProject));
  // Merge the two output streams, so this task is finished when the IO of both operations are done.
  return merge([
    tsResult.dts.pipe(gulp.dest('app')),
    tsResult.js.pipe(gulp.dest('app'))
  ]);
});
 
gulp.task('connect', function() {
  connect.server({
    root: './',
    livereload: true
  });
});

gulp.task('reload', function () {
  gulp.src(['./app/*.html', './app/*.js'])
    .pipe(connect.reload());
});

gulp.task('watch', ['build','connect'], function() {
  gulp.watch('app/*.ts', ['build']);
  gulp.watch(['app/*.js','app/*.html'], ['reload']);
});