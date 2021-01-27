Show a warning message when switching to a file under any of `workspace-root/pathsWarning.include` or outside of the workspace.

## Config

```json
"pathsWarning.styles": {
    "activityBar.background": "#f3002b50",
    "statusBar.background": "#f3002b50",
    "editorGutter.background": "#f3002b50"
},
"pathsWarning.include": [
    "vendor",
    "node_modules"
],
"pathsWarning.exclude": [
    "Code - Insiders"
],
"pathsWarning.showNotification": true,
"pathsWarning.debug": false
```

## Notes

- to make sure your custom `workbench.colorCustomizations` doesn't get overridden by the extension,<br>
    put your colors under the theme name instead ex.https://code.visualstudio.com/docs/getstarted/themes#_customizing-a-color-theme
