# KFMD Homepage Customization

## Rich HTML inside translation JSON

Normal translations use `data-i18n="key"` and are rendered as plain text.

For trusted local translation strings that contain HTML, use:

```html
<p data-i18n-html="aboutDesc"></p>
```

Then HTML tags can be written directly in `lang/en.json` and `lang/id.json`:

```json
"aboutDesc": "First paragraph.<br><br><strong>Important text</strong> and <em>emphasis</em>."
```

The homepage already enables rich HTML for `heroTitle`, `aboutDesc`, `roadmapDesc`, the support-modal description, the support-image placeholder description, `footerDesc`, and `footerCopy`.

Only use `data-i18n-html` with translation files you control, because the content is inserted as HTML.

## Roadmap

Edit `roadmapItems` in both language JSON files. Each item supports:

```json
{
  "title": "Milestone title",
  "date": "22 April 2026"
}
```

`title` supports trusted HTML such as `<em>...</em>`.

## QRIS / support modal

Add the real QRIS image here:

```text
assets/qris.png
```

If the image is missing, the modal shows a styled placeholder automatically.

Edit the support-modal title and gratitude text in:

- `lang/en.json`
- `lang/id.json`
