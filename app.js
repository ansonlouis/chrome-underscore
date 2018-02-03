// app.js

var underscoreUrl = "http://underscorejs.org/";
var docs_deferred = null;
var INDEX = {};


var getUnderscoreDetails = function(){

  if(docs_deferred){
    return docs_deferred;
  }

  docs_deferred = $.get(underscoreUrl).then(function(body){
    var $body = $(body);
    var $docs = $body.find('#documentation p');
    var docs = [];
    $docs.each(function(index){

      var $this = $(this);
      $this.find('.header, .alias').remove();
      var $code = $this.find('code');
      $code.remove();

      var name = this.id;
      var content = $this.text().replace(/\s+/g, ' ').trim();

      docs.push({
        name : name,
        code : $code.text(),
        content : content
      });

      addToIndex(name, index);

    });

    return docs;
  });

  return docs_deferred;

};


var addToIndex = function(text, key){

  text = text.toLowerCase();
  var str = "";

  for(var i=0; i<text.length; i++){
    str += text[i];
    if(!INDEX[str]){
      INDEX[str] = [];
    }
    INDEX[str].push(key);
  }

};

var searchIndex = function(text){
  var max = 5;
  var matchedIndex = [];

  text = text.toLowerCase();

  if(INDEX[text]){
    matchedIndex = INDEX[text].slice(0, max);
  }

  return getUnderscoreDetails().then(function(docs){
    var results = [];
    matchedIndex.forEach(function(id){
      results.push(docs[id]);
    });
    return results;
  });
};

var escapeHTML = function(text){
  return text.replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
};


getUnderscoreDetails().done(function(docs){

  var omnibox = new ChromeOmnibox({
    actions : [{
      word : null,
      onSubmit : function(result){
        var fnName = (result.suggestions.length && result.suggestions[0].content) || "";
        var url = underscoreUrl + "#" + fnName;
        chrome.tabs.update(this.tabId, {url : url});
      },
      suggestions : function(currentWord, args, result){
        var suggestions = [];
        searchIndex(currentWord).done(function(results){
          results.forEach(function(result){
            suggestions.push({
              content : result.name,
              description : "<match>" + result.code + "</match>" + " <dim>" + escapeHTML(result.content) + "</dim>"
            });
          });
        });
        return suggestions;
      }
    }]
  });

});