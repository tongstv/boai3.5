var code = 'async function findRecaptchaClients() {\n' +
    '    // eslint-disable-next-line camelcase\n' +
    '    if (typeof (___grecaptcha_cfg) !== \'undefined\') {\n' +
    '        // eslint-disable-next-line camelcase, no-undef\n' +
    '        return Object.entries(___grecaptcha_cfg.clients).map(([cid, client]) => {\n' +
    '            const data = {id: cid, version: cid >= 10000 ? \'V3\' : \'V2\'};\n' +
    '            const objects = Object.entries(client).filter(([_, value]) => value && typeof value === \'object\');\n' +
    '\n' +
    '            objects.forEach(([toplevelKey, toplevel]) => {\n' +
    '                const found = Object.entries(toplevel).find(([_, value]) => (\n' +
    '                    value && typeof value === \'object\' && \'sitekey\' in value && \'size\' in value\n' +
    '                ));\n' +
    '                if (found) {\n' +
    '                    const [sublevelKey, sublevel] = found;\n' +
    '\n' +
    '                    data.sitekey = sublevel.sitekey;\n' +
    '                    const callbackKey = data.version === \'V2\' ? \'callback\' : \'promise-callback\';\n' +
    '                    const callback = sublevel[callbackKey];\n' +
    '                    if (!callback) {\n' +
    '                        data.callback = null;\n' +
    '                        data.function = null;\n' +
    '                    } else {\n' +
    '                        data.function = callback;\n' +
    '                        const keys = [cid, toplevelKey, sublevelKey, callbackKey].map((key) => `[\'${key}\']`).join(\'\');\n' +
    '                        data.callback = `___grecaptcha_cfg.clients${keys}`;\n' +
    '\n' +
    '\n' +
    '                    }\n' +
    '                }\n' +
    '            });\n' +
    '            return data;\n' +
    '        });\n' +
    '    }\n' +
    '    return [];\n' +
    '    \n' +
    '}\n' +
    'return findRecaptchaClients();'

async function getsitekey() {


    return new Promise(function (resolve, reject) {

        chrome.tabs.create({url: window.conf.web + '/login'}, function (tab) {


            document.addEventListener("DOMContentLoaded", function () {
                chrome.tabs.executeScript(tab.id, {code: code},
                    function (results) {
                        console.log("Sitekey");

                        chrome.tabs.remove(tab.id)
                        resolve(results)
                    });



            });


        });
    })


}


