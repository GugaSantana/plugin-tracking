/*
  A visual selector builder script to be inserted into arbitrary pages. Once the
  page loads, a set of controls is inserted into the page and these allow the
  user to visually select an element, and the script generates a selector behind
  the scenes. Once the user accepts their selection, a message is broadcasted
  to the extension with the selector and the URL of the page in question and the
  tab is closed.
*/

// Constants.
var OUTLINE_CLASS = 'chrome_page_monitor_outline';
var TEMP_OUTLINE_CLASS = 'chrome_page_monitor_temp_outline';
var ACTIVE_CLASS = 'chrome_page_monitor_active';
var DISABLED_CLASS = 'chrome_page_monitor_disabled';

// Picking state.
var current_element = null;
var current_selector = '';
var pick_mode = true;
var pick_price = '';

// References to the controls.
var frame = null;
// Updates current_selector, the visual outline and the state of various buttons
// depending on the value of current_element.
function currentElementChanged() {
  $('*').removeClass(TEMP_OUTLINE_CLASS).removeClass(OUTLINE_CLASS);

  if (current_element) {
    $(current_element).addClass(OUTLINE_CLASS);
    current_selector = elementToSelector(current_element);
  } else {
    current_selector = '';
  }
}

// Takes an element and walks up its hierarchy constructing a selector which
// would match this element (and hopefully it alone). Stops as soon as it
// reaches an element with a defined ID attribute or when reaching the <body>.
// Ignores classes starting with chrome_page_monitor_ (e.g. the outline class).
// Elements outside of <body> return null.
function elementToSelector(element) {
  var path = [];

  element = $(element);

  if (element.is('body')) {
    return 'body';
  } else if (element.closest('body').length == 0) {
    return null;
  } else {

      var tagname = element.get(0).tagName.toLowerCase();
      var classname = element.get(0).className;
      var price = element.get(0).innerText;
	  pick_price = price;
      classname = classname.replace(/chrome_page_monitor_\w+/g, '')
                           .replace(/^\s+|\s+$/g, '')
                           .replace(/\s+/g, '.');

      var selector = ('<'+tagname + ' class="' + classname + '">'+ price +'<\\'+tagname+">");
      return selector;
  }
}

// Sets up the mousemove and click handlers for the <body> to highlight the
// element currently being hovered on with the chrome_page_monitor_temp_outline
// class and the selected one with chrome_page_monitor_active. Also sets
// current_element if one is clicked in pick mode, deactivates the pick button
// by removing its chrome_page_monitor_active class and calls
// currentElementChanged() to update the selection. Elements inside the control
// block are ignored during selection.
function setUpBodyHandlers(id_group) {
  $('body').mousemove(function(e) {
    if (pick_mode) {
      $('*').removeClass(TEMP_OUTLINE_CLASS);
      $(e.target).addClass(TEMP_OUTLINE_CLASS);
	  
    }
  });

  $('body').click(function(e) {
    if (pick_mode) {
      var element = e.target;
      if (!($(element).is('body'))) {
        current_element = element;
        currentElementChanged();
        pick_mode = false;
        
        if (current_selector) {

          var vname = document.title;
          var vlink = window.location.href;
          var vtag = current_selector;

          var d = {
            name: vname,
            link: vlink,
            tag: vtag.replace(/"/g,"'"),
            group_id: id_group
        }

        //console.log(JSON.stringify(d));
			
		  var verifyPrice = pick_price.replace('R$ ', '').replace('R$', '').replace(',','').replace('.','');
		  //alert(verifyPrice);

      if(!isNaN(verifyPrice)){
			
			  fetch("https://za7gskmdj6.execute-api.us-east-1.amazonaws.com/dev/products", {
				method: 'post',

				headers: {
				  "Content-Type": "application/json",
				  "x-api-key": "jQ29xfDWTZ9SKDLAe1tf35FxYXtYWpnG371VSwS7"
				},
				body: JSON.stringify(d)
				})
				.then(function (data) {
				  console.log(data);
				  alert("Preço adicionado com sucesso!");
				  $(e.target).removeClass(OUTLINE_CLASS);
				})
				.catch(function (error) {
          console.log(data);
				  alert("Falha ao adicionar preço!");
				});

			  //alert(window.location.href);
			  //alert(current_selector);
			  
			  //removeFrame();
		  }
		  else{
			  alert("Preço inválido");
			  $(e.target).removeClass(OUTLINE_CLASS);
			  }
	  
    } else {
      window.removeFrame();
    }
      }
      return false;
    }
  });
}



// The main function. Inserts the controls, updates the global references to
// them, then sets up event handlers for everything by calling
// setUpBodyHandlers() and setUpButtonHandlers().
function initialize(id_group) {
  setUpBodyHandlers(id_group);
}

function removeFrame()
{
  //frame = $('#' + FRAME_ID);
 // frame.hide();
 location.reload();
}