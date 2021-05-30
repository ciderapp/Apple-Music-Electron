require('v8-compile-cache');
const { app, BrowserWindow, Tray, Menu, Notification } = require('electron')
const { preferences, css, advanced } = require('./config.json');
const languages = require('./assets/languages.json')
const glasstron = require('glasstron');
const electron = require('electron');
const path = require('path')
const isReachable = require("is-reachable");
const isSingleInstance = app.requestSingleInstanceLock();
const { readFile } = require('fs');
const client = require('discord-rich-presence')('749317071145533440')
var win = '',
  AppleMusicWebsite,
  trayIcon = null,
  iconPath = path.join(__dirname, `./assets/icon.ico`),
  isQuiting = !preferences.closebuttonminimize,
  isWin = process.platform === "win32",
  isMaximized;

// Set proper cache folder
app.setPath("userData", path.join(app.getPath("cache"), app.name))

if (advanced.EnableLogging) {
  const log = require("electron-log");
  log.info('Apple-Music-Electron application has started.');
  console.log = log.log; // Overwrite the function because i cba to change all the console.logs
}

//---------------------------------------------------------------------
//  Start the Creation of the Window
//---------------------------------------------------------------------

function createWindow() {
  //---------------------------------------------------------------------
  // Prevent Multiple Instances
  //---------------------------------------------------------------------
  if (!isSingleInstance && !advanced.allowMultipleInstances) {
    app.quit();
    return
  } else {
    app.on('second-instance', () => {
      if (win) {
        win.show()
      };
    })
  }
  //---------------------------------------------------------------------
  // Create the Window
  //---------------------------------------------------------------------
  if (preferences.cssTheme.toLowerCase() === "glasstron") { // Glasstron Theme Window Creation
    app.commandLine.appendSwitch("enable-transparent-visuals");
    win = new glasstron.BrowserWindow({
      icon: iconPath,
      width: 1024,
      height: 600,
      minWidth: 300,
      minHeight: 300,
      frame: !css.macosWindow,
      title: "Apple Music",
      // Enables DRM
      webPreferences: {
        plugins: true,
        preload: path.join(__dirname, './assets/MusicKitInterop.js'),
        allowRunningInsecureContent: advanced.allowRunningInsecureContent,
        contextIsolation: false,
        sandbox: true
      }
    })
    win.blurType = "blurbehind";
    win.setBlur(true);
  } else {
    win = new BrowserWindow({ // Standard Window Creation
      icon: iconPath,
      width: 1024,
      height: 600,
      minWidth: 300,
      minHeight: 300,
      frame: !css.macosWindow,
      title: "Apple Music",
      // Enables DRM
      webPreferences: {
        plugins: true,
        preload: path.join(__dirname, './assets/MusicKitInterop.js'),
        allowRunningInsecureContent: advanced.allowRunningInsecureContent,
        contextIsolation: false,
        sandbox: true
      }
    })
  }

  // Hide toolbar tooltips / bar
  win.setMenuBarVisibility(advanced.MenuBarVisible);
  // Prevent users from being able to do shortcuts
  if (!advanced.allowSetMenu) win.setMenu(null);

  //----------------------------------------------------------------------------------------------------
  //  Check if the Beta is Available and Load it
  //----------------------------------------------------------------------------------------------------
  if (advanced.UseBeta) {
    if (advanced.SiteDetection) {
      // Function to Load the Website if its reachable.
      async function LoadBeta() {
        const web = await isReachable('https://beta.music.apple.com')
        if (web) {
          AppleMusicWebsite = 'https://beta.music.apple.com';
        } else {
          AppleMusicWebsite = 'https://music.apple.com';
        }
      }
      LoadBeta()
    } else {    // Skips the check if sitedetection is turned off.
      AppleMusicWebsite = 'https://beta.music.apple.com';
    }
  } else {
    AppleMusicWebsite = 'https://music.apple.com';
  }

  //----------------------------------------------------------------------------------------------------
  //  Get the System Language and Change URL Appropriately
  //----------------------------------------------------------------------------------------------------
  const SystemLang = app.getLocaleCountryCode().toLowerCase()
  for (var key in languages) {
    key = key.toLowerCase()
    if (SystemLang === key) {
      console.log(`Found: ${key} | System Language: ${SystemLang}`)
      if (advanced.forceApplicationLanguage) {
        key = advanced.forceApplicationLanguage
      } else {
        AppleMusicWebsite = `${AppleMusicWebsite}/${key}?l=${key}`
      }
    }
  }

  //----------------------------------------------------------------------------------------------------
  //  Load the Webpage
  //----------------------------------------------------------------------------------------------------
  console.log(`The chosen website is ${AppleMusicWebsite}`)
  win.loadURL(AppleMusicWebsite)

  //----------------------------------------------------------------------------------------------------
  //  Prevents the Window Being Updated and Changes how close works to hide the window
  //----------------------------------------------------------------------------------------------------

  // Prevents the Window Title from being Updated
  win.on('page-title-updated', function (event) {
    event.preventDefault()
  });

  // Hide the App if isQuitting is not true
  win.on('close', function (event) {
    if (!isQuiting) {
      event.preventDefault();
      win.hide();
    } else {
      event.preventDefault();
      win.destroy();
    }
  });

  //----------------------------------------------------------------------------------------------------
  // Load all the JS and CSS for the webpage
  //----------------------------------------------------------------------------------------------------
  if (preferences.defaultTheme) electron.nativeTheme.themeSource = preferences.defaultTheme;

  win.webContents.on('did-stop-loading', async () => {
    // moving the old stuff back because its broken atm.
    await win.webContents.executeJavaScript('MusicKitInterop.init()');
    if (advanced.RemoveScrollbars) {
      await win.webContents.insertCSS('::-webkit-scrollbar { display: none; }')
    }
    if (css.removeupsell) {
      win.webContents.executeJavaScript("const openitunes = document.getElementsByClassName('web-navigation__native-upsell'); while (openitunes.length > 0) openitunes[0].remove();");
      win.webContents.executeJavaScript("while (openitunes.length > 0) openitunes[0].remove();");
      win.webContents.executeJavaScript("console.log(\"Removed upsell.\")")
    }
    if (css.removeappleLogo) {
      win.webContents.executeJavaScript("const applelogo = document.getElementsByClassName('web-navigation__header web-navigation__header--logo'); while (applelogo.length > 0) applelogo[0].remove();");
      win.webContents.executeJavaScript("while (applelogo.length > 0) applelogo[0].remove();");
      win.webContents.executeJavaScript("document.getElementsByClassName('search-box dt-search-box web-navigation__search-box')[0].style.gridArea = \"auto\";")
      win.webContents.executeJavaScript("console.log(\"Removed Apple Logo successfully.\")")
    }
    if (css.macosWindow) {
      win.webContents.executeJavaScript("if(document.getElementsByClassName('web-navigation')[0] && !(document.getElementsByClassName('web-navigation')[0].style.height == 'calc(100vh - 32px)')){ let dragDiv = document.createElement('div'); dragDiv.style.width = '100%'; dragDiv.style.height = '32px'; dragDiv.style.position = 'absolute'; dragDiv.style.top = dragDiv.style.left = 0; dragDiv.style.webkitAppRegion = 'drag'; document.body.appendChild(dragDiv); var closeButton = document.createElement('span'); document.getElementsByClassName('web-navigation')[0].style.height = 'calc(100vh - 32px)'; document.getElementsByClassName('web-navigation')[0].style.bottom = 0; document.getElementsByClassName('web-navigation')[0].style.position = 'absolute'; document.getElementsByClassName('web-chrome')[0].style.top = '32px'; var minimizeButton = document.createElement('span'); var maximizeButton = document.createElement('span'); document.getElementsByClassName('web-navigation')[0].style.height = 'calc(100vh - 32px)'; closeButton.style = 'height: 11px; width: 11px; background-color: rgb(255, 92, 92); border-radius: 50%; display: inline-block; left: 0px; top: 0px; margin: 10px 4px 10px 10px; color: rgb(130, 0, 5); fill: rgb(130, 0, 5); -webkit-app-region: no-drag; '; minimizeButton.style = 'height: 11px; width: 11px; background-color: rgb(255, 189, 76); border-radius: 50%; display: inline-block; left: 0px; top: 0px; margin: 10px 4px; color: rgb(130, 0, 5); fill: rgb(130, 0, 5); -webkit-app-region: no-drag;'; maximizeButton.style = 'height: 11px; width: 11px; background-color: rgb(0, 202, 86); border-radius: 50%; display: inline-block; left: 0px; top: 0px; margin: 10px 10px 10px 4px; color: rgb(130, 0, 5); fill: rgb(130, 0, 5); -webkit-app-region: no-drag;'; closeButton.onclick = ()=>{ipcRenderer.send('close')}; minimizeButton.onclick = ()=>{ipcRenderer.send('minimize')}; maximizeButton.onclick = ()=>{ipcRenderer.send('maximize')}; dragDiv.appendChild(closeButton); dragDiv.appendChild(minimizeButton); dragDiv.appendChild(maximizeButton); closeButton.onmouseenter = ()=>{closeButton.style.filter = 'brightness(50%)'}; minimizeButton.onmouseenter = ()=>{minimizeButton.style.filter = 'brightness(50%)'}; maximizeButton.onmouseenter = ()=>{maximizeButton.style.filter = 'brightness(50%)'}; closeButton.onmouseleave = ()=>{closeButton.style.filter = 'brightness(100%)'}; minimizeButton.onmouseleave = ()=>{minimizeButton.style.filter = 'brightness(100%)'}; maximizeButton.onmouseleave = ()=>{maximizeButton.style.filter = 'brightness(100%)'};}")
      win.webContents.executeJavaScript("console.log(\"Enabled custom titlebar.\")")
    }
  });

  win.webContents.on('did-finish-load', function () {
    if (preferences.cssTheme) {
      readFile(path.join(__dirname, `./assets/themes/${preferences.cssTheme.toLowerCase()}.css`), "utf-8", function (error, data) {
        if (!error) {
          var formatedData = data.replace(/\s{2,10}/g, ' ').trim();
          win.webContents.insertCSS(formatedData);
        }
      });
    };
  });

  win.webContents.on('crash', function () {
    app.exit();
  });

  //----------------------------------------------------------------------------------------------------
  // Checks for Window Actions (when using MacOS theme)
  //----------------------------------------------------------------------------------------------------

  electron.ipcMain.on('minimize', () => { // listen for minimize event
    win.minimize()
  })

  electron.ipcMain.on('maximize', () => { // listen for maximize event and perform restore/maximize depending on window state
    if (isMaximized) {
      win.restore()
      isMaximized = false
    } else {
      win.maximize()
      isMaximized = true
    }
  })

  electron.ipcMain.on('close', () => { // listen for close event
    win.close();
  })

  //----------------------------------------------------------------------------------------------------
  //  Create the Tray Icon
  //----------------------------------------------------------------------------------------------------

  if (!isWin) {
    iconPath = path.join(__dirname, `./assets/icon.png`)
  }
  trayIcon = new Tray(iconPath)

  // Context Menu for when the App is Hidden
  const ClosedContextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Apple Music', click: function () {
        win.show();
      }
    },
    {
      label: 'Quit', click: function () {
        app.isQuiting = true
        app.quit();
      }
    }
  ]);

  // Context Menu for when the App is not Hidden
  const OpenContextMenu = Menu.buildFromTemplate([
    {
      label: 'Minimize to Tray', click: function () {
        win.hide();
      }
    },
    {
      label: 'Quit', click: function () {
        app.isQuiting = true
        app.quit();
      }
    }
  ]);

  trayIcon.setToolTip('Apple Music');
  trayIcon.setContextMenu(OpenContextMenu);

  trayIcon.on('double-click', () => {
    win.show()
  })

  win.on('hide', function () {
    trayIcon.setContextMenu(ClosedContextMenu);
  })

  win.on('show', function () {
    trayIcon.setContextMenu(OpenContextMenu);
  })

  //----------------------------------------------------------------------------------------------------
  //  Discord Rich Presence Setup
  //----------------------------------------------------------------------------------------------------
  var DiscordRPCError = false;

  // Connected to Discord
  client.on("connected", () => {
    console.log("Successfully Connected to Discord!");
    if (DiscordRPCError) DiscordRPCError = false;
  });

  // Error Handler
  client.on('error', err => {
    console.log(`Error: ${err}`);
    if (!DiscordRPCError) DiscordRPCError = true;
  });

  async function UpdatePausedPresence(a) {
    client.updatePresence({
      details: `Playing ${a.name}`,
      state: `By ${a.artistName}`,
      startTimestamp: Date.now(),
      endTimestamp: Date.now(),
      largeImageKey: 'apple',
      largeImageText: a.albumName,
      instance: true,
    });
    return true
  }

  async function UpdatePlayPresence(a) {
    var endTime = Number(Math.round(Date.now() + a.durationInMillis));
    client.updatePresence({
      details: `Playing ${a.name}`,
      state: `By ${a.artistName}`,
      startTimestamp: Date.now(),
      endTimestamp: endTime,
      largeImageKey: 'apple',
      largeImageText: a.albumName,
      instance: true,
    });
    return true
  }

  //----------------------------------------------------------------------------------------------------
  //  Song Notifications
  //----------------------------------------------------------------------------------------------------

  if (isWin) app.setAppUserModelId("Apple Music");

  function PlaybackNotification(a) {
    console.log(`Function Params: SongName: ${a.name} | Artist: ${a.artistName} | Album: ${a.albumName}`)
    let NOTIFICATION_TITLE = a.name;
    let NOTIFICATION_BODY = `${a.artistName} - ${a.albumName}`;
    new Notification({ title: NOTIFICATION_TITLE, body: NOTIFICATION_BODY, silent: true, icon: path.join(__dirname, './assets/icon.png') }).show()
    return true
  };

  //----------------------------------------------------------------------------------------------------
  //  Run Functions on Media State Change
  //----------------------------------------------------------------------------------------------------
  let NOTIFICATION,
    Update,
    cache;

  electron.ipcMain.on('mediaItemStateDidChange', (item, a) => {
    if (a === null || a.playParams.id === 'no-id-found' || cache === a) return;
    cache = a

    // When Media is Playing Update RPC and Notify User
    win.webContents.on('media-started-playing', function () {
      if (preferences.notifications && Notification.isSupported()) {
        while (!NOTIFICATION) {
          console.log(`Running Function for Notification | Song Name: ${cache.name}`)
          console.log(`Running Function with Params: SongName: ${cache.name} | Artist: ${cache.artistName} | Album: ${cache.albumName}`)
          NOTIFICATION = PlaybackNotification(cache);
        }
        setTimeout(function () { NOTIFICATION = false; }, 500);
      }
      if (!preferences.discordRPC || DiscordRPCError) return;
      while (!Update) {
        console.log("Updating Rich Presence to Play State")
        Update = UpdatePlayPresence(cache)
      }
      setTimeout(function () { Update = false; }, 500);
    })

    // When Music is Paused Update RPC
    win.webContents.on('media-paused', function () {
      console.log("media-paused initiated")
      console.log(`DiscordRPC: ${preferences.discordRPC} | DiscordRPC Error: ${DiscordRPCError} | cache.status: ${cache.status}`)
      if (!preferences.discordRPC || DiscordRPCError || cache.status) return;
      while (!Update) {
        console.log("Updating Rich Presence to Paused State")
        Update = UpdatePausedPresence(cache)
      }
      setTimeout(function () { Update = false; }, 500);
    })
  })
}

//----------------------------------------------------------------------------------------------------
// Done
//----------------------------------------------------------------------------------------------------

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

app.on('window-all-closed', () => {
  app.quit()
})

app.on('before-quit', function () {
  console.log("Application Closing...")
  isQuiting = true;
});
