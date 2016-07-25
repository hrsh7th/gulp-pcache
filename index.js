const fs = require('fs');
const glob = require('glob');
const crypto = require('crypto');
const defaults = require('lodash.defaults');
const through = require('through2');

var caches;
var option;

/**
 * @param {String} opts.path
 * @return {Function}
 */
module.exports = function(opts) {
  option = defaults(opts || {}, {path: '.gulpcache'});

  try {
    caches = JSON.parse(fs.readFileSync(opts.path));
  } catch (e) {
    caches = {};
  }

  return pcache;
};

/**
 * @param {String} name
 * @param {Object} opts
 * @return {Stream}
 */
function pcache(name, opts) {
  opts = defaults(opts || {},  {}, {deps: []});

  // create cache space for task.
  caches[name] = caches[name] || {};

  // return Strema.
  return through.obj(function(file, enc, callback) {

    // skip if stream.
    if (file.isStream()) {
      this.push(file);
      return callback();
    }

    var isMiss = false;
    getDependencies(file.path, file.contents).forEach(function(dep) {
      if (caches[name][dep.path] === dep.hash) {
        return;
      }
      caches[name][dep.path] = dep.hash;

      isMiss = true;
    });

    if (isMiss) {
      this.push(file);
    }

    callback();
  });

  /**
   * @param {String} targetPath
   * @param {String|Buffer} contents
   * @return {Array.<String, String>}
   */
  function getDependencies(targetPath, contents) {
    const deps = [{path: targetPath, hash: hash(contents)}];
    for (const dep of opts.deps) {
      // is matching option dependencies?
      if (dep.test.test(targetPath)) {

        // add dependencies from glob pattern.
        for (const depPath of glob.sync(dep.glob)) {
          deps.push({
            path: depPath,
            hash: hash(fs.readFileSync(depPath))
          });
        }
      }
    }
    return deps;
  }

  /**
   * @param {String|Buffer} contents
   * @return {String}
   */
  function hash(contents) {
    return crypto.createHash('md5').update(contents.toString('utf8')).digest('hex');
  }
}

pcache.path = function() {
  return option.path;
};

pcache.clear = function() {
  try {
    caches = {};
    fs.unlinkSync(option.path);
  } catch(e) {}
  return Promise.resolve();
};

pcache.save = function() {
  fs.writeFileSync(option.path, JSON.stringify(caches));
  return Promise.resolve();
};

