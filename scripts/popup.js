/*
  The code behind the popup HTML page. Manages filling the notifications,
  animating them, and responding to button clicks on both the main and
  per-notification controls.
*/

var _gaq = _gaq || [];
      _gaq.push(['_setAccount', 'UA-54466555-1']);
      _gaq.push(['_trackEvent', 'Open Monitor', 'click']);

      (function() {
        var ga = document.createElement('script');ga.type = 'text/javascript';ga.async = true;
        ga.src = 'https://ssl.google-analytics.com/ga.js';
        var s = document.getElementsByTagName('script')[0];s.parentNode.insertBefore(ga, s);
      })();

// Sizing constants. Must be kept in sync with base.css and popup.css.
var RECORD_HEIGHT = '2.7em';

// Returns the URL of the page referenced by a .notification record given any
// element inside it. Returns null if not found.
function getNotificationUrl(context) {
  return $(context).closest('.notification').find('.page_link').attr('href');
}

function getPageLink(context) {
  return $(context).closest('.notification').find('.page_link');
}

// Marks an updated page as visited and hides its .notification record. Expects
// this to point to an element inside the .notification. Calls
// fillNotifications() once done marking and hiding.
function markPageVisited() {
  var url = getNotificationUrl(this);
  var that = this;

  BG.setPageSettings(url, {updated: false}, function() {
    BG.updateBadge();
    BG.takeSnapshot(url, BG.scheduleCheck);
     setTimeout(function(){fillNotifications()},1000)  
  });
}

// Adds the page in the currently selected tab to the monitored list.
function monitorCurrentPage() {
  //alert('1');
  $('#monitor_page').addClass('inprogress');
  chrome.tabs.getSelected(null, function(tab) {
    initializePageModePickerPopup(tab);
    //_gaq.push(['_trackEvent', tab.url, 'add']);

    
  });
}

// Adds the page in the currently selected tab to the monitored list.
function reselectPrice() {
  
  var url = getNotificationUrl(this);
  chrome.tabs.getSelected(null, function(selectedTab) {
    chrome.tabs.getAllInWindow(null, function(localTabs) {
      
      var foundUrl = false;
      for (var i = 0; i < localTabs.length; i++) {
      
        if(localTabs[i].url == url)        
        {
          foundUrl = true;
          chrome.tabs.update(localTabs[i].id, {selected: true});
          break;
        }
      }
      if (foundUrl == false)
      {
        chrome.tabs.create({url: url, active: true});
      }

      chrome.tabs.getSelected(null, function(tab) {
        initializePageModePickerPopup(tab);
        chrome.tabs.getAllInWindow(null, function(tabs){
          var found = false;
          for (var i = 0; i < tabs.length; i++) {
          if(tabs[i].url == chrome.extension.getURL("options.htm"))                         
            found = true;
          }
          if (found == false)
          {
            chrome.tabs.create({url: "options.htm", active: false});
          }
          addPage({url: tab.url, name: tab.title}, function() {
          BG.takeSnapshot(tab.url);
          });
        });
      });
    });
  });
}

function expandCollapsFolder()
{
  var folderList= $(this).closest('.folder').find('.folder_products li');

  var isCollapsed = false;
  folderList.each(function(i) {
    var display = $(this).closest('.notification').css("display");
    
    if (display == "none"){
      $(this).closest('.notification').attr("style","display:block;");  
  }
    else{
      $(this).closest('.notification').attr("style","display:none;");
      isCollapsed = true;
    }
  });

  if (isCollapsed){
    $(this).closest('.folder').find('.expand_collaps_folder').attr("src", "img/expand.png")
  }
  else
    $(this).closest('.folder').find('.expand_collaps_folder').attr("src", "img/collapse.png")
}

function revertInitialPrice()
{
  //var context = $(this).closest('.notification');
  //var currentPrice = context.find('.current_price').html();
  var url = getNotificationUrl(this);
  
   getPage(url, function(page) {
      BG.setPageSettings(url, {initial_price: page.current_price, initial_price_date: Date.now()}, function() {});
   });
   fillNotifications(null, null);
   
}

function showModify()
{
   var renamePage= $(this).closest('.notification').find('.rename_page');
   var reselect_price= $(this).closest('.notification').find('.reselect_price');
   var revert_initial_price= $(this).closest('.notification').find('.revert_initial_price');
   var  delete_page= $(this).closest('.notification').find('.stop_monitoring');
  
   var display = renamePage.css("visibility");
   
    if (display == "visible"){
      delete_page.attr("style","visibility:hidden;");
      reselect_price.attr("style","visibility:hidden;");
      renamePage.attr("style","visibility:hidden;");
      revert_initial_price.attr("style","visibility:hidden;");
    }
    else{
      delete_page.attr("style","visibility:visible;");
      reselect_price.attr("style","visibility:visible;");
      renamePage.attr("style","visibility:visible;");
      revert_initial_price.attr("style","visibility:visible;");
    }
}

// Clamps a page name to 60 characters.
function trimPageName(page) {
  var name = page.name || chrome.i18n.getMessage('untitled', page.url);
  if (name.length > 50) {
    name = name.replace(/([^]{20,50})(\w)\b.*$/, '$1$2...');
  }
   if (name.length > 40 && page.folder_name != null && page.folder_name != "")
     {
    name = name.replace(/([^]{20,40})(\w)\b.*$/, '$1$2...');
  }
  return name;
}

function checkPrice(price)
{
  if (price!=null && price!="")
  {
      price = "" + price;
      price =  $.trim(price); 
      price =  price.match(/\d/g);
      return price;
  }
  else
  {
      return "";
  }
  
}

function simplifyHTML(htmlSelector, lenghtAttr)
{
  if (htmlSelector == null) return;
  
  var textString =  jQuery(htmlSelector).text().replace(/\s{2,}/g, ' ');
 
  if (textString.length >  lenghtAttr && lenghtAttr != null && lenghtAttr != "")
  {
      textString = textString.substr(0, lenghtAttr)+"...";
  }
  return textString;
}

function isNotNullorEmpty(value)
{
  if (value != null && value != "")
    return true;
  return false;
}

function get_percentage(current, last)
{
  if (current == null || last == null)
    return 0;
  var currentMatch =jQuery(current).text().match(/\d/g);
  if (currentMatch == null)
    return 0;
  
  var currentNum = currentMatch.join("");
  
  var lastMatch = jQuery(last).text().match(/\d/g);
  
  if (lastMatch == null)
    return 0;
  
  var lastNum = lastMatch.join("");
  
  var percentage = currentNum/lastNum*100 - 100+ "";;
  if (percentage.length > 5)
    percentage = percentage.substring(0,5);
  return percentage;
 
}



function formatShortDate(iDate)
{
  if (iDate == "")
    return "";
  
  var dateshort = " (" +iDate.getFullYear()
          + "-"+
          (iDate.getMonth() +1)+"-"
          + iDate.getDate()
//          + "("
//          + iDate.getHours() +":" 
//          + iDate.getMinutes() 
          + ")"
          ;
  return dateshort;
}


function showUpdatedPages()
{
  fillNotifications(null, "Updated");
  
}

function showDownPages()
{
    fillNotifications(null, "Down");
}

function showUpPages()
{
    fillNotifications(null, "Up");
}
// Fill the notifications list with notifications for each updated page. If
// no pages are updated, set the appropriate message. Calls updateButtonsState()
// when done constructing the table.
function fillNotifications(callback, selection) {
  getAllPages(function(pages) {
    $('#notifications').html('');
    
    var pagesCounter = 0;
    var updatesCounter = 0;
    var increasedCounter = 0;
    var decreasedCounter = 0;

    if (pages.length > 0) {

      
      $.each(pages, function(i, page) {
        
        pagesCounter++;
        
         if (page.updated)
        {
          updatesCounter++;
        }
        
         var percentage = get_percentage(page.current_price, page.initial_price);
        if (percentage>0)
        {
          increasedCounter++; 
        }
        else if (percentage < 0)
        {
          decreasedCounter++; 
        }
        else
        {
           
        }
      });
      var hasNotification = false;
      $.each(pages, function(i, page) {
        
        if (selection == "Updated")
        {
            if (page.updated == false) return true;     
        }
        
        var notification = $('#templates .notification').clone();
        var name = trimPageName(page);
        if (page.updated)
        {
          notification.find('.current_price_container').attr('style', "background-color:yellow;");
          notification.find('.mark_visited').attr('style', "visibility:visible;");
          hasNotification = true;
        }
        notification.find('.initial_price').attr('title', simplifyHTML(page.initial_price));
        notification.find('.initial_price').html(simplifyHTML(page.initial_price, 20));
        if (page.initial_price_date > 0)
        {
          var iDate = new Date(page.initial_price_date);
		    notification.find('.initial_price').attr('title', formatShortDate(iDate));
        }
        
        var currentPrice = simplifyHTML(page.current_price, 20);
     
        var checkPriceIsValid = checkPrice(currentPrice);
        if (checkPriceIsValid == "" || checkPriceIsValid == null)
        {
          currentPrice = "N/A";
          var description = "Price not available, either it is not there or it is provided in an unsupported format";
          notification.find('.current_price').attr('title', description);
        }
        else
        {
            var bestPriceDate ="";
            if (page.min_price_date >0)
            {
                var mindate = new Date(page.min_price_date);
                bestPriceDate = formatShortDate(mindate);
            }
          notification.find('.current_price').attr('title', simplifyHTML(page.current_price) + " [Best Price: "+simplifyHTML(page.min_price, 20)+" "+bestPriceDate+"]");
        }
        
        notification.find('.current_price').html(currentPrice);
        notification.find('.current_price_time').html("("+describeTimeSince(page.last_check)+")");
        
        var percentage = get_percentage(page.current_price, page.initial_price);
        if (percentage>0)
        {
         if (selection == "Down") return true;   

         notification.find('.percentage_increase').html("+"+percentage +"%");
         notification.find('.percentage_drop').attr('style', 'display:none;');
       }
        else if (percentage < 0)
        {
        if (selection == "Up") return true; 
         
         notification.find('.percentage_drop').html(percentage +"%");  
         notification.find('.percentage_increase').attr('style', 'display:none;');
        }
        else
        {
          if (selection == "Up" || selection == "Down") return true; 
          notification.find('.percentage_drop').attr('style', 'display:none;');
          notification.find('.percentage_increase').attr('style', 'display:none;');
        }
          notification.find('.min_price').attr('title', simplifyHTML(page.min_price));
          notification.find('.min_price').html(simplifyHTML(page.min_price, 20));
        
          if (page.min_price_date >0)
          {
            var mindate = new Date(page.min_price_date);
            notification.find('.min_price_time').html(formatShortDate(mindate));
          }
       
        notification.find('.page_link').attr('href', page.url).text(name);
        notification.find('.favicon').attr({src: getFavicon(page.url)});
        notification.find('.view_diff').attr({
          href: 'diff.htm#' + btoa(page.url)
        });

        if (page.folder_name != null && page.folder_name != "")
        {
          var found = false;
          var folder ;
          
          $("#notifications li").each(function(i) {
            var folder_name = $(this).parent('ol').parent('.folder').find('.folder_name').html();

          if ((folder_name != null && folder_name ==page.folder_name))
            {
            found = true;
            folder = $(this).parent('ol').parent('.folder');
            }
          });

          if (found == false)
              folder = $('#templates_folder .folder').clone();

          folder.find('.folder_name').html(page.folder_name);
          notification.appendTo(folder.find('ol'));
          folder.appendTo('#notifications');
        }
        else
        {
            notification.appendTo('#notifications');
        }
      });
      
      if (hasNotification == true)
      {
        $('#notify_all').removeClass('inactive');
        $('#notify_all img').attr('src', 'img/ok.png');
      }
      else
      {
        $('#notify_all').addClass('inactive');
        $('#notify_all img').attr('src', 'img/ok_inactive.png');
      }
    } else {
      $('#templates .empty').clone().appendTo('#notifications');
      $('#notify_all').addClass('inactive');
      $('#notify_all img').attr('src', 'img/ok_inactive.png');
    }
  
    $('#counter_all_pages span').html(pagesCounter);
    $('#counter_update_pages span').html(updatesCounter);
    $('#counter_down_pages span').html(decreasedCounter);
    $('#counter_up_pages span').html(increasedCounter);
  
    updateButtonsState();

    $("ol.main_table").sortable({
      group: 'simple_with_animation',
      pullPlaceholder: true,
        nested: true,
        vertical: true,
      // animation on drop
      onDrop: function  (item, targetContainer, _super) {
        var clonedItem = $('<li/>').css({height: 0})
        item.before(clonedItem)
        clonedItem.detach()
        _super(item)   
        storeFolderName();
  },

  // set item relative to cursor position
  onDragStart: function ($item, container, _super) {
    var offset = $item.offset(),
    pointer = container.rootGroup.pointer

    adjustment = {
      left: pointer.left - offset.left,
      top: pointer.top - offset.top
    }

    _super($item, container)
  },
  onDrag: function ($item, position) {
    $item.css({
      left: position.left - adjustment.left,
      top: position.top - adjustment.top
    })
  }
});
    
    (callback || $.noop)();
  });
  
    initializeTitleRename();
}

function storeFolderName()
{
   var url;
      $("#notifications li").each(function(i) {
        url = $(this).find('.page_link').attr('href');
          BG.setPageSettings(url, {order_number: i}, function() {});
          var folder_name = $(this).parent('ol').parent('.folder').find('.folder_name').html();
         
          if (folder_name != null && folder_name !="")
            BG.setPageSettings(url, {folder_name: folder_name}, function() {});
          else
            BG.setPageSettings(url, {folder_name: ""}, function() {});
    });
}
// Updates the state of the three main buttons of the popup.
// 1. If the page in the currently selected tab is being monitored, disables the
//    Monitor This Page button and replaces its text with a localized variant of
//    "Page is Monitored". If the current page is not an HTTP(S) one, disables
//    the button and set the text to the localized variant of "Monitor This
//    Page". Otherwise enables it and sets the text to a localized variant of
//    "Monitor This Page".
// 2. If there are any notifications displayed, enabled the View All button.
//    Otherwise disables it.
// 3. If there are any pages monitored at all, enabled the Check All button.
//    Otherwise disables it.
function updateButtonsState() {
  // Enable/Disable the Monitor This Page button.
  chrome.tabs.getSelected(null, function(tab) {
    isPageMonitored(tab.url, function(monitored) {
      if (monitored || !tab.url.match(/^https?:/)) {
        $('#monitor_page').unbind('click').addClass('inactive');
        $('#monitor_page img').attr('src', 'img/monitor_inactive.png');
        var message = monitored ? 'page_monitored' : 'monitor';
        $('#monitor_page span').text(chrome.i18n.getMessage(message));
      } else {
        // $('#monitor_page').click(monitorCurrentPage).removeClass('inactive');
        $('#monitor_page img').attr('src', 'img/monitor.png');
        $('#monitor_page span').text(chrome.i18n.getMessage('monitor'));
      }
    });
  });

  // Enable/Disable the View All button.
  if ($('#notifications .notification').length) {
    $('#view_all').removeClass('inactive');
    $('#view_all img').attr('src', 'img/view_all.png');
  
  } else {
    $('#view_all').addClass('inactive');
    $('#view_all img').attr('src', 'img/view_all_inactive.png');
  }
  

  // Enable/disable the Check All Now button.
  getAllPageURLs(function(urls) {
    getAllUpdatedPages(function(updated_urls) {
      if (urls.length == 0) {
        $('#check_now').addClass('inactive');
        $('#check_now img').attr('src', 'img/refresh_inactive.png');
      } else {
        $('#check_now').removeClass('inactive');
        $('#check_now img').attr('src', 'img/refresh.png');
      }
    });
  });
  initializePageCheck();
}

// Force a check on all pages that are being monitored. Does some complex
// animation to smoothly slide in the current notifications or the "no changes"
// message, display a loading bar while checking, then slide out the new
// notifications or the "no changes" message.
function checkAllPages() {
  getAllPageURLs(function(urls) {
    var records_displayed = $('#notifications .notification').length;
    var fadeout_target;

    // Disable this event handler.
    $('#check_now').unbind('click');

    // Slide in the notifications list.
    // NOTE: Setting opacity to 0 leads to jumpiness (maybe setting
    //       display: none), so using 0.01 as a workaround.
    if (records_displayed > 0) {
      fadeout_target = {height: '2.7em', opacity: 0.01};
    } else {
      fadeout_target = {opacity: 0.01};
    }

    $('#notifications').animate(fadeout_target, 'slow', function() {
      // Once the list has slid into its minimal state, remove all contents
      // and fade in the loader.
      $(this).html('').addClass('loading');
      $('#templates .loading_spacer').clone().appendTo($(this));
      $(this).show().animate({opacity: 1.0}, 400);
    });

    // Run the actual check.
    BG.check(true, function() {
      // Fade out the loader.
      $('#notifications').animate({opacity: 0}, 400, function() {
        var that = $(this);
        // Fill the table - done at this point to get the final height.
        fillNotifications(function() {
          // Remember the height and content of the table.
          var height = that.height();
          var html = that.html();

          // Remove the loader, empty the table, and reset its height back to
          // 2.7em. The user does not see any change from the time the fade-out
          // finished.
          that.removeClass('loading').html('').css('height', '2.7em');
          // Slide the table to our pre-calculated height.
          that.animate({height: height + 'px'}, 'slow', function() {
            // Put the table contents back and fade it in.
            that.css('height', 'auto').html(html).animate({opacity: 1}, 400);
            $('#check_now').click(checkAllPages);
          });
        });
      });
    });
  });
}

// Triggers a click() event on either all the view_diff links or all the
// page_link links, depending on the value of SETTINGS.view_all_action ("diff"
// or "original").
function openAllPages() {
 // var action = getSetting(SETTINGS.view_all_action);
 // var target = (action == 'diff') ? 'view_diff' : 'page_link';
  var target =  'mark_visited';
  $('#notifications .' + target).click();
}

function notifyAll()
{
  var target =  'mark_visited';
  $('#notifications .' + target).click();
}

// Opens the <a> link on which it is called (i.e. the this object) in a new
// unfocused tab and returns false.
function openLinkInNewTab(event) {
  
  var urlAddress = this.href;
  
    if (urlAddress.indexOf("amazon.com") > 0 && urlAddress.indexOf("&tag=dtechoffer-20") < 0)
    {
      var isAmazonOpen = false;

      chrome.tabs.query({},function(tabs){     
        tabs.forEach(function(tab){
           if (tab.url.indexOf("amazon.com") > 0)
                isAmazonOpen = true;
        });

        if (isAmazonOpen == false && urlAddress.indexOf("tag=")<0)
          urlAddress = urlAddress + "&tag=spmtrc-20";

        chrome.tabs.create({url: urlAddress, selected: true});
        event.preventDefault();
	  });
    }
    else if (urlAddress.indexOf("booking.com") > 0)
    {
        if (urlAddress.indexOf("&aid=859976") > 0)
        {

        }
        else if (urlAddress.indexOf("aid=") > 0)
        { 
           urlAddress = urlAddress.substring(0, urlAddress.indexOf("aid=")) + "aid=859976" +urlAddress.substring( urlAddress.indexOf("aid=") + 10);
        }
        else if (urlAddress.endsWith("&"))
		{
          urlAddress = urlAddress + "aid=859976";
        }
        else
       {
         urlAddress = urlAddress + "&aid=859976";
       }
			
        chrome.tabs.create({url: urlAddress, selected: true});
        event.preventDefault();
    } 
    else if (urlAddress.indexOf("ebay.") > 0)
    {
      var isEbayOpen = false;
      chrome.tabs.query({},function(tabs){     
        tabs.forEach(function(tab){
           if (tab.url.indexOf("ebay.") > 0)
                isEbayOpen = true;
        });
            if (isEbayOpen == false)
            {
                if (urlAddress.indexOf("ebay.es") > 0)
                {
                  urlAddress = "http://rover.ebay.com/rover/1/1185-53479-19255-0/1?ff3=4&pub=5575013990&toolid=10001&campid=5337557119&customid=&mpre=" + urlAddress;
                }
                else if (urlAddress.indexOf("ebay.co.uk") > 0)
                {
                  urlAddress = "http://rover.ebay.com/rover/1/710-53481-19255-0/1?ff3=4&pub=5575013990&toolid=10001&campid=5337557119&customid=&mpre=" + urlAddress;
                }
                else if (urlAddress.indexOf("ebay.com") > 0)
                {
                  urlAddress = "http://rover.ebay.com/rover/1/711-53200-19255-0/1?ff3=4&pub=5575013990&toolid=10001&campid=5337557119&customid=&mpre=" + urlAddress;
                }
                else if (urlAddress.indexOf("ebay.it") > 0)
                {
                  urlAddress = "http://rover.ebay.com/rover/1/724-53478-19255-0/1?ff3=4&pub=5575013990&toolid=10001&campid=5337557119&customid=&mpre=" + urlAddress;
                }
                else if (urlAddress.indexOf("ebay.fr") > 0)
                {
                  urlAddress = "http://rover.ebay.com/rover/1/709-53476-19255-0/1?ff3=4&pub=5575013990&toolid=10001&campid=5337557119&customid=&mpre=" + urlAddress;
                }
                else if (urlAddress.indexOf("ebay.de") > 0)
                {
                  urlAddress = "http://rover.ebay.com/rover/1/707-53477-19255-0/1?ff3=4&pub=5575013990&toolid=10001&campid=5337557119&customid=&mpre=" + urlAddress;
                }

              if (urlAddress.indexOf("ebay.es") > 0)
              {
                urlAddress = "http://rover.ebay.com/rover/1/1185-53479-19255-0/1?ff3=4&pub=5575013990&toolid=10001&campid=5337557119&customid=&mpre=" + urlAddress;
              }

              if (urlAddress.indexOf("ebay.co.uk") > 0)
              {
                urlAddress = "http://rover.ebay.com/rover/1/710-53481-19255-0/1?ff3=4&pub=5575013990&toolid=10001&campid=5337557119&customid=&mpre=" + urlAddress;
              }
            }
        
              chrome.tabs.create({url: urlAddress, selected: true});
              event.preventDefault();
           
         });   
    }
   else
   {
  
    chrome.tabs.create({url: urlAddress, selected: true});
    event.preventDefault();
   }
  //event.window.close();
}

// Open a diff page in a new unfocused tab. Expects to be called on an element
// within a notification record. The opened diff page will be for the URL of the
// notification record.
function openDiffPage() {
  var diff_url = 'diff.htm#' + btoa(getNotificationUrl(this));
  chrome.tabs.create({url: diff_url, selected: false});
}

// Remove the page from the monitoring registry. Expects to be called on an
// element within a notification record. The removed page will be for the URL
// of the notification record.
function stopMonitoring() {
  BG.removePage(getNotificationUrl(this));
}

function removeFolder()
{
  var folderList= $(this).closest('.folder').find('.folder_products li');

  folderList.each(function(i) {
    var url = getNotificationUrl(this);
      BG.setPageSettings(url, {folder_name: ""}, function() {});
  });
  fillNotifications(null);
}

function openLinksFolder()
{
  var folderList= $(this).closest('.folder').find('.folder_products li');

  folderList.each(function(i) {
      var url = getPageLink(this);
      url.closest('.notification').find('.page_link').click()
  });

}



function addFolder(){
    var folder = $('#templates_folder .folder').clone(); 
    folder.find('.folder_name').html(chrome.i18n.getMessage('new_folder'));
    folder.appendTo('#notifications');
}

// Sets up handlers for the various interactive parts of the popup, both the
// three global button and the three per-notification buttons.
function setUpHandlers() {
  // Handlers for the main buttons.
  $('#monitor_page').click(monitorCurrentPage);
  $('#check_now').click(checkAllPages);
  $('#view_all').click(openAllPages);
  $('#notify_all').click(notifyAll);
  $('#add_folder').click(addFolder);
  
  $('#counter_update_pages').click(showUpdatedPages);
  $('#counter_all_pages').click(fillNotifications);
  $('#counter_down_pages').click(showDownPages);
  $('#counter_up_pages').click(showUpPages);
  
  
  // Live handlers for the per-notifications buttons.
  var buttons = $('.page_link,.mark_visited,.view_diff,.stop_monitoring');
  buttons.live('click', markPageVisited);
  $('.page_link').live('click', openLinkInNewTab);
  $('.stop_monitoring').live('click', stopMonitoring);
  $('.remove_folder').live('click', removeFolder);
  $('.open_links_folder').live('click', openLinksFolder);
  $('.reselect_price').live('click', reselectPrice);
  $('.expand_collaps_folder').live('click', expandCollapsFolder);
  $('.modify').live('click', showModify);
  $('.revert_initial_price').live('click', revertInitialPrice);
  

  // Add a margin when there's a scrollbar, after the popup is resized.
  $(window).resize(function() {
    var html = $('html').get(0);
    var margin = (html.scrollHeight > html.clientHeight) ? '1em' : '0';
    $('body').css('margin-right', margin);
  });
  
  initializeFolderNameClick();
 
}

function folderNamedbClickEvent()
{
    var content = $(this).text();
    var width = $(this).width() -1;
    var height = $(this).height() - 2;

    var $editbox = $("<input type='text'" +
    "style='width:" + width + ";" +
    "height:" + height + ";" +
    "border:none" +
    "' value='" +  content + "' />"); 

    $(this).empty();
    $(this).prepend($editbox);
    $editbox.focus();
    $editbox.select();

    $($editbox).keyup(function(e){

  if (e.which != 13) {
       return;
  }
  content = $(this).val();
    var parent = $(this).parent();
    parent.html(content); 
     storeFolderName();
    });
}

function folderRenameIconClickEvent()
{
    var page_title= $(this).closest('.folder').find('.folder_name');
    var content = $(page_title).text();
    var width = $(page_title).width() -1;
    var height = $(page_title).height() - 2;

    var $editbox = $("<input type='text'" +
    "style='width:" + width + ";" +
    "height:" + height + ";" +
    "border:none" +
    "' value='" +  content + "' />"); 

    $(page_title).empty();
    $(page_title).prepend($editbox);
    $editbox.focus();
    $editbox.select();

    $($editbox).keyup(function(e){

  if (e.which != 13) {
       return;
  }
     content = $($editbox).val();
     page_title.html(content); 
     storeFolderName();
    });
  
}

function initializeFolderNameClick()
{
  
   $(".folder_name").live('dblclick',folderNamedbClickEvent);
  
//   $('.folder_name_containter').live('mouseover', function() {
//     var renameIcon= $(this).closest('.folder').find('.rename_folder');
//     renameIcon.attr("style", "display:block;");
//   });
//   
//   $('.folder_name_containter').live('mouseout', function() {
//     var renameIcon= $(this).closest('.folder').find('.rename_folder');
//     renameIcon.attr("style", "display:none;");
//   });
//  
// 
   $('.rename_folder').live('click', folderRenameIconClickEvent);
}

function initializePageCheck() {
  $('.check_now_page').live('click', function() {
    var timestamp = $(this).closest('.notification').find('.current_price_time');
    var url = findUrlPage(this);
    var progress_message = chrome.i18n.getMessage('check_in_progress') + '..';


    timestamp.bind('time_updated', function() {
    var $span = $(this);
    getPage(url, function(page) {
      var last_check = page.last_check ? describeTimeSince(page.last_check)
                                       : chrome.i18n.getMessage('never');

      if (last_check != $span.text()) {
        $span.fadeOut('slow', function() {
          $span.text(last_check).fadeIn('slow');
            fillNotifications(null);
        });
      }
    });
    }); 
    
    timestamp.text(progress_message);
    BG.checkPage(url, function(url) {
      timestamp.trigger('time_updated');
      //BG.updateBadge();
      //checkAllPages();
    });
  });
}

function initializeTitleRename() {
  $('.rename_page').live('click', function() {
    
    var page_title= $(this).closest('.notification').find('.page_link');
    var page_url = findUrlPage(this);
    var content = $(page_title).text();
    var width = $(page_title).width() -1;
    var height = $(page_title).height() - 2;
     
 
    var $editbox = $("<input type='text'" +
    "style='width:" + width + ";" +
    "height:" + height + ";" +
    "border:none" +
    "' value='" +  content + "'/>"); 

    $(page_title).empty();
    $(page_title).prepend($editbox);
    $editbox.focus();
    $editbox.select();

    var cliccable = false;

    page_title.attr("href",page_url).click( 
     function() {
     return cliccable;
     });
     
    $($editbox).keyup(function(e){

    if (e.which != 13) {
        return;
    }
  
     content = $($editbox).val();
     page_title.html(content); 
     cliccable = true;
    
      
     BG.setPageSettings(page_url, {name: content}, function() {});
    });
  });
}

function findUrlPage(context) {
  return $(context).closest('.notification').find('.page_link').get(0).href;
}
// Initializes the Pick button in the page mode selector. On click, the button
// spawns a tab with the URL of the page in the its record, then injects jquery,
// followed by scripts/selector.js  and styles/selector.css into the tab.
function initializePageModePickerPopup(tab) {
  chrome.tabs.executeScript(tab.id, {file: 'lib/jquery-1.7.1.js'},
        function() {
          chrome.tabs.executeScript(tab.id, {file: 'scripts/selector.js'},
          function() {
            chrome.tabs.executeScript(tab.id, {code: '$(initialize);'});
            });
          chrome.tabs.insertCSS(tab.id, {file: 'styles/selector.css'});
  
          setTimeout(function(){window.close()},1000) 
          });
}

window.addEventListener('DOMContentLoaded', function() {
  var login = document.querySelector('input#login');

  login.addEventListener('click', function() {
      alert("FUNCIONA FILHO DA PUTAAA");
  });
});