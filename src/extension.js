const vscode = require('vscode')

function activate(context) {
    let activeEditor = vscode.window.activeTextEditor
    if (activeEditor) {
        showWarningMessageIfNeeded()
    }

    // vscode.window.onDidChangeWindowState((editor) => {
    //     if (editor && editor.focused) {
    //         showWarningMessageIfNeeded()
    //     }
    // }, null, context.subscriptions)

    vscode.window.onDidChangeActiveTextEditor((editor) => {
        editor
            ? showWarningMessageIfNeeded()
            : applyStyles(false)
    }, null, context.subscriptions)
}

function getConfig() {
    return vscode.workspace.getConfiguration('paths_warning')
}

function showWarningMessageIfNeeded() {
    const root = vscode.workspace.rootPath
    let msg = null
    let fileName = vscode.window.activeTextEditor.document.fileName

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
        for (const warn of getConfig().include) {
            if (fileName.startsWith(`${root}/${warn}`)) {
                msg = warn
            }
        }

        // exclude
        if (!fileName.startsWith(`${root}`) && !checkForExclusions(fileName)) {
            msg = 'An External'
        }

        // show warning
        if (msg) {
            vscode.window.showWarningMessage(`WARNING: You\'re Viewing A File Under "${msg}" !`)
        }
    }

    applyStyles(msg)
}

function checkForExclusions(fileName) {
    let exclude = getConfig().exclude

    return exclude.some((el) => fileName.includes(el))
}

function applyStyles(add = true) {
    let colorsConfig = 'workbench.colorCustomizations'
    let styles = getConfig().styles
    let config = vscode.workspace.getConfiguration()
    let current = config.get(colorsConfig)

    if (styles) {
        if (add) {
            let data = Object.assign(current, styles)

            return config.update(colorsConfig, data, true)
        } else {
            const difference = Object.keys(current)
                .filter((key) => !Object.keys(styles).includes(key))
                .reduce((obj, key) => {
                    obj[key] = current[key]

                    return obj
                }, {})

            return config.update(colorsConfig, difference, true)
        }
    }
}

exports.activate = activate
