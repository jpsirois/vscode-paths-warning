const vscode = require('vscode')
const debounce = require('lodash.debounce')

let styles = []

async function activate() {
    styles = await getConfig().styles

    // currently opened file
    let activeEditor = vscode.window.activeTextEditor
    activeEditor
        ? showMessage(activeEditor)
        : applyStyles(false)

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

        if (e.affectsConfiguration('paths_warning.styles')) {
            styles = getConfig().styles
        }
    })
}

function getConfig() {
    return vscode.workspace.getConfiguration('paths_warning')
}

async function showMessage(editor) {
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
        let exclude = await checkForExclusions(fileName)

        if (!fileName.startsWith(root) && !exclude) {
            msg = 'External Path'
        }

        // show warning
        if (msg) {
            vscode.window.showWarningMessage(`WARNING: You're Viewing A File From "${msg}" !`)
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
    let config = vscode.workspace.getConfiguration()
    let current = await config.get(colorsConfig)

    if (styles) {
        let check = hasAppliedStyles(current, styles)

        if (add && !check) {
            let data = Object.assign(current, styles)

            return config.update(colorsConfig, data, true)
        }

        if (!add && check) {
            let diff = await getDiffProps(current, styles)

            return config.update(colorsConfig, diff, true)
        }
    }
}

function hasAppliedStyles(current, styles) {
    return Object.keys(styles).some((key) => Object.keys(current).includes(key))
}

function getDiffProps(current, styles) {
    return new Promise((resolve) => {
        let data = Object.keys(current)
            .filter((key) => !Object.keys(styles).includes(key))
            .reduce((obj, key) => {
                obj[key] = current[key]

                return obj
            }, {})

        resolve(data)
    }).then((data) => data)
}

exports.activate = activate
