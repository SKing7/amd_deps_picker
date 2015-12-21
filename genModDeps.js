var envConfig = require('../env/production');
var path = require("path");
var _ = require("lodash");
var glob = require("glob")
var modDepsGetter = require("./lib/moddeps")
var definedDepsGetter = require("./lib/definedDeps")

var modsThatHasDepMap = envConfig.modsThatHasDepMap;
var srcBase = envConfig.srcBasePath;
var jsSeedMap = envConfig.seedMap.js;

module.exports = function(grunt) {
    function depsOfGlobPattern() {
      return modsThatHasDepMap.map(function (modName) {
        return {
          modName: modName,
          path: path.join(__dirname, '..', '..', srcBase, 'lib', 'mod', modName + '.js')
        }
      });
    }
    function minDeps(deps, modName, actionName) {
      //{modName} => ~1 {actionName}=> ~2   mod/ => $1 tpl/ => $2
      //
      return _.map(deps, function (dep) {

        dep = dep.replace(new RegExp(modName, 'g'), '~1'); 
        dep = dep.replace(new RegExp(actionName, 'g'), '~2'); 
        return dep.replace(/mod\//g, '$1').replace(/tpl\//, '$2');
      });
    }

    function output(obj) {
        _.forEach(obj, function (deps, modName) {
          var objStr = amdDefineFunTpl(modName, deps);
          grunt.file.write(path.join(__dirname, '..', '..', srcBase, 'lib', 'mod', 'common', 'deps', modName + '.js'), objStr);
        });
    }
    function amdDefineFunTpl(mod, deps) {
      return 'define("mod/common/deps/'+ mod + '", [], function () {' +
        'return ' + JSON.stringify(deps) + ';' + 
      '})';
    }


    function normalizeDeps(deps) {
      deps = _.uniq(deps);
      return deps;
    }

    grunt.registerTask('genModDeps', 'generator js mod deps', function () {
        var allModDepMap = {};

        depsOfGlobPattern().forEach(function (opt) {
          var depsObj = modDepsGetter({
            file: opt.path
          });
          var modName = opt.modName;

          var allDeps = {};
          _.forEach(depsObj, function (deps, k) {
            var actionDeps = [];
            _.forEach(deps, function (dep) {
              var arrDeps = definedDepsGetter({
                file: path.join(__dirname, '..', '..', srcBase, 'lib', dep + '.js'),
              });
              Array.prototype.splice.apply(actionDeps, [arrDeps.length, 0].concat(arrDeps));
            });
            allDeps[k] = normalizeDeps(actionDeps);
          });

          allDeps = _.forEach(allDeps, function (v, k) {
            allDeps[k] =  minDeps(v, modName, k);
          });
          allModDepMap[modName] = allDeps;
        });
        output(allModDepMap)
    });
};
