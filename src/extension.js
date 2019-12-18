const vscode = require('vscode')
const debounce = require('lodash.debounce')

function activate() {
    // currently opened file
    let activeEditor = vscode.window.activeTextEditor
    if (activeEditor) {
        showMessage(activeEditor)
    }

    // when files is changed or closed
    vscode.window.onDidChangeActiveTextEditor(
        debounce(function (editor) {
            editor
                ? showMessage(editor)
                : applyStyles(false)
        }, 150)
    )

    vscode.workspace.onDidChangeConfiguration((e) => {
        let activeEditor = vscode.window.activeTextEditor

        if (e.affectsConfiguration('paths_warning.exclude') && activeEditor) {
            showMessage(activeEditor)
        }
    })
}

function getConfig() {
    return vscode.workspace.getConfiguration('paths_warning')
}

function showMessage(editor) {
    let msg = null
    const root = vscode.workspace.rootPath
    const fileName = editor.document.fileName

    // debug
    if (getConfig().debug) {
        console.table({
            root: root,
            name: fileName
        })
    }

    // make sure its "a file" not "a Panel or Untitled"
    if (fileName.includes('/')) {
        // include
        for (const incName of getConfig().include) {
            if (fileName.startsWith(`${root}/${incName}`)) {
                msg = incName
            }
        }

        // exclude
        if (!fileName.startsWith(`${root}`) && !checkForExclusions(fileName)) {
            msg = 'External Path'
        }

        // show warning
        if (msg) {
            vscode.window.showWarningMessage(`WARNING: You\'re Viewing A File From "${msg}" !`)
        }
    }

    applyStyles(!!(msg))
}

async function checkForExclusions(fileName) {
    let exclude = await getConfig().exclude

    return exclude.some((el) => fileName.includes(el))
}

async function applyStyles(add = true) {
    let colorsConfig = 'workbench.colorCustomizations'
    let styles = await getConfig().styles
    let config = vscode.workspace.getConfiguration()
    let current = await config.get(colorsConfig)

    if (styles) {
        if (add) {
            let check = await hasAppliedStyles(current, styles)

            if (!check) {
                return config.update(colorsConfig, Object.assign(current, styles), true)
            }
        } else {
            let diff = await getDiffProps(current, styles)

            return config.update(colorsConfig, diff, true)
        }
    }
}

async function hasAppliedStyles(current, styles) {
    return Object.keys(styles).filter((key) => Object.keys(current).includes(key)).length
}

async function getDiffProps(current, styles) {
    return Object.keys(current)
        .filter((key) => !Object.keys(styles).includes(key))
        .reduce((obj, key) => {
            obj[key] = current[key]

            return obj
        }, {})
}

exports.activate = activate
