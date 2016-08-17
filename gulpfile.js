var gulp = require('gulp');
var ts = require('gulp-typescript');
var merge = require('merge2');

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

gulp.task('watch', ['build'], function() {
  gulp.watch('app/*.ts', ['build']);
});