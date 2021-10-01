try {
    /* comments
    # unsure
        only tested with playlists up to ~ 200 songs - what happens at like 500 or 1.000?
            100 elements take ~ 30ms / 200 ~ 60 ms

    # duplicates
        it is not possible to handle duplicates in playlists with the web version
        if you start the playback by clicking 'play' they get added as 'library-song' but are skipped ('position' / 'nextPlayableItemIndex')
        if you double click a row they simply do not appear
        adding the duplicates before sending the list to 'setQueue(...)' does not work
            they get added but all instances of a song get consumed at the same time once it plays
            clicking 'next' will behave like a clicking 'pause' until you have exhausted duplicate instances that got consumed
        conclusion: it's better to remove them before sending them to the queue

    # todo
    visual indicator for current sorted type (arrow in the header cells?)
    */

    /* check for https://music.apple.com/library/playlist/ (and the beta variant + language code) */
    let playlistMatcher = window.location.href.match(/(https:\/\/)(beta\.)?(music\.apple\.com\/library\/playlist\/)(p\..{15})(\?l=.{2,5})?/);

    let observer;
    let contentNode;

    let songs = new Map();
    let songNodes = new Map();
    let duplicateIndex = new Map();

    let processedCachedObjects = [];

    /* todo :: check
    could change it to 'types: []' - and sort by all types, priority being the newest addition
    but that would mean you would have to deselect all other options if you just want to sort by artist again
    => might be annoying

    order: 0 = no sorting | 1 = ascending | 2 = descending
    */
    let sortConfig = {attributeName: null, order: 0};

    /* for each song we store the original index - so we can later return to the original sorting (order === 0) */
    let songIndex = 0;

    let blockQueueSorting = true;

    let playlistID;

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
                let previousAttributeName = sortConfig.attributeName;

                if (checkClickArea('songs-list__header-col--song', event)) {
                    sortConfig.attributeName = 'name';
                } else if (checkClickArea('songs-list__header-col--artist', event)) {
                    sortConfig.attributeName = 'artistName';
                } else if (checkClickArea('songs-list__header-col--album', event)) {
                    sortConfig.attributeName = 'albumName';
                } else if (checkClickArea('songs-list__header-col--time', event)) {
                    sortConfig.attributeName = 'durationInMillis';
                }

                if (previousAttributeName === sortConfig.attributeName) {
                    sortConfig.order += 1;

                    if (sortConfig.order === 3) {
                        sortConfig.order = 0;
                    }
                } else {
                    sortConfig.order = 1;
                }

                handleSort();
            });
        }
    }

    function processCache() {
        /* get the cached data */
        let cachedObjectsNames = MusicKit.getInstance().api.storage.keys;

        for (let cachedObjectName of cachedObjectsNames) {
            /* only the current playlist is relevant*/
            if (cachedObjectName.match('(.*?library.playlists.' + playlistID + '.*)')) {
                let cachedObject = JSON.parse(MusicKit.getInstance().api.storage.getItem(cachedObjectName));

                /*
                in this way on additional calls only the 'offset' cached objects get processed (= data that gets loaded on infinite scroll)
                it also allows this process to trust duplicates in the list (since it is always a new cached object being processed)
                */
                if (!processedCachedObjects.includes(cachedObjectName)) {
                    processCachedObject(cachedObject);
                }

                processedCachedObjects.push(cachedObjectName);
            }
        }

        console.log('[JS] [addSort] Stored Songs:', songs);
    }

    function processCachedObject(cachedObject) {
        console.log('[JS] [addSort] processing cache object', cachedObject);

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
        let storedData = {data: song, duplicateIndex: null, originalIndex: songIndex, node: null};

        songIndex++;

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

    function sortSongs() {
        songs = new Map([...songs.entries()].sort((a, b) => {
            if (sortConfig.order === 0) {
                return a[1].originalIndex - b[1].originalIndex;
            }

            let attributesA = a[1].data.attributes;
            let attributesB = b[1].data.attributes;

            /* todo :: better way to handle sort by numbers in a generic way */
            if (sortConfig.order === 1) {
                if (sortConfig.attributeName === 'durationInMillis') {
                    return attributesA[sortConfig.attributeName] - attributesB[sortConfig.attributeName];
                }

                return attributesA[sortConfig.attributeName].localeCompare(attributesB[sortConfig.attributeName]);
            } else {
                if (sortConfig.attributeName === 'durationInMillis') {
                    return attributesB[sortConfig.attributeName] - attributesA[sortConfig.attributeName];
                }

                return attributesB[sortConfig.attributeName].localeCompare(attributesA[sortConfig.attributeName]);
            }
        }));
    }

    function handleSort() {
        if (!sortConfig.attributeName) {
            /* do nothing if no sort has been applied yet */
            return;
        }

        let startTime = performance.now();

        sortSongs();
        sortNodes();

        let endTime = performance.now();

        console.log(`[JS] [addSort] finished sort in ${endTime - startTime} ms`);
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
        if (sortConfig.order === 0) {
            /* no changes to the queue required */

            return;
        }

        let items = MusicKit.getInstance().queue.items;

        items = items.filter(item => {
            return item.type === 'song';
        });

        items.sort(function (a, b) {
            /* todo :: better way to handle sort by numbers in a generic way */
            if (sortConfig.order === 1) {
                if (sortConfig.attributeName === 'durationInMillis') {
                    return a.attributes[sortConfig.attributeName] - b.attributes[sortConfig.attributeName];
                }

                return a.attributes[sortConfig.attributeName].localeCompare(b.attributes[sortConfig.attributeName]);
            } else {
                if (sortConfig.attributeName === 'durationInMillis') {
                    return b.attributes[sortConfig.attributeName] - a.attributes[sortConfig.attributeName];
                }

                return b.attributes[sortConfig.attributeName].localeCompare(a.attributes[sortConfig.attributeName]);
            }
        });

        /* the song where the play interaction was started on (= the start of the queue) */
        let current = MusicKit.getInstance().queue.items[MusicKit.getInstance().queue.position];
        items = items.splice(items.indexOf(current));

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

        /* this does not exist in playlists with less than 101 entries */
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
        return new MutationObserver(function (mutationRecords) {
            /* process the elements that get loaded by the infinite scroll */
            processCache();

            mutationRecords.forEach(function (mutationRecord) {
                mutationRecord.addedNodes.forEach(function (addedNode) {
                    if (addedNode.tagName === 'DIV') {
                        fillSongNodes(addedNode);
                    }
                });
            });

            handleSongsMissingNodes();

            /* there is no sorting required if the order is the original layout */
            if (sortConfig.order !== 0) {
                handleSort();
            }
        });
    }
} catch (e) {
    console.error("[JS] Error while trying to apply addSort.js", e);
}