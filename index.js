var fs = require('fs');
var path = require('path');
var url = require('url');
var util = require('util');
var assign = require('object-assign');
var clearRequire = require('clear-require');
var Handlebars = require('handlebars');

module.exports = function(options) {
  options = assign({
    encoding: 'utf-8',
    extension: '.hbs',
    templates: '.',
    mockData: '.',
    rewriteRules: {}
  }, options);
  return function(req, res, next) {
    var urlObject = url.parse(req.url);
    var pathname = options.rewriteRules[urlObject.pathname] || urlObject.pathname;
    var templateAbsPath = path.resolve(path.join(options.templates, pathname));
    var dataAbsPath = path.resolve(path.join(options.mockData, pathname.replace(options.extension, '.js')));
    if (fs.existsSync(templateAbsPath)) {
      var tpl = fs.readFileSync(templateAbsPath, {encoding: options.encoding});
      var context = {};
      if (fs.existsSync(dataAbsPath)) {
        try {
          var contextExport = require(dataAbsPath);
          if (util.isFunction(contextExport)) {
            context = contextExport(req, res);
          } else {
            context = contextExport;
          }
        }
        catch (e) {
          console.log('File "' + dataAbsPath + ' require failed.\n' + e);
        }
      }
      var compiledTpl = Handlebars.compile(tpl);
      var output = compiledTpl(context);
      res.end(output);
    } else {
      next();
    }
  };
};
