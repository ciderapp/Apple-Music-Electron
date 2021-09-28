try {
    function matchRuleShort(str, rule) {
        var escapeRegex = (str) => str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
        return new RegExp("^" + rule.split("*").map(escapeRegex).join(".*") + "$").test(str);
    }

    if (matchRuleShort(window.location.href, '*settings*')) {
        document.getElementsByClassName('commerce-full-content')[0].innerHTML = `
        <div class="application-preferences">
            <div class="app-prefs-section general">
                <div class="app-prefs-title header-nav" style="height: 10px;">
                    <div class="header-nav-content">
                        <h1 class="typography-header-emphasized">General Settings</h1>
                    </div>
                </div>
                <ul class="settings-list">
                    <li class="app-prefs-dropdown">
                        <span class="typography-title-3-tall">Choose a language for the system to use</span>
                        <select class="form-dropdown-select list-element" name="language" id="language">
                            <option disabled>Select one</option>
                            <option value='us'>English (US)</option>
                            <option value='gb'>English (UK)</option>
                            <option value='ae'>United Arab Emirates</option>
                            <option value='ag'>Antigua and Barbuda</option>
                            <option value='ai'>Anguilla</option>
                            <option value='al'>Albania</option>
                            <option value='am'>Armenia</option>
                            <option value='ao'>Angola</option>
                            <option value='ar'>Argentina</option>
                            <option value='at'>Austria</option>
                            <option value='au'>Australia</option>
                            <option value='az'>Azerbaijan</option>
                            <option value='bb'>Barbados</option>
                            <option value='be'>Belgium</option>
                            <option value='bf'>Burkina-Faso</option>
                            <option value='bg'>Bulgaria</option>
                            <option value='bh'>Bahrain</option>
                            <option value='bj'>Benin</option>
                            <option value='bm'>Bermuda</option>
                            <option value='bn'>Brunei Darussalam</option>
                            <option value='bo'>Bolivia</option>
                            <option value='br'>Brazil</option>
                            <option value='bs'>Bahamas</option>
                            <option value='bt'>Bhutan</option>
                            <option value='bw'>Botswana</option>
                            <option value='by'>Belarus</option>
                            <option value='bz'>Belize</option>
                            <option value='ca'>Canada</option>
                            <option value='cg'>Democratic Republic of the Congo</option>
                            <option value='ch'>Switzerland</option>
                            <option value='cl'>Chile</option>
                            <option value='cn'>China</option>
                            <option value='co'>Colombia</option>
                            <option value='cr'>Costa Rica</option>
                            <option value='cv'>Cape Verde</option>
                            <option value='cy'>Cyprus</option>
                            <option value='cz'>Czech Republic</option>
                            <option value='de'>Germany</option>
                            <option value='dk'>Denmark</option>
                            <option value='dm'>Dominica</option>
                            <option value='do'>Dominican Republic</option>
                            <option value='dz'>Algeria</option>
                            <option value='ec'>Ecuador</option>
                            <option value='ee'>Estonia</option>
                            <option value='eg'>Egypt</option>
                            <option value='es'>Spain</option>
                            <option value='fi'>Finland</option>
                            <option value='fj'>Fiji</option>
                            <option value='fm'>Federated States of Micronesia</option>
                            <option value='fr'>France</option>
                            <option value='gd'>Grenada</option>
                            <option value='gh'>Ghana</option>
                            <option value='gm'>Gambia</option>
                            <option value='gr'>Greece</option>
                            <option value='gt'>Guatemala</option>
                            <option value='gw'>Guinea Bissau</option>
                            <option value='gy'>Guyana</option>
                            <option value='hk'>Hong Kong</option>
                            <option value='hn'>Honduras</option>
                            <option value='hr'>Croatia</option>
                            <option value='hu'>Hungaria</option>
                            <option value='id'>Indonesia</option>
                            <option value='ie'>Ireland</option>
                            <option value='il'>Israel</option>
                            <option value='in'>India</option>
                            <option value='is'>Iceland</option>
                            <option value='it'>Italy</option>
                            <option value='jm'>Jamaica</option>
                            <option value='jo'>Jordan</option>
                            <option value='jp'>Japan</option>
                            <option value='ke'>Kenya</option>
                            <option value='kg'>Krygyzstan</option>
                            <option value='kh'>Cambodia</option>
                            <option value='kn'>Saint Kitts and Nevis</option>
                            <option value='kr'>South Korea</option>
                            <option value='kw'>Kuwait</option>
                            <option value='ky'>Cayman Islands</option>
                            <option value='kz'>Kazakhstan</option>
                            <option value='la'>Laos</option>
                            <option value='lb'>Lebanon</option>
                            <option value='lc'>Saint Lucia</option>
                            <option value='lk'>Sri Lanka</option>
                            <option value='lr'>Liberia</option>
                            <option value='lt'>Lithuania</option>
                            <option value='lu'>Luxembourg</option>
                            <option value='lv'>Latvia</option>
                            <option value='md'>Moldova</option>
                            <option value='mg'>Madagascar</option>
                            <option value='mk'>Macedonia</option>
                            <option value='ml'>Mali</option>
                            <option value='mn'>Mongolia</option>
                            <option value='mo'>Macau</option>
                            <option value='mr'>Mauritania</option>
                            <option value='ms'>Montserrat</option>
                            <option value='mt'>Malta</option>
                            <option value='mu'>Mauritius</option>
                            <option value='mw'>Malawi</option>
                            <option value='mx'>Mexico</option>
                            <option value='my'>Malaysia</option>
                            <option value='mz'>Mozambique</option>
                            <option value='na'>Namibia</option>
                            <option value='ne'>Niger</option>
                            <option value='ng'>Nigeria</option>
                            <option value='ni'>Nicaragua</option>
                            <option value='nl'>Netherlands</option>
                            <option value='np'>Nepal</option>
                            <option value='no'>Norway</option>
                            <option value='nz'>New Zealand</option>
                            <option value='om'>Oman</option>
                            <option value='pa'>Panama</option>
                            <option value='pe'>Peru</option>
                            <option value='pg'>Papua New Guinea</option>
                            <option value='ph'>Philippines</option>
                            <option value='pk'>Pakistan</option>
                            <option value='pl'>Poland</option>
                            <option value='pt'>Portugal</option>
                            <option value='pw'>Palau</option>
                            <option value='py'>Paraguay</option>
                            <option value='qa'>Qatar</option>
                            <option value='ro'>Romania</option>
                            <option value='ru'>Russia</option>
                            <option value='sa'>Saudi Arabia</option>
                            <option value='sb'>Soloman Islands</option>
                            <option value='sc'>Seychelles</option>
                            <option value='se'>Sweden</option>
                            <option value='sg'>Singapore</option>
                            <option value='si'>Slovenia</option>
                            <option value='sk'>Slovakia</option>
                            <option value='sl'>Sierra Leone</option>
                            <option value='sn'>Senegal</option>
                            <option value='sr'>Suriname</option>
                            <option value='st'>Sao Tome e Principe</option>
                            <option value='sv'>El Salvador</option>
                            <option value='sz'>Swaziland</option>
                            <option value='tc'>Turks and Caicos Islands</option>
                            <option value='td'>Chad</option>
                            <option value='th'>Thailand</option>
                            <option value='tj'>Tajikistan</option>
                            <option value='tm'>Turkmenistan</option>
                            <option value='tn'>Tunisia</option>
                            <option value='tr'>Turkey</option>
                            <option value='tt'>Republic of Trinidad and Tobago</option>
                            <option value='tw'>Taiwan</option>
                            <option value='tz'>Tanzania</option>
                            <option value='ua'>Ukraine</option>
                            <option value='ug'>Uganda</option>
                            <option value='uy'>Uruguay</option>
                            <option value='uz'>Uzbekistan</option>
                            <option value='vc'>Saint Vincent and the Grenadines</option>
                            <option value='ve'>Venezuela</option>
                            <option value='vg'>British Virgin Islands</option>
                            <option value='vn'>Vietnam</option>
                            <option value='ye'>Yemen</option>
                            <option value='za'>South Africa</option>
                            <option value='zw'>Zimbabwe</option>
                        </select>
                        </label>
                    </li>
                    <li class="app-prefs-togg">
                        <span class="typography-title-3-tall">Incognito Mode</span>
                        <label class="toggle-element list-element">
                            <input type="checkbox" checked>
                            <span class="slider"></span>
                        </label>
                    </li>
                    <li class="app-prefs-dropdown">
                        <span class="typography-title-3-tall">Show notifications on Song Change</span>
                        <select class="form-dropdown-select list-element" name="selector" id="cool-selector">
                            <option disabled>Select one</option>
                            <option value=true>Enabled</option>
                            <option value='minimized'>Enabled (Notifications when Minimized)</option>
                        </select>
                        </label>
                    </li>
                </ul>
            </div>
        </div>
    `
        /*Here we create the settings menu and add onclicks for all elements and use electron-store*/

    }

} catch (e) {
    console.error("[JS] Error while trying to apply settingsPage.js", e);
}