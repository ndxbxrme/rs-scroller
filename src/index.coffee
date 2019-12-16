angular = window.angular or require 'angular'
ogid = require 'ogid'
$ = require 'jquery'
moduleName = 'rs-scroller'
angular.module moduleName, []
.provider 'Scroller', ->
  elems = {}
  callbacks =
    visible: []
    offscreen: []
  doCallback = (name, elem) ->
    for fn in callbacks[name]
      fn elem, name
  $get: ($window, $timeout) ->
    bodySelector = 'body'
    if $window.navigator.userAgent.match /(iPod|iPhone|iPad|Android)/
      bodySelector = 'body'
    body = $(bodySelector)
    lastScrollTop = body.scrollTop()
    windowTop = 0
    windowBottom = 0
    calculateWindow = ->
      windowTop = body.scrollTop()
      windowHeight = $window.innerHeight
      windowBottom = windowTop + windowHeight
      body.removeClass 'scrolled'
      body.removeClass 'scroll-down'
      body.removeClass 'scroll-up'
      if windowTop > 0
        body.addClass 'scrolled'
        if windowTop > lastScrollTop
          body.addClass 'scroll-down'
        else
          body.addClass 'scroll-up'
    calculateElem = (obj) ->
      elem = obj.elem
      elemTop = elem.offset().top
      elemBottom = elemTop + elem[0].clientHeight
      if windowTop > 0
        elem.addClass 'scrolled'
        elem.removeClass 'scroll-down'
        elem.removeClass 'scroll-up'
        if windowTop > lastScrollTop
          elem.addClass 'scroll-down'
        else
          elem.addClass 'scroll-up'
      else
        elem.removeClass 'scrolled'
        elem.removeClass 'scroll-down'
        elem.removeClass 'scroll-up'
      wasVisible = elem.hasClass 'scroll-visible'
      return if wasVisible and obj.lock
      wasOffscreen = elem.hasClass 'offscreen'
      if elemBottom < windowTop
        elem.removeClass 'offscreen-bottom'
        elem.removeClass 'scroll-visible'
        elem.addClass 'offscreen'
        elem.addClass 'offscreen-top'
        if not wasOffscreen
          doCallback 'offscreen', elem
          obj.onoffscreen elem if obj.onoffscreen
      else if elemTop > windowBottom
        elem.removeClass 'offscreen-top'
        elem.removeClass 'scroll-visible'
        elem.addClass 'offscreen'
        elem.addClass 'offscreen-bottom'
        if not wasOffscreen
          doCallback 'offscreen', elem
          obj.onoffscreen elem if obj.onoffscreen
      else
        elem.removeClass 'offscreen-top'
        elem.removeClass 'offscreen-bottom'
        elem.removeClass 'offscreen'
        elem.addClass 'scroll-visible'
        if not wasVisible
          doCallback 'visible', elem
          obj.onvisible elem if obj.onvisible
    update = ->
      calculateWindow()
      for key, elem of elems
        calculateElem elem
      lastScrollTop = windowTop
    $window.addEventListener 'scroll', update
    #$window.addEventListener 'resize', update
    register: (id, elem) ->
      elem.scrollId = id
      elems[id] = elem
      calculateWindow()
      calculateElem elem
    update: update
    unregister: (id) ->
      delete elems[id]
    on: (name, fn) ->
      if callbacks[name].indexOf(fn) is -1
        callbacks[name].push fn
    off: (name, fn) ->
      callbacks[name].splice(callbacks[name].indexOf(fn), 1)
    scrollTop: ->
      body.animate
        scrollTop: 0
      , 400
.provider 'scrollInterceptor', ->
  $get: (Scroller, $timeout) ->
    response: (res) ->
      $timeout ->
        Scroller.update()
      res
.config ($httpProvider) ->
  $httpProvider.interceptors.unshift 'scrollInterceptor'
.directive 'scroller', (Scroller) ->
  restrict: 'A'
  link: (scope, elem, attrs) ->
    genId = (num) ->
      output = 'id'
      chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
      while num--
        output += chars[Math.floor(Math.random() * chars.length)]
      output
    id = genId 12
    Scroller.register id, 
      elem: $(elem)
      onvisible: scope[attrs.onvisible]
      onoffscreen: scope[attrs.onoffscreen]
      lock: scope[attrs.lock]
    scope.$on '$destroy', ->
      Scroller.unregister id

module.exports = moduleName