(function() {
  var $, angular, moduleName, ogid;

  angular = window.angular || require('angular');

  ogid = require('ogid');

  $ = require('jquery');

  moduleName = 'rs-scroller';

  angular.module(moduleName, []).provider('Scroller', function() {
    var callbacks, doCallback, elems;
    elems = {};
    callbacks = {
      visible: [],
      offscreen: []
    };
    doCallback = function(name, elem) {
      var fn, i, len, ref, results;
      ref = callbacks[name];
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        fn = ref[i];
        results.push(fn(elem, name));
      }
      return results;
    };
    return {
      $get: function($window, $timeout) {
        var body, bodySelector, calculateElem, calculateWindow, lastScrollTop, update, windowBottom, windowTop;
        bodySelector = 'body';
        if ($window.navigator.userAgent.match(/(iPod|iPhone|iPad|Android)/)) {
          bodySelector = 'body';
        }
        body = $(bodySelector);
        lastScrollTop = body.scrollTop();
        windowTop = 0;
        windowBottom = 0;
        calculateWindow = function() {
          var windowHeight;
          windowTop = body.scrollTop();
          windowHeight = $window.innerHeight;
          windowBottom = windowTop + windowHeight;
          body.removeClass('scrolled');
          body.removeClass('scroll-down');
          body.removeClass('scroll-up');
          if (windowTop > 0) {
            body.addClass('scrolled');
            if (windowTop > lastScrollTop) {
              return body.addClass('scroll-down');
            } else {
              return body.addClass('scroll-up');
            }
          }
        };
        calculateElem = function(obj) {
          var elem, elemBottom, elemTop, wasOffscreen, wasVisible;
          elem = obj.elem;
          elemTop = elem.offset().top;
          elemBottom = elemTop + elem[0].clientHeight;
          if (windowTop > 0) {
            elem.addClass('scrolled');
            elem.removeClass('scroll-down');
            elem.removeClass('scroll-up');
            if (windowTop > lastScrollTop) {
              elem.addClass('scroll-down');
            } else {
              elem.addClass('scroll-up');
            }
          } else {
            elem.removeClass('scrolled');
            elem.removeClass('scroll-down');
            elem.removeClass('scroll-up');
          }
          wasVisible = elem.hasClass('scroll-visible');
          if (wasVisible && obj.lock) {
            return;
          }
          wasOffscreen = elem.hasClass('offscreen');
          if (elemBottom < windowTop) {
            elem.removeClass('offscreen-bottom');
            elem.removeClass('scroll-visible');
            elem.addClass('offscreen');
            elem.addClass('offscreen-top');
            if (!wasOffscreen) {
              doCallback('offscreen', elem);
              if (obj.onoffscreen) {
                return obj.onoffscreen(elem);
              }
            }
          } else if (elemTop > windowBottom) {
            elem.removeClass('offscreen-top');
            elem.removeClass('scroll-visible');
            elem.addClass('offscreen');
            elem.addClass('offscreen-bottom');
            if (!wasOffscreen) {
              doCallback('offscreen', elem);
              if (obj.onoffscreen) {
                return obj.onoffscreen(elem);
              }
            }
          } else {
            elem.removeClass('offscreen-top');
            elem.removeClass('offscreen-bottom');
            elem.removeClass('offscreen');
            elem.addClass('scroll-visible');
            if (!wasVisible) {
              doCallback('visible', elem);
              if (obj.onvisible) {
                return obj.onvisible(elem);
              }
            }
          }
        };
        update = function() {
          var elem, key;
          calculateWindow();
          for (key in elems) {
            elem = elems[key];
            calculateElem(elem);
          }
          return lastScrollTop = windowTop;
        };
        $window.addEventListener('scroll', update);
        return {
          //$window.addEventListener 'resize', update
          register: function(id, elem) {
            elem.scrollId = id;
            elems[id] = elem;
            calculateWindow();
            return calculateElem(elem);
          },
          update: update,
          unregister: function(id) {
            return delete elems[id];
          },
          on: function(name, fn) {
            if (callbacks[name].indexOf(fn) === -1) {
              return callbacks[name].push(fn);
            }
          },
          off: function(name, fn) {
            return callbacks[name].splice(callbacks[name].indexOf(fn), 1);
          },
          scrollTop: function() {
            return body.animate({
              scrollTop: 0
            }, 400);
          }
        };
      }
    };
  }).provider('scrollInterceptor', function() {
    return {
      $get: function(Scroller, $timeout) {
        return {
          response: function(res) {
            $timeout(function() {
              return Scroller.update();
            });
            return res;
          }
        };
      }
    };
  }).config(function($httpProvider) {
    return $httpProvider.interceptors.unshift('scrollInterceptor');
  }).directive('scroller', function(Scroller) {
    return {
      restrict: 'A',
      link: function(scope, elem, attrs) {
        var genId, id;
        genId = function(num) {
          var chars, output;
          output = 'id';
          chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
          while (num--) {
            output += chars[Math.floor(Math.random() * chars.length)];
          }
          return output;
        };
        id = genId(12);
        Scroller.register(id, {
          elem: $(elem),
          onvisible: scope[attrs.onvisible],
          onoffscreen: scope[attrs.onoffscreen],
          lock: scope[attrs.lock]
        });
        return scope.$on('$destroy', function() {
          return Scroller.unregister(id);
        });
      }
    };
  });

  module.exports = moduleName;

}).call(this);

//# sourceMappingURL=index.js.map
