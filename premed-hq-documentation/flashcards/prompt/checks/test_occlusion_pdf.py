"""Real PDF text extraction/rendering tests, without document-generation dependencies."""
from pathlib import Path
import json
import subprocess
import sys
import tempfile
import unittest

BASE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BASE))
from prepare_occlusion import pdf_boxes


def write_fixture_pdf(path, duplicate=False, crop=False, rotation=0):
    """Small valid PDF with known font, page size and two exact label positions."""
    contents = b'BT /F1 20 Tf 60 220 Td (Cell membrane) Tj ET\nBT /F1 20 Tf 60 120 Td (Nucleus) Tj ET\n'
    if duplicate:
        contents += b'BT /F1 20 Tf 210 120 Td (Nucleus) Tj ET\n'
    cropbox = (b' /CropBox [20 20 380 280]' if crop else b'') + f' /Rotate {rotation}'.encode()
    objects = [
        b'<< /Type /Catalog /Pages 2 0 R >>',
        b'<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
        b'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 400 300]' + cropbox + b' /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
        b'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
        b'<< /Length ' + str(len(contents)).encode() + b' >>\nstream\n' + contents + b'endstream',
    ]
    data = bytearray(b'%PDF-1.4\n')
    offsets = [0]
    for index, obj in enumerate(objects, 1):
        offsets.append(len(data))
        data += f'{index} 0 obj\n'.encode() + obj + b'\nendobj\n'
    start = len(data)
    data += f'xref\n0 {len(objects) + 1}\n0000000000 65535 f \n'.encode()
    data += b''.join(f'{offset:010d} 00000 n \n'.encode() for offset in offsets[1:])
    data += f'trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{start}\n%%EOF\n'.encode()
    Path(path).write_bytes(data)


class PdfOcclusionChecks(unittest.TestCase):
    def test_exact_multiword_label_has_visible_pixels_at_expected_coordinates(self):
        from PIL import Image
        with tempfile.TemporaryDirectory() as folder:
            pdf, image = Path(folder) / 'slide.pdf', Path(folder) / 'slide.png'
            write_fixture_pdf(pdf)
            boxes = pdf_boxes(pdf, 1, ['Cell membrane', 'Nucleus'], image)
            self.assertEqual([item['label'] for item in boxes], ['Cell membrane', 'Nucleus'])
            with Image.open(image) as rendered:
                self.assertEqual(rendered.size, (800, 600))
                for item, expected_y in zip(boxes, [0.214, 0.548]):
                    box = item['box']
                    self.assertAlmostEqual(box['x'], 0.15, places=4)
                    self.assertAlmostEqual(box['y'], expected_y, places=2)
                    self.assertAlmostEqual(box['height'], 20 / 300, places=4)
                    x, y = box['x'] * 800, box['y'] * 600
                    crop = rendered.crop((int(x), int(y), int(x + box['width'] * 800 + 1), int(y + box['height'] * 600 + 1)))
                    self.assertLess(crop.convert('L').getextrema()[0], 100)

    def test_cropbox_still_uses_full_page_render_coordinates(self):
        from PIL import Image
        with tempfile.TemporaryDirectory() as folder:
            pdf, image = Path(folder) / 'crop.pdf', Path(folder) / 'crop.png'
            write_fixture_pdf(pdf, crop=True)
            box = pdf_boxes(pdf, 1, ['Cell membrane'], image)[0]['box']
            self.assertAlmostEqual(box['x'], 0.15)
            with Image.open(image) as rendered:
                self.assertEqual(rendered.size, (800, 600))

    def test_rotated_pages_keep_boxes_aligned_to_rendered_pixels(self):
        from PIL import Image
        for rotation, expected_x, expected_y in [(90, 0.71953, 0.15), (270, 0.2138, 0.51105)]:
            with self.subTest(rotation=rotation), tempfile.TemporaryDirectory() as folder:
                pdf, image = Path(folder) / 'rotated.pdf', Path(folder) / 'rotated.png'
                write_fixture_pdf(pdf, rotation=rotation)
                box = pdf_boxes(pdf, 1, ['Cell membrane'], image)[0]['box']
                self.assertAlmostEqual(box['x'], expected_x, places=4)
                self.assertAlmostEqual(box['y'], expected_y, places=4)
                self.assertAlmostEqual(box['width'], 20 / 300, places=4)
                with Image.open(image) as rendered:
                    self.assertEqual(rendered.size, (600, 800))
                    x, y = box['x'] * 600, box['y'] * 800
                    cropped = rendered.crop((int(x), int(y), int(x + box['width'] * 600 + 1), int(y + box['height'] * 800 + 1)))
                    self.assertLess(cropped.convert('L').getextrema()[0], 100)

    def test_missing_or_ambiguous_labels_fail_before_writing_image(self):
        with tempfile.TemporaryDirectory() as folder:
            pdf, image = Path(folder) / 'slide.pdf', Path(folder) / 'slide.png'
            write_fixture_pdf(pdf, duplicate=True)
            for label, count in [('Absent label', 0), ('Nucleus', 2), ('mem', 0)]:
                with self.subTest(label=label):
                    with self.assertRaisesRegex(ValueError, f'found {count}'):
                        pdf_boxes(pdf, 1, [label], image)
                    self.assertFalse(image.exists())

    def test_rejects_invalid_page_labels_and_existing_output(self):
        with tempfile.TemporaryDirectory() as folder:
            pdf, image = Path(folder) / 'slide.pdf', Path(folder) / 'slide.png'
            write_fixture_pdf(pdf)
            for page, labels in [(0, ['Nucleus']), (2, ['Nucleus']), (1, []), (1, ['']), (1, ['Nucleus', 'Nucleus'])]:
                with self.subTest(page=page, labels=labels):
                    with self.assertRaises(ValueError):
                        pdf_boxes(pdf, page, labels, image)
            image.write_bytes(b'keep this file')
            with self.assertRaises(FileExistsError):
                pdf_boxes(pdf, 1, ['Nucleus'], image)
            self.assertEqual(image.read_bytes(), b'keep this file')

    def test_cli_creates_boxes_and_refuses_output_replacement(self):
        with tempfile.TemporaryDirectory() as folder:
            folder = Path(folder)
            pdf, image, boxes = folder / 'slide.pdf', folder / 'slide.png', folder / 'boxes.json'
            labels = folder / 'labels.json'
            write_fixture_pdf(pdf)
            labels.write_text(json.dumps(['Cell membrane']))
            command = [sys.executable, str(BASE / 'prepare_occlusion.py'), str(pdf), '--page', '1', '--labels', str(labels), '--image', str(image), '--output', str(boxes)]
            first = subprocess.run(command, capture_output=True, text=True)
            self.assertEqual(first.returncode, 0, first.stderr)
            self.assertEqual(json.loads(boxes.read_text())[0]['label'], 'Cell membrane')
            initial = (image.read_bytes(), boxes.read_bytes())
            second = subprocess.run(command, capture_output=True, text=True)
            self.assertNotEqual(second.returncode, 0)
            self.assertIn('Refusing to overwrite', second.stderr)
            self.assertEqual((image.read_bytes(), boxes.read_bytes()), initial)


if __name__ == '__main__':
    unittest.main()
