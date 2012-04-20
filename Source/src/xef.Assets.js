Xef.Assets = {

  generatePageAssetsClassName : function(pageID) {
    return 'xef-asset ' + this.generatePageSpecificAssetClassName(pageID);
  },

  generatePageSpecificAssetClassName : function(pageID) {
    return 'xef-page-asset-'+this.parameterizeAssetString(pageID);
  },

  parameterizeAssetString : function(url) {
    return Xef.parameterizeString(url);
  },

  load : function(assets,pageID,options) {
    options = options || {};
    options['class'] = this.generatePageAssetsClassName(pageID);
    Asset.load(assets,options);
  },

  clearPageSpecific : function(pageID) {
    Asset.unload('.' + this.generatePageSpecificAssetClassName(pageID));
  }

};
