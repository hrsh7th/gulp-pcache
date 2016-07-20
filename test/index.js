const fs = require('fs');
const assert = require('assert');
const pcache = require('./../')({path: __dirname + '/.testcache'});
const File = require('vinyl');
const PassThrough = require('stream').PassThrough;

describe('gulp-pcache', function() {

  const fileA = new File({path: '/home/a.js', contents: new Buffer('test.js contents.')});
  const fileB = new File({path: '/home/b.js', contents: new Buffer('test.js contents.')});
  const fileC = new File({path: '/home/c.js', contents: new Buffer('test.js contents.')});

  beforeEach(function() {
    pcache.clear();
  });

  it('should check cache hit/miss.', function(done) {
    const count = {value: 0};

    const stream = pcache('test1');

    stream.on('data', function(f) {
      // assert path.
      assert([fileA, fileB, fileC].map(function(file) {
        return file.path;
      }).indexOf(f.path) >= 0);

      // assert contents.
      assert([fileA, fileB, fileC].map(function(file) {
        return file.contents.toString('utf8');
      }).indexOf(f.contents.toString('utf8')) >= 0);

      count.value++;
    });

    stream.on('end', function() {
      // assert passthrough count.
      assert(count.value === 3);
      done();
    });

    stream.write(fileA);
    stream.write(fileA);
    stream.write(fileA);
    stream.write(fileB);
    stream.write(fileB);
    stream.write(fileB);
    stream.write(fileC);
    stream.write(fileC);
    stream.write(fileC);
    stream.end();
  });

  it('should create cache file.', function(done) {
    const stream = pcache('test2');

    stream.on('data', function() {});
    stream.on('end', function() {
      pcache.save();
      try {
        fs.accessSync(pcache.path());
        assert(true);
      } catch (e) {
        assert(false);
      }
      done();
    });

    stream.write(fileA);
    stream.end();
  });

  it('should separate checking cache by taskname.', function(done) {
    const stream1 = pcache('test1');
    const stream2 = pcache('test2');

    const count = {value1: 0, value2: 0};
    stream1.on('data', function() {
      count.value1++;
    });
    stream1.on('end', function() {
      assert(count.value1 === 2);
      stream2.write(fileA);
      stream2.write(fileB);
      stream2.end();
    });
    stream2.on('data', function() {
      count.value2++;
    });
    stream2.on('end', function() {
      assert(count.value2 === 2);
      done();
    });

    stream1.write(fileA);
    stream1.write(fileB);
    stream1.end();
  });

});

