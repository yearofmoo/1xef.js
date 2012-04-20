var Xef = new Class;

Xef.extend({

  parameterizeString : function(str) {
    return str.replace(/[-_\W\s\.]+/g,' ').trim().toLowerCase().replace(/\s+/g,'-');
  },

  loadAssets : function(pageID,assets,stamp,onReady,onError) {
    Xef.Assets.loadAssets(pageID,assets,stamp,onReady,onError);
  },

  clearAssets : function(pageID) {
    Xef.Assets.clearPageSpecific(pageID);
  },

  clearAllAssets : function(pageID) {
    $$('.xef-page-specific').destroy();
  },

  getInstance : function() {
    return this.instance;
  },

  registerInstance : function(instance) {
    this.instance = instance;
  }

});

Xef.implement({

  Implements : [Options, Events],

  Binds : ['onPageFocus','onPageBlur','onPageDestroy','onPageCollapse'],

  options : {
    recognizeExistingChildren : true,
    animateOnCreate : true,
    animateOnDestroy : true,
    scrollToTopOnFocus : true,
    animateScroll : false,
    zIndexIncrement : 100,
    borderWidth : 10,
    baseZIndex : 1000,
    adjustHeight : true,
    useLabels : true,
    gutter : 100,
    showLoadingOnCreate : true,
    fadeGap : 150,
    urlFormat : 'xefjs',
    assetStamp : null,
    pageOptions : {

    },
    scrollerOptions : {

    },
  },

  initialize : function(container,options) {
    if(!window.XView) {
      throw new Error('xef.js: XView is not found');
    }
    Xef.registerInstance(this);
    this.container = $(container || document.body);
    this.setOptions(options);
    this.build();
    if(this.options.recognizeExistingChildren) {
      this.buildFromChildren();
    }
  },

  build : function() {
    var container = this.getContainer();
    container.setStyles({
      'position':'relative'
    });
  },

  buildFromChildren : function() {
    this.getContainer().getElements('.'+Xef.Page.KLASS).each(this.buildChildFromContent,this);
  },

  buildChildFromContent : function(content) {
    var page = this.createPage(content);
    page.hideLoading();
  },

  getContainer : function() {
    return this.container;
  },

  getCurrentZIndexValue : function() {
    return this.getCurrentPage().getZIndexValue();
  },

  getZIndexValue : function(index) {
    return this.options.baseZIndex + this.options.zIndexIncrement * index;
  },

  getWidth : function() {
    return this.getContainer().getSize().x - this.options.borderWidth;
  },

  getHeight : function() {
    return this.getContainer().getSize().y;
  },

  setWidth : function(width) {
    this.getContainer().setStyle('width',width);
  },

  setHeight : function(height) {
    this.getContainer().setStyle('height',height);
  },

  calculatePageWidth : function(index) {
    var width = this.getWidth();
    var gap = this.options.gutter;
    width -= gap * index;
    return width;
  },

  createPage : function(name,options) {
    var x = this.getNextPageOrigin();
    var index = this.getNextPageIndex();
    var zIndex = this.getZIndexValue(index);
    var width = this.calculatePageWidth(index);
    var options = this.options.pageOptions;
    options.assetStamp = this.options.assetStamp;
    var page = new Xef.Page(name,this.getContainer(),width,zIndex,options);
    page.setLevel(index);
    this.addPage(page);

    if(this.options.showLoadingOnCreate) {
      page.showLoading();
    }

    page.setOrigin(x);
    this.bindPageEvents(page);
    this.onPageCreate(page,index);
    page.focus();
    return page;
  },

  addPage : function(page) {
    var pages = this.getPages();
    var index = pages.length;
    pages.push(page);
    return index;
  },

  bindPageEvents : function(page) {
    page.addEvents({
      'focus' : this.onPageFocus,
      'blur' : this.onPageBlur,
      'destroy' : this.onPageDestroy,
      'collapse' : this.onPageCollapse
    });
  },

  getScroller : function() {
    if(!this.scroller) {
      this.scroller = new Fx.Scroll(window,this.options.scrollerOptions);
    }
    return this.scroller;
  },

  onPageCollapse : function(page, collapse, response, data) {
    var focus;

    data = data || {};
    delete data['collapse'];

    if(typeOf(collapse) == 'integer') {
      focus = this.getPage(collapse);
    }
    else {
      switch(collapse) {
        case 'child':
        case 'next':
          focus = this.createPage('next_page',{

          });
          focus.setResponseData(data);
          focus.setResponse(page.getResponse());
          focus.onResponse(response, data);
          page.hideLoading();
        break;

        case 'previous':
        case 'parent':
          var nextIndex = Math.max(0, this.getPageIndex(page) - 1);
          focus = this.getPage(nextIndex);
        break;

        case 'first':
        case 'root':
          focus = this.getRootPage();
        break;

        default:
          focus = this.findBestMatchingPage(collapse);
        break;
      }
    }

    if(!focus) {

    }

    if(focus) {
      focus.focus();
    }
  },

  onPageFocus : function(page) {
    if(this.options.scrollToTopOnFocus) {
      this.scrollToTop();
    }
    this.setCurrentPage(page);
  },

  scrollToTop : function() {
    var scroller = this.getScroller();
    this.options.animateScroll ? scroller.toTop() : scroller.set(0,0);
  },

  onPageBlur : function(page) {
  },

  onPageChange : function(page,index) {
    var pages = this.getPages();
    for(var i=0;i<pages.length;i++) {
      var p = pages[i];
      if(i > index) {
        p.destroy();
      }
      else if(i < index) {
        p.blur();
      }
    }
  },

  setCurrentPage : function(page) {
    page = this.getPage(page);
    var index = this.getPageIndex(page);
    if(index != this.getCurrentPageIndex()) {
      this.setCurrentPageIndex(index);
      this.onPageChange(page,index);
      page.focus();
    }
  },

  setCurrentPageIndex : function(index) {
    this.currentPageIndex = index;
  },

  getCurrentPageIndex : function(index) {
    return this.currentPageIndex;
  },

  getCurrentPage : function() {
    return this.getPage(this.getCurrentPageIndex());
  },

  getPreviousPageIndex : function() {
    return Math.max(0,this.getCurrentPageIndex());
  },

  getPreviousPage : function() {
    return this.getPage(this.getPreviousPageIndex());
  },

  getTotalPages : function() {
    return this.getPages().length;
  },

  getRootPage : function() {
    return this.getPage(0);
  },

  getTipPage : function() {
    return this.getPage(this.getTotalPages()-1);
  },

  getNextPageIndex : function() {
    return this.getTotalPages();
  },

  getNextPageOrigin : function() {
    return this.getNextPageIndex() * this.options.gutter;
  },

  getPages : function() {
    if(!this.pages) {
      this.pages = [];
    }
    return this.pages;
  },

  getPage : function(index) {
    var page;
    if(typeof(index) == 'object' && instanceOf(index, Xef.Page)) {
      page = index;
    }
    else {
      page = this.getPages()[index];
    }
    return page;
  },

  getPageIndex : function(page) {
    var pages = this.getPages();
    for(var i=0;i<pages.length;i++) {
      if(pages[i].equals(page)) {
        return i;
      }
    }
  },

  getPageByID : function(id) {
    var result = this.getPages().filter(function(page) {
      return page.getID()==id;
    });
    return result.length == 1 ? result[0] : null;
  },

  findBestMatchingPage : function(str) {

  },

  onEscape : function() {
    this.getTipPage().destroy();
  },

  onPageCreate : function(page,index) {
    if(index > 0 && this.options.animateOnCreate) {
      var x = page.getOrigin() + this.options.fadeGap;
      page.moveTo(x);
      page.slideToOrigin();
    }
    else {
      page.moveToOrigin();
      page.show();
    }
  },

  onPageDestroy : function(page) {
    if(!page.options.keepAssetsAfterDestroy) {
      Xef.clearAssets(page.getID());
    }
    if(this.options.animateOnDestroy) {
      var x = page.getLeft() + 200;
      page.fadeTo(x).chain(this.destroyPage.bind(this));
    }
    else {
      this.destroyPage(page);
    }
  },

  destroyPage : function(page) {
    page = this.getPage(page);
    var index = this.getPageIndex(page);
    var pages = this.getPages();
    page.getContainer().destroy();
    delete pages[index];
    this.pages = pages.clean();
  },

  movePageToTop : function(page) {
    var page = this.getPage(page);
  },

  load : function(url,method,data) {
    this.getCurrentPage().load(url,method,data);
  },

  fireCallbacks : function(name) {
    this.getPages().each(function(page) {
      page.fireCallbacks(name);
    });
  }

});
