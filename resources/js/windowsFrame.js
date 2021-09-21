try {

    class ClassWatcher {

        constructor(targetNode, classToWatch, classAddedCallback, classRemovedCallback) {
            this.targetNode = targetNode;
            this.classToWatch = classToWatch;
            this.classAddedCallback = classAddedCallback;
            this.classRemovedCallback = classRemovedCallback;
            this.observer = null;
            this.lastClassState = targetNode.classList.contains(this.classToWatch);

            this.init();
        };

        init() {
            this.observer = new MutationObserver(this.mutationCallback);
            this.observe();
        }

        observe() {
            this.observer.observe(this.targetNode, { attributes: true })
        };

        disconnect() {
            this.observer.disconnect()
        };

        mutationCallback = mutationsList => {
            for(let mutation of mutationsList) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    let currentClassState = mutation.target.classList.contains(this.classToWatch);
                    if(this.lastClassState !== currentClassState) {
                        this.lastClassState = currentClassState;
                        if(currentClassState) {
                            this.classAddedCallback();
                        }
                        else {
                            this.classRemovedCallback();
                        }
                    }
                }
            }
        }
    }

    if (document.querySelector('.web-nav-window-controls') === null && document.getElementsByClassName('web-nav-window-controls').length === 0) {
        new ClassWatcher(document.body, 'not-authenticated', function() { document.getElementsByClassName('web-chrome-window-controls')[0].classList.remove('web-chrome-window-controls'); }, function () { document.getElementsByClassName('web-nav-window-controls')[0].classList.add('web-chrome-window-controls'); });

        document.getElementsByClassName('web-navigation')[0].insertAdjacentHTML('afterbegin', `
        <div class="web-main-drag">
        </div>
        <div class="web-nav-window-controls">
            <span id="minimize" onclick="ipcRenderer.send('minimize')"></span>
            <span id="maximize" onclick="ipcRenderer.send('maximize')"></span>
            <span id="close" onclick="ipcRenderer.send('close')"></span>
        </div>
        `);

        if (document.getElementsByClassName('search-scope-bar search__scope-bar search-scope-bar--desktop-search').length > 0) {
            document.getElementsByClassName('search-scope-bar search__scope-bar search-scope-bar--desktop-search')[0].style.top = '25px';
        }

        if (document.getElementsByClassName('web-chrome')[0].style.display === 'none' && document.getElementsByClassName('web-chrome-window-controls').length > 0) {
            document.getElementsByClassName('web-chrome-window-controls')[0].classList.remove('web-chrome-window-controls');
        } else {
            document.getElementsByClassName('web-nav-window-controls')[0].classList.add('web-chrome-window-controls');
        }

        if (document.body.classList.contains('not-authenticated') && document.getElementsByClassName('web-chrome-window-controls').length > 0) {
            document.getElementsByClassName('web-nav-window-controls')[0].classList.remove('web-chrome-window-controls');
        }
    }
} catch (e) {
    console.error("[CSS] Error while trying to apply windowsFrame.js", e);
}