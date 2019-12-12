Show a warning message when switching to a file under any of `workspace-root/paths_warning.include` or outside of the workspace.

## Config

```json
"paths_warning.styles": {
    "activityBar.background": "#f3002b50",
    "statusBar.background": "#f3002b50",
},
"paths_warning.include": [
    "vendor",
    "node_modules"
],
"paths_warning.exclude": [
    "Code - Insiders",
]
```

## Notes

- to make sure your custom `workbench.colorCustomizations` doesn't get overridden by the extension, put your colors under the theme name instead ex.https://code.visualstudio.com/docs/getstarted/themes#_customizing-a-color-theme
