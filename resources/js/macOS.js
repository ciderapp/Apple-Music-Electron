try {
  if (document.getElementById('web-navigation-search-box') && !document.querySelector('.dragDiv')) {
    document.getElementById('web-navigation-search-box').insertAdjacentHTML('beforebegin', `
    <div style="width: 100%; height: 55px; -webkit-app-region: no-drag; background-color: transparent !important; -webkit-user-select: none; padding-left: 3px; padding-top: 3px">
        <div class="dragDiv" style="width: 100%; height: 100%; -webkit-app-region: drag;">
        </div>
    </div>
    `)
  }
} catch (e) {
  console.error("[JS] Error while trying to apply macOS.js", e);
}