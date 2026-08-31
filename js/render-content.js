(function () {
  var data = window.SITE_CONTENT;
  if (!data) return;

  if (data.lately) renderLately(data.lately);
  if (data.resources) renderResources(data.resources);
  if (data.events) renderEvents(data.events);

  /* --- Lately cards (index.html) ------------------------------------ */
  function renderLately(items) {
    var stack = document.querySelector('.lately__stack');
    if (!stack || items.length < 2) return;

    var html = '';
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var bodyHtml = '';
      for (var j = 0; j < item.body.length; j++) {
        bodyHtml += '<p class="lately-card__body">' + item.body[j] + '</p>';
      }
      html +=
        '<article class="lately-card" data-pos="' + i + '">' +
          '<div class="lately-card__content">' +
            '<h2 class="lately-card__heading">' + item.heading + '</h2>' +
            bodyHtml +
            '<div><a href="' + item.cta.href + '" class="btn btn--' + item.cta.style + '">' + item.cta.text + '</a></div>' +
          '</div>' +
          '<div class="lately-card__image">' +
            '<img src="' + item.image.src + '" alt="' + item.image.alt + '">' +
          '</div>' +
        '</article>';
    }
    stack.innerHTML = html;

    if (items.length > 3) injectLatelyPositionCSS(items.length);
  }

  function injectLatelyPositionCSS(count) {
    var style = document.createElement('style');
    var rules = '';
    for (var i = 3; i < count; i++) {
      rules +=
        '.lately-card[data-pos="' + i + '"]{' +
          'transform:translate(' + (i * 16) + 'px,' + (i * 20) + 'px) rotate(' + (i * 1.6) + 'deg);' +
          'z-index:' + (count - i) + ';' +
        '}';
    }
    style.textContent = rules;
    document.head.appendChild(style);
  }

  /* --- Resources browse (resource-centre.html) ---------------------- */
  function renderResources(items) {
    var featured = document.querySelector('.res-featured');
    var press = document.querySelector('.res-press');
    if (!featured && !press) return;

    var types = [];
    for (var i = 0; i < items.length; i++) {
      if (types.indexOf(items[i].type) === -1) types.push(items[i].type);
    }

    var html = '<div class="res-browse">';

    html +=
      '<div class="res-browse__search">' +
        '<svg class="res-browse__search-icon" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">' +
          '<circle cx="13" cy="13" r="10" stroke="currentColor" stroke-width="2.5"/>' +
          '<line x1="20.5" y1="20.5" x2="29" y2="29" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>' +
        '</svg>' +
        '<input type="text" placeholder="Search" class="res-browse__search-input" id="res-search">' +
      '</div>';

    html += '<div class="res-browse__tags">';
    for (var i = 0; i < types.length; i++) {
      html += '<button class="res-browse__tag" data-type="' + types[i] + '">' + types[i] + '</button>';
    }
    html += '<button class="res-browse__tag res-browse__tag--clear" style="display:none">× Clear all</button>';
    html += '</div>';

    html += '<div class="res-browse__list" id="res-list">';
    for (var i = 0; i < items.length; i++) {
      var r = items[i];
      var target = r.url.indexOf('http') === 0 ? ' target="_blank" rel="noopener"' : '';
      html +=
        '<div class="res-browse__item" data-type="' + r.type + '">' +
          '<p class="res-browse__source">' + r.source + '</p>' +
          '<h3 class="res-browse__title"><a href="' + r.url + '"' + target + '>' + r.title + '</a></h3>' +
          '<p class="res-browse__desc">' + r.description + '</p>' +
        '</div>';
    }
    html += '</div></div>';

    if (featured) {
      featured.classList.add('res-featured--browse');
      featured.innerHTML = html;
    }
    if (press) press.remove();

    var activeTypes = [];
    var searchInput = document.getElementById('res-search');
    var tagButtons = featured.querySelectorAll('.res-browse__tag:not(.res-browse__tag--clear)');
    var clearBtn = featured.querySelector('.res-browse__tag--clear');
    var listItems = featured.querySelectorAll('.res-browse__item');
    var list = document.getElementById('res-list');

    function filterItems() {
      var query = searchInput.value.toLowerCase();
      var visible = 0;

      for (var i = 0; i < listItems.length; i++) {
        var item = listItems[i];
        var type = item.getAttribute('data-type');
        var text = item.textContent.toLowerCase();
        var matchesType = activeTypes.length === 0 || activeTypes.indexOf(type) !== -1;
        var matchesSearch = !query || text.indexOf(query) !== -1;
        var show = matchesType && matchesSearch;
        item.style.display = show ? '' : 'none';
        if (show) visible++;
      }

      clearBtn.style.display = activeTypes.length > 0 ? '' : 'none';

      var empty = list.querySelector('.res-browse__empty');
      if (visible === 0) {
        if (!empty) {
          empty = document.createElement('p');
          empty.className = 'res-browse__empty';
          empty.textContent = 'No resources match your search.';
          list.appendChild(empty);
        }
      } else if (empty) {
        empty.remove();
      }
    }

    searchInput.addEventListener('input', filterItems);

    for (var i = 0; i < tagButtons.length; i++) {
      tagButtons[i].addEventListener('click', function () {
        var type = this.getAttribute('data-type');
        var idx = activeTypes.indexOf(type);
        if (idx === -1) {
          activeTypes.push(type);
          this.classList.add('res-browse__tag--active');
        } else {
          activeTypes.splice(idx, 1);
          this.classList.remove('res-browse__tag--active');
        }
        filterItems();
      });
    }

    clearBtn.addEventListener('click', function () {
      activeTypes.length = 0;
      for (var j = 0; j < tagButtons.length; j++) {
        tagButtons[j].classList.remove('res-browse__tag--active');
      }
      filterItems();
    });
  }

  /* --- Events (community.html) -------------------------------------- */
  function renderEvents(items) {
    var card = document.querySelector('.comm-events .about-develop__card');
    if (!card) return;

    items.sort(function (a, b) {
      return new Date(b.date) - new Date(a.date);
    });

    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var html = '';

    for (var i = 0; i < items.length; i++) {
      var ev = items[i];
      var eventDate = new Date(ev.date);
      var isUpcoming = eventDate >= today;
      var isLast = i === items.length - 1;

      var classes = 'about-develop__item about-develop__item--expanded';
      if (isLast) classes += ' about-develop__item--last';

      var badgeClass = isUpcoming ? 'comm-events__badge' : 'comm-events__badge comm-events__badge--past';
      var badgeText = isUpcoming ? 'Upcoming' : 'Past';

      var linkHtml = '';
      if (ev.link) {
        linkHtml = '<a href="' + ev.link + '" target="_blank" rel="noopener" class="comm-events__link">View on Luma →</a>';
      }

      var tagsHtml = '';
      if (ev.tags && ev.tags.length) {
        tagsHtml = '<p class="comm-events__format">' + ev.tags.join(' · ') + '</p>';
      }

      html +=
        '<div class="' + classes + '">' +
          '<div class="comm-events__meta">' +
            '<span class="' + badgeClass + '">' + badgeText + '</span>' +
            '<span class="comm-events__date">' + formatDate(ev.date) + '</span>' +
          '</div>' +
          '<h3 class="about-develop__item-title">' + ev.title + '</h3>' +
          '<p class="about-develop__item-desc">' + ev.description + '</p>' +
          tagsHtml +
          linkHtml +
        '</div>';
    }

    card.innerHTML = html;
  }

  function formatDate(iso) {
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var parts = iso.split('-');
    var day = parseInt(parts[2], 10);
    var month = months[parseInt(parts[1], 10) - 1];
    var year = parts[0];
    return day + ' ' + month + ' ' + year;
  }
})();
