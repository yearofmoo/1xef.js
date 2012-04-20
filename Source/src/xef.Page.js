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

  Binds : ['onRequest','onResponse','onReady','onFailure','onCancel'],

  Implements : [Options, Events, Chain],

  options : {
    followRedirects : true,
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

    this.isNew = true;

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

  hasKeywords : function() {
    return this.keywords && this.keywords.length > 0;
  },

  setKeywords : function(keywords) {
    if(typeOf(keywords) != 'array') {
      keywords = keywords.toString().split(/[-\s,]+/g);
    }
    this.keywords = keywords;
  },

  getKeywords : function() {
    return this.keywords;
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

  isNew : function() {
    return this.isNew == true;
  },

  isNotNew : function() {
    return this.isNew == false;
  },

  setAsNotNew : function() {
    this.isNew = false;
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
        failure : this.onFailure,
        cancel : this.onCancel
      });
    }
    return this.request;
  },

  cancelRequest : function() {
    this.getRequest().cancel();
  },

  hasRequest : function() {
    return !! this.request;
  },

  isRequesting : function() {
    return this.hasRequest() && this.getRequest().isRequesting();
  },

  onRequest : function() {
    if(this.options.requestLoader == 'spinner' && this.hasRequestedBefore()) {
      this.showSpinner();
    }
    else {
      this.showLoading();
    }
  },

  onRedirect : function(url) {
    this.fireEvent('redirect',[url]);
    this.load(url);
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

  onCancel : function() {
    this.fireEvent('cancel',[this]);
  },

  onResponse : function(response, data) {
    var redirect = data['redirect'];
    var collapse = data['collapse'];
    var collapseContent = data['collapseContent'];

    delete data['collapse'];
    delete data['redirect'];
    delete data['collapseContent'];

    if(this.options.followRedirects && redirect && redirect.length > 0) {
      this.onRedirect(redirect);
    }
    else if(collapse != undefined && collapse != null && collapse != 'self') {
      this.onCollapse(collapse, collapseContent, response, data);
    }
    else {
      this.setResponse(response, data);
      if(this.options.loadAssets) {
        this.getRequest().loadAssets(this.getID(),this.options.assetStamp);
      }
      else {
        this.onReady();
      }
    }
  },

  onCollapse : function(collapse, collapseContent, response, data) {
    this.fireEvent('collapse',[this,collapse, collapseContent, response, data]);
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
    if(this.hasRequest()) {
      this.onBeforeDestroy();
      this.getRequest().reload();
    }
    else {
      this.onReady();
    }
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

  setResponse : function(response, data) {
    var content = response.getContent();
    var container = new Element('div.xef-page-response');
    container.adopt(content);

    var title = data['title'] || response.getTitle();
    if(title) {
      this.setTabTitle(title);
      this.showTab();
    }

    var keywords = data['keywords'];
    if(keywords) {
      this.setKeywords(keywords);
    }

    var className = data['className'] || response.getClassName() || '';
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
    this.setAsNotNew();
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
    this.getContainer().setStyle('display','block').setOpacity(1);
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
    this.cancelRequest();
    this.fireCallbacks('destroy');
    this.clearCallbacks();
  },

  destroy : function() {
    this.onBeforeDestroy();
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
