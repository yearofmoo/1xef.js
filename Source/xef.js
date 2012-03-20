var Xef = new Class;

Xef.extend({

  loadAssets : function(assets,onReady,onError) {
    Xef.Assets.loadAssets(assets,onReady,onError);
  }

});

Xef.Assets = {

  getAssetElement : function(asset) {
    return document.id(this.generateIDFromAsset(asset));
  },

  isLoaded : function(asset) {
    return !!this.getAssetElement(asset);
  },

  generateIDFromAsset : function(asset) {
    asset = this.getAsset(asset);
    var name = this.parameterizeAssetURL(asset.url);
    return 'asset-'+asset.type+'-'+name;
  },

  parameterizeAssetURL : function(url) {
    return url.replace(/[\W\s-_]+/,' ').trim().toLowerCase().replace(/\ +/,'-');
  },

  loadAssets : function(assets,onReady,onError) {
    var onAllReady = function() {
      onReady();
    };

    var onAssetReady = function(asset) {
      asset = this.getAsset(asset);
    }.bind(this);
  },

  /*
   * asset {
   *  url : asset,
   *  type : type,
   *  pageSpecific : true
   * }
   */
  loadAsset : function(asset,onReady,onError) {
    asset = this.getAssetObject(asset);
    switch(type) {
      case 'js':
        this.loadJavaScript(asset,onReady,onError);
      break;
      case 'css':
        this.loadStylesheet(asset,onReady,onError);
      break;
      default:
        onReady();
      break;
    }
  },

  getAssetExtension : function(asset) {
    return (asset.match(/(\.\w+)(?:(?:#|\?).*)*$/) || [null,''])[1];
  },

  getAssetType : function(asset) {
    return this.getAssetExtension(asset).toLowerCase();
  },

  getAssetObject : function(asset) {
    if(typeOf(asset) == 'string') {
      asset = {
        url : asset,
        type : this.getAssetType(asset),
        pageSpecific : true
      };
    }
    return asset;
  },

  generateAssetClassName : function(asset) {
    asset = this.getAssetObject(asset);
    var className = 'xef-asset xef-asset-' + asset.type;
    if(asset.pageSpecific) {
      className += ' xef-page-specific';
    }
    return asset;
  },

  loadJavascript : function(asset,onReady,onError) {
    asset = this.getAsset(asset);
    Asset.javascript(asset.url,{
      'id' : this.generateAssetID(asset),
      'class' : this.generateAssetClassName(asset),
      'onload' : onReady,
      'onerror' : onError
    });
  },

  loadStylesheet : function(asset) {
    asset = this.getAsset(asset);
    Asset.stylesheet(asset.url,{
      'id' : this.generateAssetID(asset),
      'class' : this.generateAssetClassName(asset),
      'onload' : onReady,
      'onerror' : onError
    });
  },

  onAssetError : function(asset) {
    var element = this.getAssetElement(asset);
    if(element) {
      element.destroy();
    }
  },

};

Xef.implement({

  Implements : [Options, Events],

  options : {
    recognizeExistingChildren : true,
    bindEscapeKey : true,
    animateOnCreate : true,
    animateOnDestroy : true,
    zIndexIncrement : 10,
    borderWidth : 10,
    baseZIndex : 100,
    adjustHeight : true,
    useLabels : true,
    gutter : 80,
    bindLinks : true,
    showLoadingOnCreate : true,
    fadeGap : 200,
    urlFormat : 'xefjs'
  },

  initialize : function(container,options) {
    this.container = $(container || document.body);
    this.setOptions(options);
    this.build();
    this.setupEvents();
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
    var page = Xef.Page.createFromContent(content);
    this.addPage(page);
  },

  setupEvents : function() {
    if(this.options.bindEscapeKey) {
      document.addEvent('keypress',this.onEscape.bind(this));
    }
  },

  getContainer : function() {
    return this.container;
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
    var width = this.calculatePageWidth(this.getNextPageIndex());
    var page = new Xef.Page(name,this.getContainer(),width);
    this.addPage(page);

    if(this.options.showLoadingOnCreate) {
      page.showLoading();
    }

    page.setOrigin(x);
    this.bindPageEvents(page);
    this.onPageCreate(page);
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
      'focus' : this.onPageFocus.bind(this),
      'blur' : this.onPageBlur.bind(this),
      'destroy' : this.onPageDestroy.bind(this)
    });
  },

  onPageFocus : function(page) {
    this.setCurrentPage(page);
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
    return result.length == 1 ? result[1] : null;
  },

  onEscape : function() {
    this.getTipPage().destroy();
  },

  onPageCreate : function(page) {
    if(this.options.animateOnCreate) {
      var x = page.getOrigin() + this.options.fadeGap;
      page.moveTo(x);
      page.show();
      page.slideToOrigin();
    }
    else {
      page.show();
    }
  },

  onPageDestroy : function(page) {
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
  }

});

Xef.Page = new Class;

Xef.Page.extend({

  KLASS : 'xef-page',

  createFromContent : function(element,options) {
    var frameContainer = element.getParent();
  } 

});

Xef.Page.implement({

  Implements : [Options, Events, Chain],

  options : {
    hoverClassName : 'hover',
    disabledClassName : 'disabled',
    activatedClassName : 'active',
    fxOptions : {},
    bindLinks : true
  },

  initialize : function(name,frameContainer,maxWidth,options) {
    this.setOptions(options);
    this.name = name;
    this.maxWidth = maxWidth;
    this.id = name + '-' + (new Date().getTime());
    this.parent = document.id(frameContainer);
    this.build(this.parent);
    this.setupEvents();
    this.resize();
    this.hide();
  },

  build : function(frameContainer) {
    this.container = new Element('div',{
      'class':Xef.Page.KLASS,
      'styles':{
        'position':'absolute',
        'left':0,
        'top':0,
        'width':this.maxWidth,
        'opacity':0,
        'min-height':'100%'
      }
    }).inject(frameContainer);

    this.inner = new Element('div.xef-inner',{
      'styles':{
        'width':this.maxWidth
      }
    }).inject(this.container)

    this.tab = new Element('div.xef-tab').inject(this.container);
    this.setTabTitle(this.getName());
  },

  setTabTitle : function(title) {
    this.getTab().set('html',title);
    this.positionTab();
  },

  positionTab : function() {
    var tab = this.getTab();
    var size = tab.getSize();
    var width = size.x;
    var height = size.y;
    var x = -height-2;
    var y = width + 20;
    tab.setStyles({
      'left':x,
      'top':y
    });
  },

  setupEvents : function() {
    this.getContainer().addEvents({
      'mouseenter':this.onHover.bind(this),
      'mouseleave':this.onBlur.bind(this),
      'click':this.onClick.bind(this)
    });
  },

  bindLinks : function() {
    this.getContainer().addEvent('click:relay(a)',this.onLinkClick.bind(this));
  },

  isValidLink : function(target) {
    var href = element.get('href');
    if(href == '' || href == '#' || href.match(/^\w+:\/\//)) {
      return false;
    }

    if(element.retrieve('Xef:ignore')) {
      return false;
    }

    var target = element.get('target');
    if(target.length > 0) {
      return false;
    }

    return true;
  },

  onLinkClick : function(event,target) {
    if(this.isValidLink(target)) {
      event.stop();
      this.fireEvent('click',[target]);
    }
  },

  getParent : function() {
    return this.parent;
  },

  getRequest : function() {
    if(!this.request) {
      this.request = new Xef.Page.Request({
        onRequest : this.onRequest.bind(this),
        onResponse : this.onResponse.bind(this),
        onReady : this.onReady.bind(this),
        onFailure : this.onFailure.bind(this)
      });
    }
    return this.request;
  },

  onRequest : function() {
    this.showLoading();
  },

  onReady : function() {
    this.hideLoading();
    this.fireEvent('ready',[this]);
  },

  onFailure : function() {
    alert('failure');
  },

  onResponse : function(response) {
    this.setResponse(response);
  },

  getName : function() {
    return this.name;
  },

  getID : function() {
    return this.id;
  },

  getContainer : function() {
    return this.container;
  },

  getInner : function() {
    return this.inner;
  },

  getTab : function() {
    return this.tab;
  },

  reload : function() {
    this.getRequest().reload();
  },

  load : function(url,method,data) {
    this.getRequest().load(url,method,data);
  },

  getURL : function() {
    return this.getRequest().getURL();
  },

  setResponse : function(response) {
    var content = response.getContent();
    var title = response.getTitle();
    var container = new Element('div.xef-page-response');
    container.adopt(content);
    if(title) {
      this.setTabTitle(title);
    }
    this.setContent(container);
  },

  setContent : function(html) {
    var container = this.getInner();
    container.empty();
    if(typeOf(html) == 'string') {
      container.set('html',html);
    }
    else {
      container.adopt(html);
    }
  },

  getContent : function() {
    return this.getContainer().get('html');
  },

  showLoading : function() {
    this.getContainer().addClass('loading');
  },

  hideLoading : function() {
    this.getContainer().removeClass('loading');
  }, 

  getLeft : function() {
    return this.getContainer().getStyle('left').toInt();
  },

  getWidth : function(width) {
    return this.getContainer().getStyle('width');
  },

  getHeight : function() {
    return this.getContainer().getStyle('height');
  },

  setHeight : function(height) {
    this.getContainer().setStyle('min-height',height);
  },

  disable : function() {
    var container = this.getContainer();
    var x = container.getPosition().x;
    container.setStyles({
      'position':'fixed',
      'left':x
    });
    container.addClass(this.options.disabledClassName).removeClass(this.options.activatedClassName);
  },

  enable : function() {
    var container = this.getContainer();
    var x = this.getOrigin();
    container.setStyles({
      'position':'absolute',
      'left':x
    });
    container.removeClass(this.options.disabledClassName).addClass(this.options.activatedClassName);
  },

  focus : function() {
    this.fireEvent('focus',[this]);
    this.enable();
  },

  blur : function() {
    this.fireEvent('blur',[this]);
    this.disable();
  },

  isDisabled : function() {
    return this.getContainer().hasClass(this.options.disabledClassName);
  },

  onClick : function(event) {
    if(this.isDisabled()) {
      this.focus();
    }
  },

  onHover : function(event) {
    if(this.isDisabled()) {
      this.getContainer().addClass(this.options.hoverClassName);
    }
  },

  onBlur : function(event) {
    if(this.isDisabled()) {
      this.getContainer().removeClass(this.options.hoverClassName);
    }
  },

  onEnable : function() {
    this.fireEvent('enable');
  },

  onDisable : function() {
    this.fireEvent('disable');
  },

  getOrigin : function() {
    return this.origin;
  },

  setOrigin : function(x) {
    this.origin = x;
  }, 

  getFx : function() {
    if(!this.fx) {
      this.fx = new Fx.Morph(this.getContainer(),this.options.fxOptions);
    }
    return this.fx;
  },

  slideTo : function(x) {
    this.getFx().start({
      'left':x,
      'opacity':[0,1]
    }).chain(function() {
      this.callChain(this);
    }.bind(this));
    return this;
  },

  fadeTo : function(x) {
    this.getFx().start({
      'left':x,
      'opacity':0
    }).chain(function() {
      this.callChain(this);
    }.bind(this));
    return this;
  },

  moveTo : function(x) {
    this.getContainer().setStyle('left',x);
  },

  slideToOrigin : function() {
    this.slideTo(this.getOrigin());
  },

  show : function() {
    this.getContainer().setStyle('display','block');
  },

  hide : function() {
    this.getContainer().setStyle('display','none');
  },

  isHidden : function() {
    return this.getContainer().getStyle('display') == 'block';
  },

  isVisible : function() {
    return ! this.isHidden();
  },

  equals : function(page) {
    var id;
    if(typeOf(page) != 'string') {
      id = page.getID();
    }
    else {
      id = page;
    }
    return id == this.getID();
  },

  resize : function() {
    var p = this.getParent();
    var size = p.getSize();
    this.setHeight(size.y);
  },

  toElement : function() {
    return this.getContainer();
  },

  destroy : function() {
    this.fireEvent('destroy',[this]);
  }

});

Xef.Page.Response = new Class({

  Implements : [Options],

  options : {
    fallback : true,
    contentSelector : '.xef-content',
    headerSelector : '.xef-header'
  },

  initialize : function(html) {
    this.html = html;
    this.parse(html);
  },

  parse : function(html) {
    if(!html || typeOf(html) != 'string' || html.length == 0) {
      this.onEmpty();
      return;
    }

    var element = Elements.from(html);
    element = ['elements','array'].indexOf(typeOf(element)) >= 0 ? element[0] : element;
    if(typeOf(element)=='null') {
      element = new Element('div').set('html',html);
    }

    try {
      this.element = element;

      var content = this.element.getElement(this.options.contentSelector); 
      if(!content) {
        throw new Error;
      }

      this.parseContent(content);

      var header = element.getElement(this.options.headerSelector); 
      if(!header) {
        throw new Error;
      }

      this.parseHeader(header);
    }
    catch(e) {
      if(this.options.fallback && element) {
        this.fallback(element);
      }
      else {
        this.onFailure();
      }
    }
  },

  fallback : function(element) {
    this.content = element;
    this.header = {};
  },

  getElement : function() {
    return this.element;
  },

  parseContent : function(content) {
    return this.content = content;
  },

  parseHeader : function(header) {
    var content = header.get('html').trim();
    this.header = JSON.decode(content);
  },

  getRawHTML : function() {
    return this.html;
  },

  getHTML : function() {
    return this.contentHTML;
  },

  getContent : function() {
    return this.content;
  },

  getHeaderContent : function() {
    return this.header;
  },

  getHeader : function(header) {
    return this.getHeaderContent()[header];
  },

  getTitle : function() {
    return this.getHeader('title');
  },

  getAssets : function() {
    return this.getHeader('assets') || [];
  },

  isFailure : function() {
    return this.failure;
  },

  onFailure : function() {
    this.failure = true;
  },

  isEmpty : function() {
    return this.empty;
  },

  toElement : function() {
    return this.content;
  },

  onEmpty : function() {
    this.empty = true;
  },

  destroy : function() {

  }

});

Xef.Page.Request = new Class({

  Implements : [Options, Events],

  initialize : function(options) {
    this.setOptions(options);
  },

  getRequest : function() {
    if(!this.request) {
      var options = {
        onRequest : this.onRequest.bind(this),
        onSuccess : this.onResponse.bind(this),
        onFailure : this.onFailure.bind(this)
      }
      this.request = new Request(options);
    }
    return this.request;
  },

  onRequest : function() {
    this.fireEvent('request');
  },

  getURL : function() {
    return this.getRequest().options.url;
  },

  getMethod : function() {
    return this.getRequest().options.method;
  },

  reload : function() {
    this.getRequest().send();
  },

  load : function(url,method,data) {
    var request = this.getRequest();
    request.options.method = method || 'GET';
    request.options.url = url;
    request.options.data = data;
    request.send();
  },

  cancel : function() {
    this.getRequest().cancel();
  },

  onCancel : function() {
    this.fireEvent('cancel');
  },

  onResponse : function(content) {
    this.response = new Xef.Page.Response(content);
    if(this.response.isFailure()) {
      this.onFailure();
      return;
    }

    this.fireEvent('response',[this.response]);

    var assets = this.response.getAssets();
    if(assets.length > 0) {
      this.loadAssets(assets,this.onAssetsReady.bind(this),this.onAssetsError.bind(this));
    }
    else {
      this.onAssetsReady();
    }
  },

  onFailure : function() {
    this.fireEvent('failure');
  },

  loadAssets : function(assets,onReady,onError) {
    Xef.loadAssets(assets,onReady,onError);
  },

  onAssetsReady : function() {
    this.onReady();
  },

  onAssetsError : function() {
    this.onFailure();
  },

  onReady : function() {
    this.fireEvent('ready');
  }

});
