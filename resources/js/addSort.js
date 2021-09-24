try {
    /*
    the queue does not respect the sorting
        can be done by managing 'MusicKit.getInstance().queue.items'
    */

    let url = window.location.href;

    /* check for https://music.apple.com/library/playlist/ (and the beta variant + language code) */
    let matcher = url.match(/(https:\/\/)(beta.)?(music.apple\.com\/library\/playlist\/)(p..{15})(\?l=.{2,5})?/);

    let contentNode;
    let playlist;
    let observer;

    /* needed to apply the sort to the newly loaded elements */
    let lastSortType;

    let songNodes = new Map();
    let songs = new Map();

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
                                let storedData = {data: object, node: null};

                                songs.set(object.id, storedData);

                                setNodeOfSong(storedData);
                            }
                        }
                    }
                }
            }
        }

        console.log('[JS] [addSort] Stored Songs:', songs);
    }

    function sortByArtist() {
        songs = new Map([...songs.entries()].sort((a, b) => {
            let valueA = a[1];
            let valueB = b[1];

            /* can add aditional sorting, like track number etc. */
            return valueA.data.attributes.artistName.localeCompare(valueB.data.attributes.artistName);
        }));
    }

    function sortByAlbum() {
        songs = new Map([...songs.entries()].sort((a, b) => {
            let valueA = a[1];
            let valueB = b[1];

            /* can add aditional sorting, like track number etc. */
            return valueA.data.attributes.albumName.localeCompare(valueB.data.attributes.albumName);
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
        }
    }

    function setNodeOfSong(song) {
        /* store the node data and some other stuff to compare with the already stored songs */
        let attributes = song.data.attributes;
        let id = attributes.name + attributes.artistName + attributes.albumName;

        let songNode = songNodes.get(id);

        if (songNode) {
            song.node = songNode.node;
        }
    }

    function fillSongNodes(node) {
        let data = {
            songName: '',
            artistName: '',
            albumName: '',
            time: '',
            node: node
        };

        data.songName = node.getElementsByClassName('songs-list-row__song-name')[0].innerText;
        data.artistName = node.getElementsByClassName('songs-list-row__link')[0].innerText;
        data.albumName = node.getElementsByClassName('songs-list__col--album')[0].getElementsByTagName('p')[0].innerText;
        data.time = node.getElementsByClassName('songs-list-row__length')[0].innerText;

        let id = data.songName + data.artistName + data.albumName;

        songNodes.set(id, data);
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