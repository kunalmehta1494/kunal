CustomScrollbar = (function($) {
  return {

    initialize: function(args) {
      this._scrollbarElement = $(args.scrollbarElement);
      this._handleElement = this._scrollbarElement.find('.scrollbar-handle');
      this._scrollTop = 0;
      this._scrollSpeedConstant = 500;

      if (this._scrollbarElement.length === 0) {
        throw "bad scrollbar selector";
      }

      if (this._handleElement.length === 0) {
        throw "couldn't find handle";
      }

      this.setDraggingState(false);
    },

    /**
     * Initialize scrollbar and it's source element
     * @param {node} element the element to scroll
     * @param {number} [elementScrollHeight] the height of the document to scroll
     * @param {number} [elementHeight] the visible height of the scroll 'window'
     * @returns {boolean}
     */
    setScrollingElement: function(element, elementScrollHeight, elementHeight) {
      if (this._scrollingElement){
        this.removeScrollEvents();
      }

      var $element = $(element);
      // Support window elements
      if (element.document){
        this._scrollingElement = $(element.document.body);
      } else if ($element.length > 0 && $element[0].contentWindow.window.document) {
        this._scrollingElement = $($element[0].contentWindow.window.document.body);
      } else {
        this._scrollingElement = $element;
      }

      if (this._scrollingElement.length === 0) {
        throw "invalid scrolling element";
      }

      this.setScrollHandleHeightFromElement(elementScrollHeight, elementHeight);
      this.setScrollHandlePosition();
      this.addScrollEvents();

      this.setDraggingState(false);
    },

    setDraggingState: function(isDragging) {
      if (isDragging) {
        this._scrollbarElement.addClass('dragging').removeClass('notDragging');
        $('body').addClass('dragging');
      } else {
        this._scrollbarElement.removeClass('dragging').addClass('notDragging');
        $('body').removeClass('dragging');
      }
    },

    /**
     * Set extra styling on the scrollbar
     * @param {Object} [scrollBarStyleOverrides] extra styling rules for the scrollbar
     * @param {Object} [handleStyleOverrides] extra styling rules for the scrollbar handle
     */

    setStyleOverrides: function(scrollBarStyleOverrides, handleStyleOverrides){
      if (scrollBarStyleOverrides){
        this._scrollbarElement.css(scrollBarStyleOverrides);
      }

      if (handleStyleOverrides){
        this._handleElement.css(handleStyleOverrides);
      }

      this.setScrollHandleHeightFromElement();
    },

    /**
     * Set the handle height from the relative height of the visible/scrollable areas of the scrolled element
     * @param {number} elementScrollHeight [Optional] the height of the document to scroll
     * @param {number} elementHeight [Optional] the visible height of the scroll 'window'
     */
    setScrollHandleHeightFromElement: function(elementScrollHeight, elementHeight){
      this._elementHeight = elementHeight || this._scrollingElement[0].offsetHeight;
      this._scrollHeight = elementScrollHeight || this._scrollingElement[0].scrollHeight;
      this._scrollVsVisibleRatio = this._scrollHeight / this._elementHeight;
      this._scrollBarHeight = this._scrollbarElement[0].offsetHeight;
      this._elementVsBarRatio = this._scrollHeight / this._scrollBarHeight;

      if (this._scrollVsVisibleRatio <= 1){
        //this._skinParts.handle.collapse();
        this._scrollbarElement.hide();
      } else{
        //this._skinParts.handle.uncollapse();
        this._scrollbarElement.show();
        this.setScrollHandleHeight(Math.floor(this._scrollbarElement[0].offsetHeight / this._scrollVsVisibleRatio));
      }
    },

    /**
     * set the handle height
     * @param {number} height
     */
    setScrollHandleHeight: function(height){
      if(parseInt(height, 10) === height){
        height = height + 'px';
      }
      this._handleElement[0].style.height = height;
    },

    /**
     * set the handle position
     * @param {number} top
     */
    setScrollHandlePosition: function(top){
      this._scrollTop = (typeof top === "number")? top : this._scrollingElement[0].scrollTop;
      this._scrollAll(this._scrollTop);
    },

    _resetScrollSizeAndPosition: function(params){
      params = params || {};
      this.setScrollHandleHeightFromElement(params.height);
      this.setScrollHandlePosition(params.top);
    },

    addScrollEvents: function(){
      //var previewCommands = this.resources.W.Preview.getPreviewManagers().Commands;

      this._scrollingElement.bind('mousewheel DOMMouseScroll MozMousePixelScroll', $.proxy(this._handleMouseWheel, this));
      this._scrollingElement.bind('keydown', $.proxy(this._handleKeyDown, this));

      this._scrollbarElement.bind('mousewheel DOMMouseScroll MozMousePixelScroll', $.proxy(this._handleMouseWheel, this));
      this._scrollbarElement.bind('keydown', $.proxy(this._handleKeyDown, this));
      this._scrollbarElement.bind('mousedown', $.proxy(this._handleMouseDown, this));

      //previewCommands.registerCommandAndListener('WPreviewCommands.resetCustomScrollbar', this, this._resetScrollSizeAndPosition);
    },

    removeScrollEvents: function(){
      //var previewCommands = this.resources.W.Preview.getPreviewManagers().Commands;

      this._scrollingElement.off('mousewheel DOMMouseScroll MozMousePixelScroll', this._handleMouseWheel);
      this._scrollingElement.off('keydown', this._handleKeyDown);

      this._scrollbarElement.off('mousewheel DOMMouseScroll MozMousePixelScroll', this._handleMouseWheel);
      this._scrollbarElement.off('keydown', this._handleKeyDown);
      this._scrollbarElement.off('mousedown', this._handleMouseDown);

      var $window = $(window);
      $window.off('mousemove', this._handleMouseMove);
      $window.off('mouseup', this._handleMouseUp);
      $window.off('mousein', this._handleMouseUp);
      $window.off('click', this._handleMouseUp);

      window.detachEvent && window.detachEvent('onselectstart', this._ieOnSelectStart);

      //previewCommands.getCommand('WPreviewCommands.resetCustomScrollbar').unregisterListener(this);

    },

    _handleMouseWheel: function (event) {
      var delta = parseInt(event.originalEvent.wheelDelta || -event.originalEvent.detail);
      var direction = (delta > 0) ? 1 : -1;
      var newScrollTop = this._scrollTop - direction * (10 + Math.ceil(this._scrollHeight / this._scrollSpeedConstant));
      this._scrollAll(newScrollTop);
      event.preventDefault();
    },

    _handleKeyDown: function (event) {
      if (event.keyCode === 38) {
        var newScrollTop = this._scrollTop - 50;
      } else if (event.keyCode === 40) {
        var newScrollTop = this._scrollTop + 50;
      } else {
        return;
      }
      this._scrollAll(newScrollTop);
      event.preventDefault();
    },

    _scrollTo: function(scrollTop, scrollLeft) {
      if (($.browser.mozilla || $.browser.msie) && this._scrollingElement.attr('tagName') === 'BODY') {
        this._scrollingElement.parent().scrollTop(scrollTop);
        this._scrollingElement.parent().scrollLeft(scrollLeft);
      } else {
        this._scrollingElement.scrollTop(scrollTop);
        this._scrollingElement.scrollLeft(scrollLeft);
      }
    },

    _scrollAll: function (newScrollTop) {
      newScrollTop = Math.round(Math.min(Math.max(newScrollTop, 0), this._scrollHeight - this._elementHeight));
      var scrollLeft = this._scrollingElement[0].scrollLeft;
      this._scrollTo(newScrollTop, scrollLeft);
      this._scrollTop = newScrollTop;
      this._handleElement[0].style.top = Math.max((newScrollTop / this._elementVsBarRatio), 0) + 'px';
    },

    _handleMouseDown: function (event) {
      var $window = $(window);
      $window.bind('mousemove', $.proxy(this._handleMouseMove, this));
      $window.bind('mouseup', $.proxy(this._handleMouseUp, this));

      window.attachEvent && window.attachEvent('onselectstart', this._ieOnSelectStart);
      this.setDraggingState(true);

      if (event.target === this._handleElement[0]) {
        this._mouseOffset = (event.clientY - this._handleElement.offset().top)
        return;
      }

      var clickPoint = event.clientY - this._scrollbarElement.offset().top + $window.scrollTop();
      var newScrollTop = clickPoint * this._elementVsBarRatio;
      this._scrollAll(newScrollTop);
      event.preventDefault();
    },

    _handleMouseMove: function (event) {
      var $window = $(window);
      $window.bind('mousein', $.proxy(this._handleMouseUp, this));
      $window.bind('click', $.proxy(this._handleMouseUp, this));
      var clickPoint = (event.clientY - this._scrollbarElement.offset().top) - this._mouseOffset;
      var newScrollTop = clickPoint * this._elementVsBarRatio;

      this._scrollAll(newScrollTop);
      event.preventDefault();
      event.preventDefault();
    },

    _handleMouseUp: function (event) {
      this.setDraggingState(false);

      var $window = $(window);
      $window.unbind('mousemove', this._handleMouseMove);
      $window.unbind('mouseup', this._handleMouseUp);
      $window.unbind('mousein', this._handleMouseUp);
      $window.unbind('click', this._handleMouseUp);

      window.detachEvent && window.detachEvent('onselectstart', this._ieOnSelectStart);

    },

    _ieOnSelectStart: function(){
      return false;
    }
  };
}(jQuery));