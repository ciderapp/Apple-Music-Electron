try {
    /* todo
    # duplicates
        it is not possible to handle duplicates in playlists with the web version
        if you start the playback by clicking 'play' they get added as 'library-song' but are skipped ('position' / 'nextPlayableItemIndex')
        if you double click a row they simply do not appear
        if you modify the queue before sending the items with 'setQueue(...)' and add duplicates that way they all get consumed at the same time once the first instance starts to play
            sometimes they will be visible in the queue, sometimes not
            clicking 'next' will behave like a clicking 'pause' until you have exhausted all duplicate entries
        conclusion: it's better to remove them before sending them to the queue

    # sort
    deciding between ascending and descending
    combine multiple types of sorting
    */

    /* check for https://music.apple.com/library/playlist/ (and the beta variant + language code) */
    let playlistMatcher = window.location.href.match(/(https:\/\/)(beta\.)?(music\.apple\.com\/library\/playlist\/)(p\..{15})(\?l=.{2,5})?/);

    let observer;
    let contentNode;

    let songs = new Map();
    let songNodes = new Map();
    let duplicateIndex = new Map();

    /* needed to apply the sort to the newly loaded elements */
    let lastSortType;

    let fixToAllowSort = [];
    let isSortAllowed = false;
    let blockQueueSorting = false;

    let playlistID;

    let processedCachedObjects = [];

    /* check if playlist id is set */
    if (playlistMatcher && playlistMatcher.length === 6 && playlistMatcher[4]) {
        contentNode = document.getElementsByClassName('songs-list')[0];

        if (contentNode) {
            observer = createObserver();
            observer.observe(contentNode, {subtree: false, childList: true});

            let nodes = contentNode.getElementsByClassName('songs-list-row');

            for (let node of nodes) {
                fillSongNodes(node);
            }

            playlistID = playlistMatcher[4].toLowerCase();

            MusicKit.getInstance().addEventListener(MusicKit.Events.queueIsReady, async () => {
                if (blockQueueSorting) {
                    /* without this we get an endless loop since setQueue() triggers this listener */
                    return;
                }

                await sortQueue();
            });

            processCache();

            /* click does not register if we add the event listener to the child divs themselves */
            contentNode.addEventListener('click', event => {
                let currenSortType = lastSortType;

                if (checkClickArea('songs-list__header-col--song', event)) {
                    lastSortType = 'song';
                } else if (checkClickArea('songs-list__header-col--artist', event)) {
                    lastSortType = 'artist';
                } else if (checkClickArea('songs-list__header-col--album', event)) {
                    lastSortType = 'album';
                } else if (checkClickArea('songs-list__header-col--time', event)) {
                    lastSortType = 'time';
                }

                if (currenSortType !== lastSortType) {
                    blockQueueSorting = false;
                }

                handleSort();
            });
        }
    }

    function processCache() {
        /* get the cached data */
        let cachedObjects = MusicKit.getInstance().api.storage.data;

        for (let cachedObjectName in cachedObjects) {
            if (cachedObjects.hasOwnProperty(cachedObjectName)) {
                /* check for the stored playlist data */
                if (cachedObjectName.match('(.*?)(library.playlists.)(' + playlistID + ')(..*)')) {
                    let cachedObject = JSON.parse(cachedObjects[cachedObjectName]);

                    console.log(cachedObject);

                    /*
                    in this way on additional calls only the 'offset' cached objects get processed
                    it also allows this process to trust duplicates in the list (since it is always a new cached object being processed)
                    */
                    if (!processedCachedObjects.includes(cachedObjectName)) {
                        processCachedObject(cachedObject);
                    }

                    processedCachedObjects.push(cachedObjectName);
                }
            }
        }

        /* this happens if the data is in multiple cached objects and only some have the actual attributes data */
        if (fixToAllowSort.length > 0) {
            console.log('[JS] [addSort] some songs were missing their attributes (', fixToAllowSort.length, ')');

            fixToAllowSort = fixToAllowSort.filter(function (id) {
                console.log(id);

                let song = songs.get(id).data.attributes;

                console.log(song.name, song.artistName, song.albumName);

                return (!songs.get(id).data.attributes);
            });

            if (!isSortAllowed) {
                console.error('[JS] [addSort] some songs are still missing their attributes (', fixToAllowSort.length, ') - sorting disabled');
            }
        }

        isSortAllowed = fixToAllowSort.length === 0;

        console.log('[JS] [addSort] Stored Songs:', songs);
    }

    function processCachedObject(cachedObject) {
        let objects = cachedObject.d;

        for (let object of objects) {
            if (object.id.startsWith('p')) {
                /* playlist */
                let songData = object.relationships.tracks.data;

                for (let song of songData) {
                    handleCachedSong(song);
                }
            } else if (object.id.startsWith('i')) {
                /* song */
                handleCachedSong(object);
            } else {
                console.error('[JS] [addSort] unexpected cached object found', object.id);
            }
        }
    }

    function handleCachedSong(song) {
        let storedData = {data: song, duplicateIndex: null, node: null};

        if (!song.attributes) {
            /* in some cases (small playlists?) there are cached instances of the song with missing data */
            fixToAllowSort.push(song.id);

            return;
        }

        if (!songs.has(song.id)) {
            songs.set(song.id, storedData);
        } else {
            /* duplicate */
            let index = getDuplicateIndex(song.id);

            storedData.duplicateIndex = index;

            songs.set(song.id + '#' + index, storedData);
        }

        setNodeOfSong(storedData);
    }

    function sortByArtist() {
        songs = new Map([...songs.entries()].sort((a, b) => {
            let attributesA = a[1].data.attributes;
            let attributesB = b[1].data.attributes;

            let result = attributesA.artistName.localeCompare(attributesB.artistName);

            if (result === 0) {
                result = attributesA.albumName.localeCompare(attributesB.albumName);

                if (result === 0) {
                    /* same album and same track number is not something we should expect */
                    return attributesA.trackNumber - attributesB.trackNumber;
                }
            }

            return result;
        }));
    }

    function sortByAlbum() {
        songs = new Map([...songs.entries()].sort((a, b) => {
            let attributesA = a[1].data.attributes;
            let attributesB = b[1].data.attributes;

            let result = attributesA.albumName.localeCompare(attributesB.albumName);

            if (result === 0) {
                /* same album and same track number is not something we should expect */
                return attributesA.trackNumber - attributesB.trackNumber;
            }

            return result;
        }));
    }

    function handleSort() {
        if (!isSortAllowed) {
            return;
        }

        if (lastSortType) {
            switch (lastSortType) {
                case 'song':
                    break;
                case 'artist':
                    sortByArtist();
                    break;
                case 'album':
                    sortByAlbum();
                    break;
                case 'time':
                    break;
            }

            sortNodes();

            console.log('[JS] [addSort] Sorted Stored Songs:', songs);
        }
    }

    function setNodeOfSong(song) {
        let attributes = song.data.attributes;
        let id = attributes.name + attributes.artistName + attributes.albumName;

        if (song.duplicateIndex) {
            id += '#' + song.duplicateIndex;
        }

        let songNode = songNodes.get(id);

        if (songNode) {
            song.node = songNode;
        }
    }

    function handleSongsMissingNodes() {
        for (let song of songs.values()) {
            if (!song.node) {
                setNodeOfSong(song);
            }
        }
    }

    function fillSongNodes(node) {
        let songName = node.getElementsByClassName('songs-list-row__song-name')[0].innerText;
        let artistName = node.getElementsByClassName('songs-list-row__link')[0].innerText;
        let albumName = node.getElementsByClassName('songs-list__col--album')[0].getElementsByTagName('p')[0].innerText;
        /* time = node.getElementsByClassName('songs-list-row__length')[0].innerText; */

        let id = songName + artistName + albumName;

        if (songNodes.has(id)) {
            /* duplicate */
            let index = getDuplicateIndex(id);

            id += '#' + index;
        }

        songNodes.set(id, node);
    }

    async function sortQueue() {
        let items = MusicKit.getInstance().queue.items;

        /*
        let duplicatsToFix = items.filter(item => {
            return item.type === 'library-songs';
        });
        */

        items = items.filter(item => {
            return item.type === 'song';
        });

        switch (lastSortType) {
            case 'song':
                break;
            case 'artist':
                items.sort(function (a, b) {
                    return a.attributes.artistName.localeCompare(b.attributes.artistName);
                });
                break;
            case 'album':
                items.sort(function (a, b) {
                    return a.attributes.albumName.localeCompare(b.attributes.albumName);
                });
                break;
            case 'time':
                break;
        }

        /* the song where the play interaction was started on (= the start of the queue) */
        let current = MusicKit.getInstance().queue.items[MusicKit.getInstance().queue.position];
        items = items.splice(items.indexOf(current));

        /*
        for (let duplicate of duplicatsToFix) {
            let id = duplicate.attributes.playParams.id;

            let duplicateCount = duplicateIndex.get(id);

            let findElement = function (item) {
                return item.id === id;
            };

            let itemIndex = items.findIndex(findElement);

            while (duplicateCount > 0) {
                items.splice(itemIndex, 0, items[itemIndex]);

                duplicateCount--;
            }
        }
        */

        blockQueueSorting = true;

        await MusicKit.getInstance().setQueue({items: items});

        /* simply calling play() seems to be too early here (song won't start) (< 300 ms does not seem to work) */
        setTimeout(async function () {
            await MusicKit.getInstance().play();
        }, 300);

        blockQueueSorting = false;
    }

    function sortNodes() {
        observer.disconnect();

        let headerNode = contentNode.getElementsByClassName('songs-list__header')[0];
        let weirdNode = contentNode.getElementsByClassName('songs-list__right-click-target')[0];
        let infiniteScrollNode = contentNode.getElementsByClassName('infinite-scroll')[0];

        while (contentNode.firstChild) {
            contentNode.firstChild.remove();
        }

        contentNode.appendChild(headerNode);
        contentNode.appendChild(weirdNode);

        for (let song of songs.values()) {
            /* can be 'null' if the cached elements have not been loaded in the document yet */
            if (song.node) {
                contentNode.appendChild(song.node);
            }
        }

        /* this does not exist in playlists with less than 101 entries*/
        if (infiniteScrollNode) {
            contentNode.appendChild(infiniteScrollNode);
        }

        observer.observe(contentNode, {subtree: false, childList: true});
    }

    function getDuplicateIndex(id) {
        let index = duplicateIndex.get(id);

        if (!index) {
            index = 1;
        } else {
            index += 1;
        }

        duplicateIndex.set(id, index);

        return index;
    }

    function checkClickArea(className, event) {
        let column = contentNode.getElementsByClassName(className)[0];

        let artistRectangle = column.getBoundingClientRect();

        /* don't need to check height since it's the same for the entire row */
        return event.clientX >= artistRectangle.left && event.clientX <= artistRectangle.right;
    }

    function createObserver() {
        return new MutationObserver(function (mutation_ist) {
            /* when the observer catches something it means new elements have been loaded (this does not get called multiple times) */
            processCache();

            mutation_ist.forEach(function (mutation) {
                mutation.addedNodes.forEach(function (added_node) {
                    if (added_node.tagName === 'DIV') {
                        fillSongNodes(added_node);
                    }
                });
            });

            handleSongsMissingNodes();

            handleSort();
        });
    }
} catch (e) {
    console.error("[JS] Error while trying to apply addSort.js", e);
}