const vscode = require('vscode')
const debounce = require('lodash.debounce')

const COLORS_CONFIG = 'workbench.colorCustomizations'
const PACKAGE_NAME = 'paths_warning'

let config = {}
let outputChannel

async function activate() {
    await readConfig()
    resetOutputChannel()

    // currently opened file
    await checkForEditor()

    // on window change
    vscode.window.onDidChangeWindowState(async (e) => {
        if (e.focused) {
            await checkForEditor()
        }
    })

    // on file change/close
    vscode.window.onDidChangeActiveTextEditor(async (editor) => {
        await checkForEditor(editor)
    })

    // on config change
    vscode.workspace.onDidChangeConfiguration(async (e) => {
        if (e.affectsConfiguration(PACKAGE_NAME)) {
            await readConfig()
        }

        if (e.affectsConfiguration(`${PACKAGE_NAME}.exclude`)) {
            await checkForEditor()
        }

        if (e.affectsConfiguration(`${PACKAGE_NAME}.debug`)) {
            resetOutputChannel()
        }
    })
}

/* ---------------------------------- debug --------------------------------- */
function showDebugMsg(text) {
    if (outputChannel) {
        outputChannel.appendLine(text)
    }
}

function resetOutputChannel() {
    if (outputChannel) {
        outputChannel.dispose()
        outputChannel = undefined
    }

    if (config.debug) {
        outputChannel = vscode.window.createOutputChannel("Paths Warning")
    }
}

/* --------------------------------- config --------------------------------- */
async function getConfig(key = null) {
    return vscode.workspace.getConfiguration(key)
}

async function readConfig() {
    return config = await getConfig(PACKAGE_NAME)
}

async function getCurrentStyles() {
    return getConfig(COLORS_CONFIG)
}

const checkForEditor = debounce(async function (editor = vscode.window.activeTextEditor) {
    let msg = null

    try {
        if (editor) {
            const root = vscode.workspace.workspaceFolders[0].uri.fsPath || ''
            const { fileName } = editor.document

            // debug
            if (config.debug) {
                outputChannel.show(true)
                // outputChannel.clear()
                showDebugMsg(`root: ${root}`)
                showDebugMsg(`name: ${fileName}`)
                showDebugMsg('--------------------')
            }

            // make sure its "a file" not "a Panel or Untitled"
            if (fileName.includes('/')) {
                // include
                for (const incName of config.include) {
                    if (fileName.startsWith(`${root}/${incName}`)) {
                        msg = incName
                        break
                    }
                }

                // exclude
                if (!fileName.startsWith(root) && !checkForExclusions(fileName)) {
                    msg = 'External Path'
                }
            }
        }

        if (msg) {
            vscode.window.showInformationMessage(`WARNING: You're Viewing A File From "${msg}" !`)
        }

        return applyStyles(!!(msg))
    } catch (error) {
    }
}, 0.5 * 1000)

function checkForExclusions(fileName) {
    let exclude = config.exclude

    return exclude.some((el) => fileName.includes(el))
}

async function applyStyles(add = true) {
    console.log('helo')

    let currentStyles = await getCurrentStyles()
    let data = {}

    data = add
        ? Object.assign({}, currentStyles, config.styles)
        : await getDiffProps(currentStyles)

    return vscode.workspace.getConfiguration().update(COLORS_CONFIG, data, true)
}

function getDiffProps(currentStyles) {
    return new Promise((resolve) => {
        let data = Object.keys(currentStyles)
            .filter((key) => !Object.keys(config.styles).includes(key))
            .reduce((obj, key) => {
                obj[key] = currentStyles[key]

                return obj
            }, {})

        resolve(data)
    }).then((data) => data)
}

exports.activate = activate

function deactivate() {
}

module.exports = {
    activate,
    deactivate
}
