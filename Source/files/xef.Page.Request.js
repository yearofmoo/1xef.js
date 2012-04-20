Xef.Page.Request = new Class({

  Binds : ['onCancel','onRequest','onResponse','onFailure'],

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
        onCancel : this.onCancel,
        onRequest : this.onRequest,
        onSuccess : this.onResponse,
        onFailure : this.onFailure
      }
      this.request = new Request(options);
    }
    return this.request;
  },

  hasRequest : function() {
    return !! this.request;
  },

  onRequest : function() {
    this.fireEvent('request');
  },

  getURL : function() {
    return this.getRequest().options.url;
  },

  hasURL : function() {
    var url = this.getURL();
    return url && url.length > 0;
  },

  getMethod : function() {
    return this.getRequest().options.method;
  },

  reload : function() {
    if(this.hasRequest() && this.hasURL()) {
      this.getRequest().send();
    }
  },

  load : function(url,method,data) {
    var request = this.getRequest();
    request.options.method = method || 'GET';
    request.options.url = url;
    request.options.data = data;
    request.send();
  },

  cancel : function() {
    if(this.isRequesting()) {
      this.getRequest().cancel();
    }
  },

  onCancel : function() {
    this.fireEvent('cancel');
  },

  isRequesting : function() {
    return this.getRequest().isRunning();
  },

  getResponse : function() {
    return this.response;
  },

  setResponse : function(response) {
    this.response = response;
  },

  getResponseData : function() {
    return this.responseData;
  },

  setResponseData : function(data) {
    this.responseData = data;
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
    var response = content;
    if(!instanceOf(content,XView)) {
      response = new XView(content,this.options.xviewOptions);
    }
    this.setResponse(response);

    if(response.isFailure()) {
      this.onFailure();
      return;
    }

    var responseData = this.getResponse().getHeader('xef');
    this.setResponseData(responseData);

    this.fireEvent('response',[this.getResponse(), this.getResponseData()]);
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
