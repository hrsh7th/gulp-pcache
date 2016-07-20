# gulp-pcache
gulp incremental build on each process.

# usage.
```js
const gulp = require('gulp');
const eslint = require('gulp-eslint');
const concat = require('gulp-concat');
const pcache = require('gulp-pcache')({path: __dirname + '/.gulpcache'});

// only passthrough modified files.
gulp.task('scripts:eslint', function() {
  return gulp.src('**/*.js')
    .pipe(pcache('scripts:eslint'))
    .pipe(eslint());
});

// only passthrough modified files.
// and remember stream.
gulp.task('scripts:concat', function() {
  return gulp.src('**/*.js')
    .pipe(pcache('scripts:concat'))
    .pipe(remember('scripts:concat'))
    .pipe(concat())
    .pipe(gulp.dest('bundle.js'));
});

gulp.task('cache:clear', function() {
  pcache.clear();
});

// auto save cache.
process.on('exit', function() {
  pcache.save();
});

```

