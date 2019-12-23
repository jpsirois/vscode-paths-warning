const vscode = require('vscode')
const debounce = require('lodash.debounce')

const COLORS_CONFIG = 'workbench.colorCustomizations'
const PACKAGE_NAME = 'paths_warning'

let config = {}
let currentStyles = []
let outputChannel

async function activate() {
    readConfig()
    resetOutputChannel()

    // currently opened file
    let activeEditor = vscode.window.activeTextEditor
    checkForEditor(activeEditor)

    // on window change
    vscode.window.onDidChangeWindowState(
        debounce(function (e) {
            if (e.focused) {
                let editor = vscode.window.activeTextEditor
                checkForEditor(editor)
            }
        }, 150)
    )

    // on file change/close
    vscode.window.onDidChangeActiveTextEditor(
        debounce(function (editor) {
            checkForEditor(editor)
        }, 150)
    )

    // on config change
    vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration(`${PACKAGE_NAME}.exclude`)) {
            checkForEditor(vscode.window.activeTextEditor)
        }

        if (e.affectsConfiguration(`${PACKAGE_NAME}.styles`) || e.affectsConfiguration(COLORS_CONFIG)) {
            readConfig()
        }

        if (e.affectsConfiguration(`${PACKAGE_NAME}.debug`)) {
            resetOutputChannel()
        }
    })
}

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

function getConfig(key = null) {
    return vscode.workspace.getConfiguration(key)
}

function readConfig() {
    config = getConfig(PACKAGE_NAME)
    updateCurrentStyles()
}

async function updateCurrentStyles(data) {
    currentStyles = data || await getConfig(COLORS_CONFIG)
}

async function checkForEditor(editor) {
    let msg = null

    if (editor) {
        const root = vscode.workspace.rootPath || ''
        const fileName = editor.document.fileName

        // debug
        if (config.debug) {
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
                }
            }

            // exclude
            let exclude = await checkForExclusions(fileName)

            if (!fileName.startsWith(root) && !exclude) {
                msg = 'External Path'
            }

            // show warning
            if (msg) {
                vscode.window.showWarningMessage(`WARNING: You're Viewing A File From "${msg}" !`)
            }
        }
    }

    applyStyles(!!(msg))
}

async function checkForExclusions(fileName) {
    let exclude = await config.exclude

    return exclude.some((el) => fileName.includes(el))
}

async function applyStyles(add = true) {
    if (config.styles) {
        let check = hasAppliedStyles()

        if (add && !check) {
            let data = Object.assign({}, currentStyles, config.styles)

            return getConfig().update(COLORS_CONFIG, data, true)
        }

        if (!add && check) {
            let diff = await getDiffProps()
            getConfig().update(COLORS_CONFIG, diff, true)

            return updateCurrentStyles(diff)
        }
    }
}

function hasAppliedStyles() {
    return Object.keys(config.styles).some((key) => Object.keys(currentStyles).includes(key))
}

function getDiffProps() {
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
