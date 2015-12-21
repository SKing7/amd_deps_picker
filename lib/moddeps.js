var esprima = require('esprima');
var fs = require('fs');
var _ = require('lodash');
var curriedWalk;

function legalChecker(v) {
  return /^mod\/.*/.test(v);
}

function getDeps(elements) {
  var deps = [];

  deps = _.map(elements, function (v) {
    if(legalChecker(v.value)) {
      return  v.value;
    }
  });
  deps = _.compact(deps)
  return deps;
}

/*
 * 处理define和require表达式 */
function walk(scopeObj, obj, opt) {
  var body = obj.body; 
  var expression; 
  var calleeName;
  var depsObj;

  _.forEach(body, function (v) {

    if (v && v.type === 'ReturnStatement') {
      depsObj = v.argument.elements;

      if (depsObj) {
        scopeObj[opt.key.name] = getDeps(depsObj);
      }
    } else if (v && v.type === 'ExpressionStatement') {
      expression = v.expression;
      if (expression && expression.type === 'CallExpression') {
        calleeName = expression.callee.name;
        if (calleeName === 'define') {
          _.forEach(expression.arguments, function (v) {
            if (v.type === 'FunctionExpression') {
              if (v.body && v.body.type === 'BlockStatement') {
                curriedWalk(v.body);
              }
            }
          });
        }
      }
    } else if (v.type === 'FunctionDeclaration'){
      if (v.body && v.body.type === 'BlockStatement') {
        curriedWalk(v.body);
      }
    } else if (v.type === 'VariableDeclaration'){
      var declaration = v.declarations[0];
      var args;
      var prop;

      if (declaration && declaration.init && declaration.init.arguments) {
        args = declaration.init.arguments[0];
        props = args.properties;
        _.forEach(props, function (p, k) {
          curriedWalk(p.value.body, p);
        });
     }
    }
  });
}
/**
 * 处理require，define的参数，得到依赖关系*/
module.exports = function (opt, cb) {
  var data = fs.readFileSync(opt.file);
  var rtObj = {};

  curriedWalk = walk.bind(global, rtObj) 
  parsedTree = esprima.parse(data);
  curriedWalk(parsedTree);

  return rtObj;
};

