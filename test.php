	//assign value back to the form element
if(ui.item){
currentSearchArguments = { 'programid': ui.item.value , 'sort' : 'onlinedate+desc' };
// append loader html
$('section.page').append('<div class="md-box indicator active"><div class="box"><p>Moment items ophalen</p></div></div>');

// get the partial results from the listcreator extension by calling the 'search' action.
$.ajax({
async: 'true',
url: 'gemist',
type: 'GET',
data: {
eID: "ajaxDispatcher",
request: {
pluginName: 'listcreator',
controller: 'ListCreator',
action: 'search',
arguments: currentSearchArguments
}
},
success: function (result) {
$('section.page').fadeOut(300, function() {
$('section.page').empty().append(result);

// get the programinfo
$.ajax({
async: 'true',
url: 'gemist',
type: 'GET',
data: {
eID: "ajaxDispatcher",
request: {
pluginName: 'listcreator',
controller: 'ListCreator',
action: 'searchProgramInfo',
arguments: currentSearchArguments
}
},
success: function(result){
$('.page-header > h1').remove();

($('.pipHeader').length > 0)
$('pipHeader').remove();

// we have to remove the programid filter if there has been searched with programid
if(currentSearchArguments['programid'] && $('#Filters li[data-filter="programid"]'))
{
$('#Filters li[data-filter="programid"]').remove()
}
$('.page-header').append(result).fadeIn(1000);
}
});

if ($('ul.results').find('li').length == 0)
IsotopeOverview.NoSearchResults(result);
else
$('section.page').fadeIn(300, function(){
IsotopeOverview.SearchResultsInit();
IsotopeOverview.SearchResultsPagingInit();
IsotopeOverview.SearchResultsSortInit();
});
});
},
error: function (error) {
console.log(error);
}
});
event.preventDefault();