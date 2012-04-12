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

Xef.Assets = {

  clearPageSpecific : function(pageID) {
    var s = '.' + this.generatePageSpecificAssetClassName(pageID);
    $$(s).destroy();
  },

  getAssetElement : function(asset) {
    return document.id(this.generateIDFromAsset(asset));
  },

  isLoaded : function(asset) {
    return !!this.getAssetElement(asset);
  },

  generateIDFromAsset : function(asset) {
    asset = this.getAssetObject(asset);
    var name = this.parameterizeAssetString(asset.url);
    return 'asset-'+asset.type+'-'+name;
  },

  generatePageSpecificAssetClassName : function(pageID) {
    return 'xef-page-asset-'+this.parameterizeAssetString(pageID);
  },

  parameterizeAssetString : function(url) {
    return Xef.parameterizeString(url);
  },

  loadAssets : function(pageID,assets,stamp,onReady,onError) {
    var total = assets.length;
    var counter = 0;

    var onAllReady = function() {
      onReady();
    };

    var onAssetReady = function(asset) {
      counter++;
      if(counter >= total) {
        onAllReady();
      }
    }.bind(this);

    var onAssetFailure = function(asset) {
      onAssetReady(asset);
    };

    for(var i=0;i<assets.length;i++) {
      var asset = assets[i];
      this.loadAsset(pageID,asset,stamp,onAssetReady,onAssetFailure);
    }
  },

  /*
   * asset {
   *  url : asset,
   *  type : type,
   *  pageSpecific : true
   * }
   */
  loadAsset : function(pageID,asset,stamp,onReady,onError) {
    asset = this.getAssetObject(asset);
    if(asset.loaded) {
      onReady();
      return;
    }

    asset.url += (asset.url.contains('?') ? '&' : '?') + stamp;

    switch(asset.type) {
      case 'js':
        this.loadJavaScript(pageID,asset,onReady,onError);
      break;
      case 'css':
        this.loadStyleSheet(pageID,asset,onReady,onError);
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
    return this.getAssetExtension(asset).toLowerCase().substr(1);
  },

  getAssetObject : function(asset) {
    if(typeOf(asset) == 'string') {
      asset = {
        url : asset,
        type : this.getAssetType(asset),
        pageSpecific : true
      };
    }
    asset.loaded = false; //#!
    return asset;
  },

  generateAssetClassName : function(pageID,asset) {
    asset = this.getAssetObject(asset);
    var className = 'xef-asset xef-asset-' + asset.type;
    if(asset.pageSpecific) {
      className += ' xef-page-specific';
      className += ' ' + this.generatePageSpecificAssetClassName(pageID);
    }
    return className;
  },

  loadJavaScript : function(pageID,asset,onReady,onError) {
    Xef.Page.bindCallbackScopeToPage(pageID);
    asset = this.getAssetObject(asset);
    Asset.javascript(asset.url,{
      'id' : this.generateIDFromAsset(asset),
      'class' : this.generateAssetClassName(pageID,asset),
      'onload' : onReady
      //'onError' : onError
    });
  },

  loadStyleSheet : function(pageID,asset,onReady,onError) {
    Xef.Page.bindCallbackScopeToPage(pageID);
    asset = this.getAssetObject(asset);
    Asset.css(asset.url,{
      'id' : this.generateIDFromAsset(asset),
      'class' : this.generateAssetClassName(pageID,asset),
      'onload' : onReady
      //'onError' : onError
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
    animateOnCreate : true,
    animateOnDestroy : true,
    scrollToTopOnFocus : true,
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
      'focus' : this.onPageFocus.bind(this),
      'blur' : this.onPageBlur.bind(this),
      'destroy' : this.onPageDestroy.bind(this)
    });
  },

  getScroller : function() {
    if(!this.scroller) {
      this.scroller = new Fx.Scroll(window,this.options.scrollerOptions);
    }
    return this.scroller;
  },

  onPageFocus : function(page) {
    if(this.options.scrollToTopOnFocus) {
      this.getScroller().toTop();
    }
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

Xef.Page = new Class;

Xef.Page.extend({

  KLASS : 'xef-page',

  callbacks : {},

  bindCallbackScopeToPage : function(pageID) {
    this._on = this._on ? this._on : this.on;
    var fn = function(events) {
      var pageID = arguments.callee._pageID;
      Xef.Page._on.apply(this,[events,pageID]);
    };
    fn._pageID = pageID;
    this.on = fn;
  },

  on : function(events,pageID) {
    if(!pageID) {
      var manager = Xef.getInstance();
      var page = manager.getTipPage();
      pageID = page.getID();
    }
    this.registerCallbacks(pageID,events);
  },

  onReady : function(fn,pageID) {
    this.on({
      ready : fn
    },pageID);
  },

  registerCallbacks : function(pageID,events) {
    if(!this.callbacks[pageID]) {
      this.callbacks[pageID] = {};
    }

    for(var type in events) {
      var fn = events[type];
      this.callbacks[pageID][type] = this.callbacks[pageID][type] || [];
      this.callbacks[pageID][type].push(fn);
    }
  },

  fireCallbacks : function(pageID,type) {
    var manager = Xef.getInstance();
    var page = manager.getPageByID(pageID);
    if(this.callbacks[pageID]) {
      if(this.callbacks[pageID][type]) {
        var scope = this.callbacks[pageID][type];
        var methods = this.callbacks[pageID][type] || [];
        methods.each(function(fn) {
          fn.apply(scope,[page,pageID]);
        });
      }
    }
  },

  clearCallbacks : function(pageID) {
    this.callbacks[pageID]=null;
  }

});

Xef.Page.implement({

  Binds : ['onRequest','onResponse','onReady','onFailure'],

  Implements : [Options, Events, Chain],

  options : {
    hoverClassName : 'hover',
    disabledClassName : 'disabled',
    activatedClassName : 'active',
    loadAssets : true,
    keepAssetsAfterDestroy : false,
    fxOptions : {
      link : 'cancel',
      transition : 'circ:out'
    },
    screenOpacity : 0.5,
    requestOptions : {
    },
    requestLoader : 'spinner',
    spinnerOptions : {
      zIndexIncrement : 100,
      'class' : 'xef-spinner',
      style : {
        opacity : 0.8
      }
    }
  },

  initialize : function(name,frameContainer,maxWidth,zIndex,options) {
    this.setOptions(options);
    this.parent = document.id(frameContainer);
    //this.maxWidth = 1000;
    this.maxWidth = maxWidth;
    this.zIndex = zIndex;

    if(typeOf(name) == 'element') {
      this.buildFromElement(name);
    }
    else {
      this.name = name;
      this.id = this.generateID(name);
      this.build(this.parent);
    }

    this.hide();
    this.setupEvents();
    this.resize();
  },

  getZIndexValue : function() {
    return this.getContainer().getStyle('z-index');
  },

  generateID : function(name) {
    return (name ? Xef.parameterizeString(name) : 'xef-page') + '-' + (new Date().getTime());
  },

  setLevel : function(level) {
    this.getContainer().addClass('xef-page-level-'+level);
  },

  buildFromElement : function(element) {

    this.name = element.get('data-xef-title');
    this.container = document.id(element);
    this.buildContainer();

    this.inner = this.container.getElement('.xef-inner');

    this.id = this.generateID(name);
    this.buildInner();
    this.buildTab();

    var url = element.get('data-xef-url');
  },

  build : function(frameContainer) {
    this.buildContainer(frameContainer);
    this.buildInner();
    this.buildTab();
  },

  buildContainer : function(frameContainer) {
    if(!this.container && frameContainer) {
      this.container = new Element('div').inject(frameContainer);
    }

    this.container.set({
      'class':Xef.Page.KLASS,
      'styles':{
        'position':'absolute',
        'left':0,
        'top':0,
        'width':this.maxWidth,
        'opacity':0,
        'min-height':'100%',
        'z-index':this.zIndex
      }
    });
  },

  buildInner : function() {
    if(!this.inner) {
      this.inner = new Element('div').inject(this.getContainer());
    }

    this.inner.set({
      'class':'xef-inner',
      'styles':{
        'width':this.maxWidth
      }
    });
  },

  buildTab : function() {
    if(!this.tab) {
      this.tab = new Element('div').inject(this.getContainer());
      this.hideTab();
    }

    this.tab.set('class','xef-tab');
    var name = this.getName();
    if(name) {
      this.setTabTitle(name);
      this.showTab();
    }
  },

  setTabTitle : function(title) {
    this.getTab().set('html',title);
    this.positionTab();
  },

  hideTab : function() {
    this.getTab().setStyle('display','none');
  },

  showTab : function() {
    this.getTab().setStyle('display','block');
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
      'mouseleave':this.onBlur.bind(this)
    });
  },

  getParent : function() {
    return this.parent;
  },

  getRequest : function() {
    if(!this.request) {
      this.request = new Xef.Page.Request(this.options.requestOptions);
      this.request.addEvents({
        request : this.onRequest,
        response : this.onResponse,
        ready : this.onReady,
        failure : this.onFailure
      });
    }
    return this.request;
  },

  onRequest : function() {
    if(this.options.requestLoader == 'spinner' && this.hasRequestedBefore()) {
      this.showSpinner();
    }
    else {
      this.showLoading();
    }
  },

  onReady : function() {
    this.requestedBefore = true;
    this.positionTab();
    this.resize();
    this.fireCallbacks('ready');
    this.fireEvent('ready',[this]);

    if(this.isAnimating()) {
      this.addEvent('animationComplete:once',this.onEnabledAndReady.bind(this));
    }
    else {
      this.onEnabledAndReady();
    }
  },

  onEnabledAndReady : function() {
    this.hideSpinner();
    this.hideLoading();
  },

  onFailure : function() {
    this.destroy();
  },

  onResponse : function(response) {
    this.setResponse(response);
    if(this.options.loadAssets) {
      this.getRequest().loadAssets(this.getID(),this.options.assetStamp);
    }
    else {
      this.onReady();
    }
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
    this.onBeforeDestroy();
    this.getRequest().reload();
  },

  load : function(url,method,data) {
    this.onBeforeDestroy();
    this.getRequest().load(url,method,data);
  },

  postRequest : function(url,data) {
    this.load(url,'POST',data);
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
      this.showTab();
    }

    var className = response.getClassName() || '';
    if(className && className.length > 0) {
      this.setCustomClassName(className);
    }

    this.setContent(container);
  },

  getCustomClassName : function() {
    return this.customClassName;
  },

  setCustomClassName : function(className) {
    if(this.getCustomClassName()) {
      this.removeCustomClassName();
    }
    this.customClassName = className;
    this.getContainer().addClass(className);
  },

  removeCustomClassName : function() {
    this.getContainer().removeClass(this.getCustomClassName());
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

  showSpinner : function() {
    this.updateSpinner();
    this.getSpinner().show();
  },

  hideSpinner : function() {
    this.getSpinner().hide();
  },

  getSpinner : function() {
    if(!this.spinner) {
      var options = this.options.spinnerOptions;
      if(options.zIndexIncrement) {
        var zIndex = this.getZIndexValue().toInt() +  options.zIndexIncrement;
        delete this.options.spinnerOptions.zIndexIncrement;
        options.style = options.style || {};
        options.style['z-index'] = zIndex;
      }
      this.spinner = new Spinner(this.getContainer(),options);
    }
    return this.spinner;
  },

  updateSpinner : function() {
    this.getSpinner().position();
  },

  showLoading : function() {
    this.hideScreen();
    this.getContainer().addClass('loading');
  },

  hideLoading : function() {
    this.hideScreen();
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

  showScreen : function() {
    this.getScreen().setStyle('display','block');
  },

  hideScreen : function() {
    this.getScreen().setStyle('display','none');
  },

  getScreen : function() {
    if(!this.screen) {
      this.screen = new Element('div.xef-screen',{
        'styles':{
          'position':'absolute',
          'top':0,
          'left':0,
          'bottom':0,
          'right':0
        },
        'events':{
          'click':function(event) {
            event.stop();
            this.onClick();
          }.bind(this)
        }
      }).inject(this.getContainer());
      this.screen.setOpacity(this.options.screenOpacity);
    }
    return this.screen;
  },

  disable : function() {
    if(!this.isAnimating()) {
      var container = this.getContainer();
      var pos = container.getPosition();
      container.setStyles({
        'position':'fixed',
        'left':pos.x,
        'top':pos.y
      });
      container.addClass(this.options.disabledClassName).removeClass(this.options.activatedClassName);
      this.onDisable();
    }
    else {
      this.addEvent('animationComplete:once',this.disable.bind(this));
    }
  },

  enable : function() {
    if(!this.isAnimating()) {
      var container = this.getContainer();
      var y = 0;
      var x = this.getOrigin();
      container.setStyles({
        'position':'absolute',
        'top':y,
        'left':x
      });
      container.removeClass(this.options.disabledClassName).addClass(this.options.activatedClassName);
      container.removeClass(this.options.hoverClassName);
      this.onEnable();
    }
    else {
      this.addEvent('animationComplete:once',this.enable.bind(this));
    }
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
    this.hideScreen();
    this.positionTab();
    this.resize();
    this.clearNotification();
    this.fireCallbacks('enable');
    this.fireEvent('enable');
  },

  onDisable : function() {
    this.showScreen();
    this.positionTab();
    this.resize();
    this.fireCallbacks('disable');
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
      this.fx.addEvent('complete',function() {
        this.animating = false;
        this.fireEvent('animationComplete');
      }.bind(this));
      this.fx.addEvent('start',function() {
        this.animating = true;
      }.bind(this));
    }
    return this.fx;
  },

  slideTo : function(x) {
    this.getFx().set({
      'display':'block'
    }).start({
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

  moveToOrigin : function() {
    this.moveTo(this.getOrigin());
  },

  slideToOrigin : function() {
    this.slideTo(this.getOrigin());
  },

  show : function() {
    this.getContainer().setStyle('display','block').setOpacity(1);;
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

  hasRequestedBefore : function() {
    return this.requestedBefore;
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

  onBeforeDestroy : function() {
    this.fireCallbacks('destroy');
    this.clearCallbacks();
  },

  destroy : function() {
    this.positionTab();
    this.resize();
    this.getSpinner().destroy();
    this.fireEvent('destroy',[this]);
  },

  notify : function() {
    if(this.isDisabled()) {
      this.getContainer().addClass('notify');
    }
  },

  clearNotification : function() {
    this.getContainer().removeClass('notify');
  },

  clearCallbacks : function() {
    Xef.Page.clearCallbacks(this.getID());
  },

  fireCallbacks : function(type) {
    Xef.Page.fireCallbacks(this.getID(),type);
  },

  isAnimating : function() {
    return this.animating;
  }

});

Xef.Page.Request = new Class({

  Implements : [Options, Events],

  options : {
    xviewOptions : {
      rootClassName : 'xef-response',
      contentSelector : '.xef-content',
      headerSelector : '.xef-header'
    }
  },

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

  getResponse : function() {
    return this.response;
  },

  getResponseData : function() {
    return this.responseData;
  },

  getAssets : function() {
    var assets = this.getResponseData()['assets'];
    if(assets) {
      assets = typeOf(assets) == 'array' ? assets : [assets];
      if(assets.length > 0 && assets[0] != null) {
        return assets;
      }
    }
  },

  onResponse : function(content) {
    this.response = new XView(content,this.options.xviewOptions);
    if(this.response.isFailure()) {
      this.onFailure();
      return;
    }

    this.responseData = this.response.getHeader('xef');
    this.fireEvent('response',[this.response]);
  },

  onFailure : function() {
    this.fireEvent('failure');
  },

  loadAssets : function(pageID,stamp) {
    var assets = this.getAssets();
    if(assets && assets.length > 0) {
      Xef.loadAssets(pageID,assets,stamp,this.onAssetsReady.bind(this),this.onAssetsError.bind(this));
    }
    else {
      this.onAssetsReady();
    }
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
