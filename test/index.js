/* eslint-disable prefer-arrow-callback */
/* eslint-disable prefer-template */

const fs = require('fs');
const assert = require('assert');
const pcache = require('./../')({
  path: __dirname + '/.testcache',
  verbose: true
});
const File = require('vinyl');
const PassThrough = require('stream').PassThrough;

describe('gulp-pcache', function() {

  const fileA = new File({path: '/home/a.js', contents: new Buffer('test.js contents.')});
  const fileB = new File({path: '/home/b.js', contents: new Buffer('test.js contents.')});
  const fileC = new File({path: '/home/c.js', contents: new Buffer('test.js contents.')});

  beforeEach(function() {
    pcache.clear();
    fs.writeFileSync(__dirname + '/fixture/deps1.js', Date.now());
    fs.writeFileSync(__dirname + '/fixture/deps2.js', Date.now());
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

  it('should check appended dependencies.', function(done) {
    const count = {value1: 0, value2: 0, value3: 0};

    const stream1 = pcache('test3', {
      deps: [{
        test: /\.js$/,
        glob: __dirname + '/fixture/*.js'
      }]
    });
    const stream2 = pcache('test3', {
      deps: [{
        test: /\.js$/,
        glob: __dirname + '/fixture/*.js'
      }]
    });
    const stream3 = pcache('test3', {
      deps: [{
        test: /\.js$/,
        glob: __dirname + '/fixture/*.js'
      }]
    });

    // stream1.
    stream1.on('data', function() {
      count.value1++;
    });
    stream1.on('end', function() {
      assert(count.value1 === 1);

      // stream2.
      stream2.on('data', function() {
        count.value2++;
      });
      stream2.on('end', function() {
        assert(count.value2 === 0);

        // stream3.
        stream3.on('data', function() {
          count.value3++;
        });
        stream3.on('end', function() {
          assert(count.value3 === 1);
          done();
        });
        fs.writeFileSync(__dirname + '/fixture/deps1.js', Date.now());
        stream3.write(fileA);
        stream3.write(fileA);
        stream3.end();
      });
      stream2.write(fileA);
      stream2.write(fileA);
      stream2.end();
    });
    stream1.write(fileA);
    stream1.write(fileA);
    stream1.end();
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

