try {
    /*
    the queue does not respect the sorting
        can be done by managing 'MusicKit.getInstance().queue.items'
    */

    let url = window.location.href;

    /* check for https://music.apple.com/library/playlist/ (and the beta variant + language code) */
    let matcher = url.match(/(https:\/\/)(beta\.)?(music\.apple\.com\/library\/playlist\/)(p\..{15})(\?l=.{2,5})?/);

    let contentNode;
    let playlist;
    let observer;

    /* needed to apply the sort to the newly loaded elements */
    let lastSortType;

    let songs = new Map();
    let songNodes = new Map();

    let fixToAllowSort = [];
    let isSortAllowed = false;

    /* check if playlist id is set */
    if (matcher && matcher.length === 6 && matcher[4]) {
        contentNode = document.getElementsByClassName('songs-list')[0];

        if (contentNode) {
            observer = createObserver();
            observer.observe(contentNode, {subtree: false, childList: true});

            let nodes = contentNode.getElementsByClassName('songs-list-row');

            for (let node of nodes) {
                fillSongNodes(node);
            }

            playlist = matcher[4].toLowerCase();

            storeSongs();

            /* click does not register if we add the event listener to the child divs themselves */
            contentNode.addEventListener('click', event => {
                if (!isSortAllowed) {
                    return;
                }

                if (checkClickArea('songs-list__header-col--song', event)) {
                    lastSortType = 'song';
                } else if (checkClickArea('songs-list__header-col--artist', event)) {
                    lastSortType = 'artist';
                } else if (checkClickArea('songs-list__header-col--album', event)) {
                    lastSortType = 'album';
                } else if (checkClickArea('songs-list__header-col--time', event)) {
                    lastSortType = 'time';
                }

                handleSort();
            });
        }
    }

    function storeSongs() {
        /* get the cached data */
        let storageData = MusicKit.getInstance().api.storage.data;

        for (let element in storageData) {
            if (storageData.hasOwnProperty(element)) {
                /* check for the stored playlist data */
                if (element.match('(.*?)(library.playlists.)(' + playlist + ')(..*)')) {
                    let value = JSON.parse(storageData[element]);

                    let objects = value.d;

                    for (let object of objects) {
                        if (object.id.startsWith('p')) {
                            /* playlist */
                            let songData = object.relationships.tracks.data;

                            for (let song of songData) {
                                if (!songs.has(song.id)) {
                                    let storedData = {data: song, node: null};

                                    songs.set(song.id, storedData);

                                    setNodeOfSong(storedData);
                                }
                            }
                        } else {
                            /* song */
                            if (!songs.has(object.id)) {
                                /* in some cases (small playlists?) there are cached instances of the song with missing data */
                                if (object.attributes) {
                                    let storedData = {data: object, node: null};

                                    songs.set(object.id, storedData);

                                    setNodeOfSong(storedData);
                                } else {
                                    fixToAllowSort.push(object.id);
                                }
                            }
                        }
                    }
                } else {
                    /* todo :: for testing purpose
                    console.log(element);

                    if (!element.match(/.*?cache-mut/)) {
                        let check = JSON.parse(storageData[element]);

                        console.log(check);
                    }
                   */
                }
            }
        }

        /* this happens if the data is in multiple cached objects and only some have the actual attributes data */
        if (fixToAllowSort.length > 0) {
            console.log('[JS] [addSort] some songs were missing their attributes (', fixToAllowSort.length, ')');

            fixToAllowSort = fixToAllowSort.filter(function (id) {
                return (!songs.get(id).data.attributes);
            });

            if (!isSortAllowed) {
                console.log('[JS] [addSort] some songs are still missing their attributes (', fixToAllowSort.length, ')');
            }
        }

        isSortAllowed = fixToAllowSort.length === 0;

        console.log('[JS] [addSort] Stored Songs:', songs);
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

            manageNodes();

            console.log('[JS] [addSort] Sorted Stored Songs:', songs);
        }
    }

    function setNodeOfSong(song) {
        let attributes = song.data.attributes;
        let id = attributes.name + attributes.artistName + attributes.albumName;

        let songNode = songNodes.get(id);

        if (songNode) {
            song.node = songNode;
        }
    }

    function fillSongNodes(node) {
        let songName = node.getElementsByClassName('songs-list-row__song-name')[0].innerText;
        let artistName = node.getElementsByClassName('songs-list-row__link')[0].innerText;
        let albumName = node.getElementsByClassName('songs-list__col--album')[0].getElementsByTagName('p')[0].innerText;
        /* time = node.getElementsByClassName('songs-list-row__length')[0].innerText; */

        let id = songName + artistName + albumName;

        songNodes.set(id, node);
    }

    function handleSongsMissingNodes() {
        for (let song of songs.values()) {
            if (!song.node) {
                setNodeOfSong(song);
            }
        }
    }

    function manageNodes() {
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

    function checkClickArea(className, event) {
        let column = contentNode.getElementsByClassName(className)[0];

        let artistRectangle = column.getBoundingClientRect();

        /* don't need to check height since it's the same for the entire row */
        return event.clientX >= artistRectangle.left && event.clientX <= artistRectangle.right;
    }

    function createObserver() {
        return new MutationObserver(function (mutation_ist) {
            /* when the observer catches something it means new elements have been loaded (this does not get called multiple times) */
            storeSongs();

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