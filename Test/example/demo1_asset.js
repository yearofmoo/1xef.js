Xef.Page.on({
  
  ready : function(page,pageID) {
    $(page).getElement('#spin').addEvent('click',function(event) {
      event.stop();
      page.reload();
    });
  },

  enable : function() {
  },

  disable : function(page,pageID) {
  },

  destroy : function(page,pageID) {
  }

});
