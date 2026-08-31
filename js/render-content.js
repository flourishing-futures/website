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

  /* --- Resources table (resource-centre.html) ----------------------- */
  function renderResources(items) {
    var featured = document.querySelector('.res-featured');
    var press = document.querySelector('.res-press');
    if (!featured && !press) return;

    var tableHtml =
      '<div class="res-table">' +
        '<table>' +
          '<thead><tr>' +
            '<th>Title</th>' +
            '<th>Source</th>' +
            '<th>Type</th>' +
          '</tr></thead>' +
          '<tbody>';

    for (var i = 0; i < items.length; i++) {
      var r = items[i];
      tableHtml +=
        '<tr>' +
          '<td>' +
            '<a href="' + r.url + '" class="res-table__link"' +
              (r.url.indexOf('http') === 0 ? ' target="_blank" rel="noopener"' : '') +
            '>' + r.title + '</a>' +
            '<span class="res-table__desc">' + r.description + '</span>' +
          '</td>' +
          '<td>' + r.source + '</td>' +
          '<td><span class="res-table__type">' + r.type + '</span></td>' +
        '</tr>';
    }

    tableHtml += '</tbody></table></div>';

    if (featured) {
      featured.innerHTML = '<div class="res-featured__bg"></div>' + tableHtml;
    }
    if (press) press.remove();
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
