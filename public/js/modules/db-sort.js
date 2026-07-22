(function() {
  if (window._dbSortLoaded) return;
  window._dbSortLoaded = true;
  
  window.updateStatusLine = function(ids) {
    var sl = document.getElementById('sortStatusLine');
    if (!sl) {
      sl = document.createElement('div');
      sl.id = 'sortStatusLine';
      sl.style.cssText = 'margin-top:8px;font-size:12px;color:#555;';
      var tc = document.querySelector('.table-container');
      if (tc) tc.parentNode.insertBefore(sl, tc.nextSibling);
    }
    sl.textContent = ids.length + ': ' + ids.join(' - ');
  };
  
  window.saveSortToDB = function(order, key, dir) {
    fetch('/api/table-sort/systems', {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({sort_order: order, sort_key: key || null, sort_dir: dir || 'asc'})
    }).catch(function(e){console.error(e);});
  };
  
  window.saveFilterToDB = function(cabinets) {
    fetch('/api/table-sort/systems', {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({filter_data: {cabinets: cabinets}})
    }).catch(function(e){console.error(e);});
  };
})();
