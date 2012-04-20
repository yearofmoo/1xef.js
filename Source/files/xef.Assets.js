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
