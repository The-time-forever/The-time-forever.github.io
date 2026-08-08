(function () {
  var query = "";
  var activeFilter = "all";
  var search = document.getElementById("post-search");
  var filters = Array.prototype.slice.call(document.querySelectorAll(".filter"));
  var posts = Array.prototype.slice.call(document.querySelectorAll(".post-item"));
  var years = Array.prototype.slice.call(document.querySelectorAll(".year-group"));
  var empty = document.getElementById("empty-state");

  function updatePosts() {
    var visible = 0;
    posts.forEach(function (post) {
      var content = (post.textContent + " " + post.dataset.search).toLowerCase();
      var matchesQuery = !query || content.indexOf(query) !== -1;
      var matchesFilter = activeFilter === "all" ||
        post.dataset.category.split(/\s+/).indexOf(activeFilter) !== -1;
      var show = matchesQuery && matchesFilter;
      post.hidden = !show;
      if (show) visible += 1;
    });
    years.forEach(function (year) {
      year.hidden = !year.querySelector(".post-item:not([hidden])");
    });
    empty.classList.toggle("visible", visible === 0);
  }

  search.addEventListener("input", function () {
    query = search.value.trim().toLowerCase();
    updatePosts();
  });

  filters.forEach(function (filter) {
    filter.addEventListener("click", function () {
      activeFilter = filter.dataset.filter;
      filters.forEach(function (item) {
        item.setAttribute("aria-pressed", String(item === filter));
      });
      updatePosts();
    });
  });
}());
