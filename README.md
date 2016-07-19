# gulp-pcache
gulp incremental build on each process.

# usage.
```js
const gulp = require('gulp');
const eslint = require('gulp-eslint');
const pcache = require('pcache')({path: __dirname + '/.gulpcache'});

// only passthrough modified files.
gulp.task('eslint', function() {
  return gulp.src('**/*.js')
    .pipe(pcache())
    .pipe(eslint());
});

// only passthrough modified files.
// and remember stream.
gulp.task('scripts:concat', function() {
  return gulp.src('**/*.js')
    .pipe(pcache())
    .pipe(remember('webpack'))
    .pipe(concat())
    .pipe(gulp.dest('bundle.js'));
});

gulp.task('cache:clear', function(done) {
  pcache.clear();
  done();
});

// auto save cache.
process.on('exit', function() {
  pcache.save();
});

```

