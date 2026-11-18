#!/usr/bin/env python3
"""Generate agent-readable Markdown from the site's rendered HTML pages."""

from html.parser import HTMLParser
from pathlib import Path
import re
from urllib.parse import urljoin


ROOT = Path(__file__).resolve().parent.parent / 'dist'
VOID = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr'}
SKIP = {'script', 'style', 'svg', 'button'}


class Node:
    def __init__(self, tag, attrs=()):
        self.tag = tag
        self.attrs = dict(attrs)
        self.children = []


class Document(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = Node('document')
        self.stack = [self.root]

    def handle_starttag(self, tag, attrs):
        node = Node(tag, attrs)
        self.stack[-1].children.append(node)
        if tag not in VOID:
            self.stack.append(node)

    def handle_startendtag(self, tag, attrs):
        self.stack[-1].children.append(Node(tag, attrs))

    def handle_endtag(self, tag):
        for index in range(len(self.stack) - 1, 0, -1):
            if self.stack[index].tag == tag:
                del self.stack[index:]
                break

    def handle_data(self, data):
        self.stack[-1].children.append(data)


def descendants(node, tag):
    if isinstance(node, str):
        return
    for child in node.children:
        if not isinstance(child, str):
            if child.tag == tag:
                yield child
            yield from descendants(child, tag)


def clean(text):
    return re.sub(r'\s+', ' ', text).strip()


def inline(node, base):
    if isinstance(node, str):
        return re.sub(r'\s+', ' ', node)
    if node.tag in SKIP:
        return ''
    content = ''.join(inline(child, base) for child in node.children)
    if node.tag == 'br':
        return ' '
    if node.tag == 'img':
        return node.attrs.get('alt', '')
    if node.tag == 'a' and node.attrs.get('href'):
        label = clean(content)
        return f'[{label}]({urljoin(base, node.attrs["href"])})' if label else ''
    if node.tag == 'code':
        return '`' + clean(content).replace('`', '\\`') + '`'
    if node.tag in {'strong', 'b'} and clean(content):
        return '**' + clean(content) + '**'
    if node.tag in {'em', 'i'} and clean(content):
        return '*' + clean(content) + '*'
    return content


def table_rows(table):
    """Find this table's rows, excluding rows in nested detail tables."""
    def visit(node):
        for child in node.children:
            if isinstance(child, str) or child.tag == 'table' or child.attrs.get('aria-hidden') == 'true':
                continue
            if child.tag == 'tr':
                yield child
            else:
                yield from visit(child)
    return list(visit(table))


def render_table(table, base):
    captions = [clean(inline(c, base)) for c in table.children if isinstance(c, Node) and c.tag == 'caption']
    rows = []
    for row in table_rows(table):
        cells = []
        for cell in row.children:
            if isinstance(cell, str) or cell.tag not in {'th', 'td'}:
                continue
            pieces = []
            for child in cell.children:
                if isinstance(child, Node) and child.tag == 'details':
                    for nested in child.children:
                        if isinstance(nested, Node) and nested.tag == 'table':
                            for nested_row in table_rows(nested)[1:]:
                                values = [clean(inline(c, base)) for c in nested_row.children if isinstance(c, Node) and c.tag in {'th', 'td'}]
                                if values:
                                    pieces.append('Round ' + ': '.join(values))
                        elif isinstance(nested, Node) and nested.tag == 'p':
                            pieces.append(clean(inline(nested, base)))
                else:
                    pieces.append(inline(child, base))
            value = '<br>'.join(clean(p) for p in pieces if clean(p))
            cells.append(value.replace('|', '\\|'))
        if cells:
            rows.append(cells)
    if not rows:
        return ''
    width = max(map(len, rows))
    rows = [row + [''] * (width - len(row)) for row in rows]
    result = ['| ' + ' | '.join(rows[0]) + ' |', '| ' + ' | '.join(['---'] * width) + ' |']
    result.extend('| ' + ' | '.join(row) + ' |' for row in rows[1:])
    return ('**' + captions[0] + '**\n\n' if captions and captions[0] else '') + '\n'.join(result)


def blocks(node, base):
    if isinstance(node, str):
        return clean(node)
    if node.tag in SKIP or node.tag in {'nav', 'form'}:
        return ''
    if node.tag == 'table':
        return render_table(node, base)
    if node.tag in {'h1', 'h2', 'h3', 'h4', 'h5', 'h6'}:
        return '#' * int(node.tag[1]) + ' ' + clean(inline(node, base))
    if node.tag == 'summary':
        heading = next((child for child in node.children if isinstance(child, Node) and child.tag in {'h1', 'h2', 'h3', 'h4', 'h5', 'h6'}), None)
        return blocks(heading, base) if heading else clean(inline(node, base))
    if node.tag in {'p', 'figcaption', 'dt', 'dd'}:
        return clean(inline(node, base))
    if node.tag == 'pre':
        return '```\n' + ''.join(inline(c, base) for c in node.children).strip('`\n') + '\n```'
    if node.tag == 'blockquote':
        text = '\n\n'.join(filter(None, (blocks(c, base) for c in node.children)))
        return '\n'.join('> ' + line if line else '>' for line in text.splitlines())
    if node.tag in {'ul', 'ol'}:
        items = []
        for i, child in enumerate((c for c in node.children if isinstance(c, Node) and c.tag == 'li'), 1):
            prefix = f'{i}. ' if node.tag == 'ol' else '- '
            parts = [blocks(c, base) if isinstance(c, Node) and c.tag in {'ul', 'ol'} else inline(c, base) for c in child.children]
            items.append(prefix + clean(' '.join(parts)))
        return '\n'.join(items)
    if node.tag == 'hr':
        return '---'
    return '\n\n'.join(filter(None, (blocks(c, base) for c in node.children)))


def main():
    pages = sorted(ROOT.rglob('index.html'))
    if not pages:
        raise SystemExit('No built HTML pages found; run astro build first.')
    for page in pages:
        document = Document()
        document.feed(page.read_text(encoding='utf-8'))
        main_node = next(descendants(document.root, 'main'), None)
        canonical = next((n.attrs.get('href') for n in descendants(document.root, 'link') if n.attrs.get('rel') == 'canonical'), None)
        if main_node is None or not canonical:
            raise SystemExit(f'Missing main content or canonical URL: {page}')
        relative = page.parent.relative_to(ROOT)
        output = ROOT / 'index.md' if relative == Path('.') else ROOT / relative.with_suffix('.md')
        text = blocks(main_node, canonical)
        if not text.strip():
            raise SystemExit(f'No Markdown content generated for {page}')
        output.write_text(f'<!-- Source: {canonical} -->\n\n{text}\n', encoding='utf-8')
        print(f'Generated {output.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
