/* global fontdetect */
UT.Expression.ready(function(post) {
  "use strict";
  var that = {};

  $(post.node).css("font-size", "10px");

  that.view = {
    desc:       $("#desc"),
    image:      $('#image'),
    utimage:    $('#utimage'),
    player:     $('#player'),
    list:       $('#list'),
    hiddenList: $('.hidden_list'),
    listButton: $('#listbutton'),
    stickerArea:$('#stickerArea'),
    previewBtn: $('.preview-btn'),
    editBtn:    $('.edit-btn'),
    logo:       $('#logo')
  };

  that.data = {
    stickerData: post.storage.stickerData,
    imagePresent: false
  };

  that.settings = {
    isTouch: 'ontouchstart' in window || window.navigator.msMaxTouchPoints > 0,
    mode: 'edit',
    state: 'launch'
  };

  if (that.settings.isTouch) {
    that.view.desc.addClass('touch-device');
  }

  //check background for popup
//  var tmpimage = new Image();
//  tmpimage.src = 'images/background.png';
//  tmpimage.onload = function() {
//    that.view.list.css('opacity', '1');
//  };

  that.adaptPlayButton = function(/*e*/) {
    var obj = $("#sticker");
    var hh = obj.height();
    if(hh > 0) {
      obj.css('fontSize', hh + 'px');
      obj.css('lineHeight', (hh+10) + 'px');
    }
  };

  that.onImageSizeChangedOutside = function(size) {
    var height = size.height || that.view.desc.height();
    var width = size.width || that.view.desc.width();
    var dwidth = Math.floor(width*(that.view.desc.height()/height));
    var dheight = Math.floor(height*(that.view.desc.width()/width));

    if(dheight <= that.view.desc.height()){
      that.view.image.css({
        height: dheight+'px',
        marginTop: -Math.round(dheight/2)+'px',
        top: '50%',
        left: "", width: "", marginLeft:""
      });
    } else {
      that.view.image.css({
        width: dwidth+'px',
        marginLeft: -Math.round(dwidth/2)+'px',
        left: '50%',
        top: "", height: "", marginTop:""
      });
    }
    that.view.stickerArea.find("#sticker").utSticker("update");
    setTimeout(function(){
      that.adaptPlayButton();
    }, 0);
  };

  that.view.utimage.utImage({
    width: 576,
    flexRatio: true,
    autoCrop: true
  });
  that.view.utimage.on('utImage:ready', function(event, image) {
    if(!image.data) {
      that.view.utimage.utImage('dialog');
    } else {
      $("#container").addClass("show");
      if(post.storage.audioUrl) {
        that.view.listButton.css("display", "");
        that.view.stickerArea.css("display", "");
        that.view.desc.addClass("hasAudio");
      } else {
        that.view.desc.removeClass("hasAudio");
      }
      that.createPlayer();
    }
  });
  that.view.utimage.on('utImage:cancelDialog', function(event, image) {
    $("#container").addClass("show");
  });
  that.view.utimage.on('utImage:resize', function(event, image) {
    that.onImageSizeChangedOutside(image);
    that.adaptPopupSize();
    //adapt logo image height
    that.view.logo.height(that.view.logo.width()/2.05);
  });
  that.view.utimage.on('utImage:change', function(event, newValues){
    $("#container").addClass("show");
    var hasImage = !!newValues.data;
    if(hasImage) {
      that.data.imagePresent = true;
      that.view.listButton.css("display", "");
      that.view.stickerArea.css("display", "");
      if(post.storage.audioUrl) {
        post.valid(true);
        that.hideList();
      } else {
        that.showList();
      }
    } else {
      that.view.listButton.css("display", "none");
      that.view.stickerArea.css("display", "none");
      that.data.imagePresent = false;
      post.valid(false);
    }
  });

  that.view.utimage.on('utImage:focus', function() {
    that.view.stickerArea.find("#sticker").utSticker("blur");
  });

  that.adaptPlayButton();

  that.showList = function(){
    post.valid(false);
    that.view.desc.addClass("popupOpened");
    that.view.list.removeClass('hidden_list');
  };

  that.hideList = function(e){
    that.view.desc.removeClass("popupOpened");
    that.view.list.find(".preplay").utAudio("pause");
    that.view.list.addClass('hidden_list');
    if(e) {
      e.stopPropagation();
    }

    if(that.data.imagePresent && post.storage.audioUrl) {
      that.adaptPlayButton();
      post.valid(true);
    }
  };

  $('<div id="sticker" class="ut-audio-skin-sticker ut-audio-state-launch"><div class="ut-audio-ui-play"><span class="icon_spinner ut-audio-ui-seek-icon"></span><span class="icon_play ut-audio-ui-play-icon"></span><span class="icon_pause ut-audio-ui-pause-icon"></span></div></div>')
    .appendTo(that.view.stickerArea)
    .utSticker({
      id: "sticker",
      editable: {
        movable: true,
        resizable: true
      },
      ui: {
        remove: false,
        edit: true
      },
      styles: {
        pos: {
          width: "30%",
          ratio: 1
        },
        parentIndent: {
          top: "0",
          left: "0",
          right: "0",
          bottom: "45px"
        },
        sizeLimits: {
          minWidth: "60px",
          minHeight: "60px"
        }
      }
    });

  that.view.stickerArea.on("utSticker:resize", "#sticker", that.adaptPlayButton);
  that.view.stickerArea.on("utSticker:change", "#sticker", that.adaptPlayButton);
  that.view.stickerArea.on("utSticker:destroy", "#sticker", function(){
    post.storage.audioUrl =  null;
    post.save();
    post.valid(false);
    that.view.desc.removeClass("hasAudio");
    that.createPlayer();
    return false;
  });
  that.view.stickerArea.on("utSticker:buttonClick", "#sticker", function(e, bttn){
    if(bttn === "edit") {
      that.showList();
    }
  });
  that.view.stickerArea.on("utSticker:focus", "#sticker", function(bttn){
    that.view.utimage.utImage('killFocus');
  });

  that.attachPlayer = function(obj, url, num) {
    var playerObj = obj.find(".preplay");
    playerObj.attr("id", num);
    playerObj.utAudio({
      data: url,
      skin: 'preplay',
      ui:{
        play:    true,
        progress:false,
        time:    false,
        title:   false,
        source:  false,
        artwork: false
      },
      editable: false
    });
    playerObj.on('utAudio:canplay',function(e, data) {
      playerObj.attr("data-art", data.artwork_url);
    });
    playerObj.on("click", function(e){ e.stopPropagation(); });
  };

  that.createPlayer = function() {
    $("#player-area").empty();
    if(post.storage.audioUrl) {
      $("#player-area").utAudio({
        data: post.storage.audioUrl,
        skin: 'bottom-over',
        ui:{
          artwork: false,
          play: true
        },
        editable: false
      }).on('utAudio:change',function() {
        //console.log('--- utAudio:change -> audio data/parameters was changed');
      }).on('utAudio:ready',function(e) {
        //console.log('--- utAudio:ready -> audio component ready to accept events');
      }).on('utAudio:canplay',function(e, data) {
        //console.log('--- utAudio:canplay -> audio ready to be played', data);
        $("#sticker").css("background-image", "url(" + data.artwork_url + ")");
        if(data.service_name === "soundcloud") {
          $("#sourceTip").html('<a href="' + post.storage.audioUrl + '" target="_blank">Listen on SoundCloud</a>');
        } else {
          $("#sourceTip").html('<a href="' + post.storage.audioUrl + '" target="_blank">Buy on iTunes</a>');
        }
      }).on('utAudio:play',function(){
        //console.log('--- utAudio:play -> audio started to play');
        $("#sticker").alterClass('ut-audio-state-*', 'ut-audio-state-play');
        that.settings.state = 'play';
      }).on('utAudio:pause',function(){
        //console.log('--- utAudio:pause -> audio paused');
        $("#sticker").alterClass('ut-audio-state-*', 'ut-audio-state-pause');
        that.settings.state = 'pause';
      }).on('utAudio:stop',function(){
        //console.log('--- utAudio:stop -> audio stopped');
        $("#sticker").alterClass('ut-audio-state-*', 'ut-audio-state-launch');
        that.settings.state = 'launch';
      }).on('utAudio:finish',function(){
        //console.log('--- utAudio:finish -> audio finished');
      }).on('utAudio:timeupdate',function(e,s){
        //console.log('--- utAudio:timeupdate -> audio time updated', s);
        $("#sticker").alterClass('ut-audio-state-*', 'ut-audio-state-play');
        that.settings.state = 'play';
      }).on('utAudio:seek',function(){
        //console.log('--- utAudio:seek -> audio seek started');
        $("#sticker").alterClass('ut-audio-state-*', 'ut-audio-state-seek');
        that.settings.state = 'seek';
      });
    }
  };

  that.adaptSize =  function(defText, obj) {
    if (obj.height() > 49) {
      var text = obj.html();
      text = text.substring(0, text.length - 1);
      obj.html(text);
      that.adaptSize(defText, obj);
    } else {
      if (defText !== obj.html()) {
        var tmp = obj.html();
        tmp = tmp.substring(0, tmp.length - 3) + '...';
        obj.html(tmp);
      }
    }
  };

  that.adaptPopupSize = function() {
    if (that.view.list.outerHeight() > 376 && !that.settings.isTouch) {
      that.view.list.css('height', '376px');
    }
    that.view.list.css('margin-top', - that.view.list.outerHeight() / 2);
    $('.antiscroll-wrapper').antiscroll();
  };

  that.changeMode = function(mode) {
    if (mode === 'edit') {
      $("#player-area").utAudio('pause');
      that.settings.mode = 'edit';
      that.view.desc.removeClass('preview-mode').addClass('edit-mode');
      that.view.stickerArea.find("#sticker").utSticker("editable", true);
    } else {
      that.settings.mode = 'preview';
      that.view.desc.removeClass('edit-mode').addClass('preview-mode');
      that.view.stickerArea.find("#sticker").utSticker("editable", false);
    }
  };

  that.view.previewBtn.on('click', function(){
    that.changeMode('preview');
  });

  that.view.editBtn.on('click', function(){
    that.changeMode('edit');
  });

  $("#sticker").on('click', function(){
    if (that.settings.mode === 'edit') {
      return false;
    }
    if(that.settings.state !== "play") {
      $("#player-area").utAudio('play');
      $("#sticker").alterClass('ut-audio-state-*', 'ut-audio-state-seek');
    } else {
      $("#player-area").utAudio('pause');
    }
    //that.view.player.show();
  });

  $("#player-area").on("click", ".ut-audio-ui-source" , function() {
    if (that.settings.mode === 'edit') {
      return false;
    }
    $("#sourceTip").toggleClass("show");
    return false;
  });

  var tmp = that.view.list.find("li");
  var qq;
  for(qq = 0; qq < tmp.length; qq++) {
    var obj = $(tmp.get(qq));
    var url = obj.attr("data-value");
    that.attachPlayer(obj, url, "prePlayer"+qq);
  }

  //index of last player
  var lastIndex = tmp.length - 1;

  var tracksList = window.tracksList;
  for (var j = 0; j < tracksList.length; j++) {
    var listNode = $('<li></li>')
      .appendTo(that.view.hiddenList)
      .append('<div class="preplay"></div>')
      .append('<span>' + tracksList[j].html + '</span>')
      .attr('data-value', tracksList[j].url);

    that.attachPlayer(listNode, tracksList[j].url, "prePlayer" + (lastIndex + j + 1));
  }

  that.view.hiddenList.find('li span').each(function(){
    var self = $(this);
    fontdetect.onFontLoaded("Roboto", function(){
      that.adaptSize(self.html(), self);
      that.adaptPopupSize();
    }, function(){console.error('BAD .. FONT NOT LOADED IN 10 SEC... editor.js line 368');}, {msInterval: 100, msTimeout: 10000});
  });

  //that.adaptPopupSize();

  that.view.list.find('li').on('click', function(){
    var artwork = $(this).find(".preplay").attr("data-art");
    if(artwork) {
      $("#sticker").css("background-image", "url(" + artwork + ")");
    } else {
      $("#sticker").css("background-image", "");
    }

    post.storage.audioUrl = $(this).data('value');
    post.save();
    that.hideList();
    that.view.desc.addClass("hasAudio");
    that.createPlayer();
    that.view.stickerArea.find("#sticker").utSticker("focus");
  });

  $("#list .close").on("click", that.hideList);
  that.view.listButton.on('click', that.showList);
  that.view.listButton.css("display", "none");
  that.view.stickerArea.css("display", "none");
  that.hideList();
});
