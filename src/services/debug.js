export function debugShowImages(images) {
    const win = window.open('', '_blank')
    win.document.write(
        images.map((b64, i) =>
            `<p>Page ${i + 1}</p><img src="data:image/png;base64,${b64}" style="max-width:100%;border:1px solid #ccc">`
        ).join('')
    )
}