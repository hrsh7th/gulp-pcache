const fs = require('fs');
const crypto = require('crypto');
const defaults = require('lodash.defaults');
const through = require('through2');

var caches;
var option;

module.exports = function (opts) {
  option = defaults(opts || {}, {path: '.gulpcache'});

  try {
    caches = JSON.parse(fs.readFileSync(opts.path));
  } catch (e) {
    caches = {};
  }

  return pcache;
};

function pcache(name) {
  caches[name] = caches[name] || {};

  return through.obj(function(file, enc, callback) {

    // skip if stream.
    if (file.isStream()) {
      this.push(file);
      return callback();
    }


    // hit!.
    const hash = crypto.createHash('md5').update(file.contents.toString('utf8')).digest('hex');
    if (caches[name][file.path] === hash) {
      return callback();
    }

    // miss!
    caches[name][file.path] = hash;

    this.push(file);

    callback();
  });
};

pcache.path = function() {
  return option.path;
};

pcache.clear = function() {
  try {
    caches = {};
    fs.unlinkSync(option.path);
  } catch(e) {}
};

pcache.save = function() {
  fs.writeFileSync(option.path, JSON.stringify(caches));
};

