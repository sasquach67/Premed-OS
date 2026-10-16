"""Extract checked occlusion boxes from a PDF's actual text layer.

Coordinates are normalized to the rendered full-page PNG, with a top-left origin.
This helper never estimates boxes for scanned pages or ambiguous label matches.
"""
from pathlib import Path
import argparse
import json
import re


def pdf_boxes(pdf, page_number, labels, output_image):
    """Render one 1-based PDF page and return exact text-layer label boxes.

    Returns [{"label": str, "box": {"x", "y", "width", "height"}}].
    Every requested label must match exactly once, including multiword labels.
    The PNG is written only after all matches and bounds have been validated.
    """
    import pdfplumber

    output_image = Path(output_image)
    if output_image.exists():
        raise FileExistsError(f'Refusing to overwrite {output_image}')
    if isinstance(page_number, bool) or not isinstance(page_number, int) or page_number < 1:
        raise ValueError('page_number must be a 1-based positive integer')
    if not isinstance(labels, list) or not labels or any(not isinstance(label, str) or not label.strip() for label in labels):
        raise ValueError('labels must be a nonempty JSON list of nonempty strings')
    if len(set(labels)) != len(labels):
        raise ValueError('Duplicate requested labels are ambiguous')
    with pdfplumber.open(pdf) as document:
        if page_number > len(document.pages):
            raise ValueError(f'Page {page_number} does not exist; PDF has {len(document.pages)} pages')
        page = document.pages[page_number - 1]
        # force_mediabox aligns extraction and output even when the PDF has a CropBox.
        left, top, right, bottom = page.mediabox
        width, height = right - left, bottom - top
        if width <= 0 or height <= 0:
            raise ValueError('PDF page has invalid dimensions')
        result = []
        for label in labels:
            phrase = r'\s+'.join(re.escape(word) for word in label.split())
            # A 270-degree page has bottom-to-top rotated glyphs. The
            # default extractor would read each label backwards.
            direction = {'char_dir_rotated': 'btt', 'line_dir_rotated': 'ltr'} if page.rotation == 270 else {}
            matches = page.search(r'(?<!\w)' + phrase + r'(?!\w)', regex=True, case=True, **direction)
            if len(matches) != 1:
                raise ValueError(f'Label {label!r} must match exactly once in the PDF text layer; found {len(matches)}')
            match = matches[0]
            x, y = (match['x0'] - left) / width, (match['top'] - top) / height
            w, h = (match['x1'] - match['x0']) / width, (match['bottom'] - match['top']) / height
            if min(x, y) < 0 or min(w, h) <= 0 or x + w > 1.000001 or y + h > 1.000001:
                raise ValueError(f'Label {label!r} falls outside the rendered page')
            result.append({'label': label, 'box': {'x': x, 'y': y, 'width': w, 'height': h}})
        rendered = page.to_image(resolution=144, antialias=True, force_mediabox=True)
        # Exclusive creation protects existing files, including a racing writer.
        with output_image.open('xb') as output:
            rendered.original.save(output, format='PNG')
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('pdf', type=Path)
    parser.add_argument('--page', type=int, required=True, help='1-based page number')
    parser.add_argument('--labels', type=Path, required=True, help='JSON list of exact label strings')
    parser.add_argument('--image', type=Path, required=True, help='New output PNG, never overwritten')
    parser.add_argument('--output', type=Path, required=True, help='New output JSON boxes, never overwritten')
    args = parser.parse_args()
    if args.output.exists() or args.image.exists():
        parser.error('Refusing to overwrite an existing image or boxes file')
    if args.output.resolve() == args.image.resolve():
        parser.error('--output and --image must be different paths')
    try:
        boxes = pdf_boxes(args.pdf, args.page, json.loads(args.labels.read_text()), args.image)
        with args.output.open('x') as output:
            json.dump(boxes, output, ensure_ascii=False, indent=2)
            output.write('\n')
    except (ValueError, OSError) as error:
        parser.exit(1, f'{error}\n')


if __name__ == '__main__':
    main()
