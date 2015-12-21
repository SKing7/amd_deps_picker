var esprima = require('esprima');
var fs = require('fs');
var _ = require('lodash');

/* 处理define和require表达式 */
function walk(allDeps, obj) {
    var body = obj.body; 
    var expression; 
    var calleeName;
    _.forEach(body, function (v) {
        if (v && v.type === 'ExpressionStatement') {
            expression = v.expression;
            if (expression && expression.type === 'CallExpression') {
                calleeName = expression.callee.name;
                if (calleeName === 'define') {
                    handle(expression.arguments, allDeps);
                }
            }
        }
    });

}
function handle(args, allDeps) {
    var deps;
    _.forEach(args, function (v) {
        if (v.type === 'ArrayExpression') {
            deps = _.pluck(v.elements, 'value');
        }
    });

    //合并到数组
    if (deps) {
      Array.prototype.splice.apply(allDeps, [deps.length, 0].concat(deps));
    }
}
/**
 * 处理require，define的参数，得到依赖关系*/
module.exports = function (opt, cb) {
  var rtObj = [];
  var basePath = opt.basePath;
  var data = fs.readFileSync(opt.file);

  curriedWalk = walk.bind(global, rtObj) 
  parsedTree = esprima.parse(data);
  curriedWalk(parsedTree);

  return rtObj;
};

