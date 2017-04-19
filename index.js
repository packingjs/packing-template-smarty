var fs = require('fs');
var path = require('path');
var url = require('url');
var util = require('util');
var assign = require('object-assign-deep');
var clearRequire = require('clear-require');
require('jsmart');

module.exports = function(options) {
  options = assign({
    encoding: 'utf-8',
    extension: '.tpl',
    templates: '.',
    globalData: '__global.js',
    mockData: '.',
    rewriteRules: {}
  }, options);
  return function(req, res, next) {
    var urlObject = url.parse(req.url);
    var pathname = options.rewriteRules[urlObject.pathname] || urlObject.pathname;
    var templateAbsPath = path.resolve(path.join(options.templates, pathname));
    var dataAbsPath = path.resolve(path.join(options.mockData, pathname.replace(options.extension, '.js')));
    var globalDataPath = path.resolve(path.join(options.mockData, options.globalData));
    if (fs.existsSync(templateAbsPath)) {
      var tpl = fs.readFileSync(templateAbsPath, {encoding: options.encoding});
      if (fs.existsSync(templateAbsPath)) {
        var globalContext = {};
        if (fs.existsSync(globalDataPath)) {
          var gcontext = require(globalDataPath);
          if (util.isFunction(gcontext)) {
            globalContext = gcontext(req, res);
          } else {
            globalContext = gcontext;
          }
        }
        var pageContext = {};
        if (fs.existsSync(dataAbsPath)) {
          var pcontext = require(dataAbsPath);
          if (util.isFunction(pcontext)) {
            pageContext = pcontext(req, res);
          } else {
            pageContext = pcontext;
          }
        }
        try {
          var compiledTpl = Handlebars.compile(tpl);
          var output = compiledTpl();
          var output = compiledTpl.fetch(assign(globalContext, pageContext));
          res.end(output);
        } catch (e) {
          console.log(e);
          next();
        }
      } else {
        next();
      }
    };
  };
};
