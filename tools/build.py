import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)

import belgium as b
from i18n import LANGS, CITIES, INDEX_FILES, LEGAL_FILES

SITE = 'https://bkconsult.be'
ORDER = ['fr', 'nl', 'en']
SLUG = {'fr': '', 'nl': 'nl/', 'en': 'en/'}
LEGAL_SLUG = {'fr': 'mentions-legales.html', 'nl': 'nl/wettelijke-vermeldingen.html', 'en': 'en/legal-notice.html'}


def build_map(lang, d):
    f = 0.5

    def P(lon, lat):
        x, y = b.proj(lon, lat)
        return x * f, y * f

    pts = [P(*p) for p in b.BORDER]
    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]
    pad = 34
    x0, y0 = min(xs) - pad, min(ys) - pad
    W = max(xs) - min(xs) + 2 * pad
    H = max(ys) - min(ys) + 2 * pad
    path = 'M' + ' L'.join('%.1f,%.1f' % (x - x0, y - y0) for x, y in pts) + 'Z'
    types = {
        'Bruxelles': 'cc axe', 'Anvers': 'cc axe', 'Gand': 'cc axe', 'Liège': 'cc event axe',
        'Charleroi': 'cc axe', 'Namur': 'event axe', 'Mons': 'axe', 'Bruges': 'event axe',
        'Hasselt': 'axe', 'Louvain': 'axe', 'Tournai': 'axe', 'Malines': 'axe',
        'Courtrai': 'axe', 'Arlon': 'axe', 'Bastogne': 'event axe', 'Ostende': 'event axe'}
    roads = [
        ('E40', ['Ostende', 'Bruges', 'Gand', 'Bruxelles', 'Louvain', 'Liège']),
        ('E19', ['Anvers', 'Malines', 'Bruxelles', 'Mons']),
        ('E411', ['Bruxelles', 'Namur', 'Bastogne', 'Arlon']),
        ('E42', ['Tournai', 'Mons', 'Charleroi', 'Namur', 'Liège']),
        ('E313', ['Anvers', 'Hasselt', 'Liège']),
        ('E17', ['Anvers', 'Gand', 'Courtrai'])]
    road_svg = ''
    for rn, cs in roads:
        pts = []
        for c in cs:
            rx, ry = P(*b.CITIES[c])
            pts.append('%.1f,%.1f' % (rx - x0, ry - y0))
        road_svg += '<polyline class="road" data-types="axe" data-name="%s" data-cities="%s" points="%s"/>' % (rn, ','.join(cs), ' '.join(pts))
        k = (len(pts) - 1) // 2 if rn != 'E40' else 1
        ax, ay = [float(v) for v in pts[k].split(',')]
        bx, by = [float(v) for v in pts[k + 1].split(',')]
        mx, my = (ax + bx) / 2, (ay + by) / 2 + (-20 if rn == 'E42' else 0)
        road_svg += '<g class="road__tag" data-types="axe" data-name="%s" transform="translate(%.1f %.1f)"><rect x="-22" y="-11" width="44" height="22" rx="11"/><text y="5" text-anchor="middle">%s</text></g>' % (rn, mx, my, rn)
    lit = ''
    pins = ''
    for c, t in types.items():
        x, y = P(*b.CITIES[c])
        x -= x0
        y -= y0
        name = CITIES[lang][c]
        lit += '<circle class="lit" data-types="%s" cx="%.1f" cy="%.1f" r="64" fill="url(#halo)"/>' % (t, x, y)
        if c == 'Ostende':
            label = '<text class="pin__label" x="0" y="-16" text-anchor="middle">%s</text>' % name
        elif c in ('Bastogne', 'Arlon', 'Hasselt'):
            label = '<text class="pin__label" x="-12" y="4" text-anchor="end">%s</text>' % name
        else:
            label = '<text class="pin__label" x="12" y="4">%s</text>' % name
        minor = ' pin--minor' if c in ('Hasselt', 'Louvain', 'Malines') else ''
        pins += '<g class="pin%s" data-types="%s" data-city="%s" tabindex="0" role="button" aria-label="%s" transform="translate(%.1f %.1f)"><circle class="pin__hit" r="18"/><circle class="pin__ring" r="12"/><circle class="pin__dot" r="4.6"/>%s</g>' % (minor, t, c, name, x, y, label)
    return (
        '<svg class="map__svg" viewBox="0 0 %.0f %.0f" role="img" aria-label="%s" focusable="false">'
        '<defs>'
        '<clipPath id="be"><path d="%s"/></clipPath>'
        '<pattern id="dotsDim" width="8" height="8" patternUnits="userSpaceOnUse"><circle cx="4" cy="4" r="1.5" fill="#fff" fill-opacity=".2"/></pattern>'
        '<pattern id="dotsHot" width="8" height="8" patternUnits="userSpaceOnUse"><circle cx="4" cy="4" r="2" fill="#FB923C"/></pattern>'
        '<radialGradient id="halo"><stop offset="0" stop-color="#fff"/><stop offset=".45" stop-color="#fff" stop-opacity=".7"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>'
        '<mask id="litmask" maskUnits="userSpaceOnUse" x="0" y="0" width="%.0f" height="%.0f">%s</mask>'
        '<mask id="curmask" maskUnits="userSpaceOnUse" x="0" y="0" width="%.0f" height="%.0f"><circle class="cursor" cx="-200" cy="-200" r="62" fill="url(#halo)"/></mask>'
        '</defs>'
        '<rect width="%.0f" height="%.0f" fill="url(#dotsDim)" clip-path="url(#be)"/>'
        '<g clip-path="url(#be)"><rect width="%.0f" height="%.0f" fill="url(#dotsHot)" mask="url(#litmask)"/>'
        '<rect class="cursor-dots" width="%.0f" height="%.0f" fill="url(#dotsHot)" mask="url(#curmask)"/></g>'
        '<path class="map__edge" d="%s"/>%s%s</svg>'
    ) % (W, H, d['map_aria'], path, W, H, lit, W, H, W, H, W, H, W, H, path, road_svg, pins)


G = 376
PAL = [
    ('#0B1220', '#FFFFFF', '#FB923C'),
    ('#C2410C', '#FFFFFF', '#FFF4E6'),
    ('#FFF4E6', '#0B1220', '#C2410C'),
    ('#431407', '#FFFFFF', '#FB923C'),
    ('#FDBA74', '#0B1220', '#0B1220'),
]


def art(i, cx, cy, s):
    if i == 0:
        return (
            '<g fill="none" stroke="#FB923C" stroke-width="%.1f" stroke-opacity=".9">'
            '<circle cx="%.1f" cy="%.1f" r="%.1f"/><circle cx="%.1f" cy="%.1f" r="%.1f"/><circle cx="%.1f" cy="%.1f" r="%.1f"/></g>'
            '<circle cx="%.1f" cy="%.1f" r="%.1f" fill="#C2410C"/>'
        ) % (s * .04, cx, cy, s * .95, cx, cy, s * .66, cx, cy, s * .37, cx, cy, s * .17)
    if i == 1:
        return (
            '<circle cx="%.1f" cy="%.1f" r="%.1f" fill="#FFF4E6"/>'
            '<circle cx="%.1f" cy="%.1f" r="%.1f" fill="none" stroke="#0B1220" stroke-width="%.1f" stroke-dasharray="%.1f %.1f"/>'
            '<text x="%.1f" y="%.1f" text-anchor="middle" class="sv-t" font-size="%.1f" fill="#C2410C">%%</text>'
        ) % (cx, cy, s * .8, cx, cy, s * .68, s * .03, s * .1, s * .08, cx, cy + s * .3, s * .95)
    if i == 2:
        return (
            '<circle cx="%.1f" cy="%.1f" r="%.1f" fill="#FDBA74"/><circle cx="%.1f" cy="%.1f" r="%.1f" fill="#C2410C"/>'
            '<circle cx="%.1f" cy="%.1f" r="%.1f" fill="#0B1220"/><circle cx="%.1f" cy="%.1f" r="%.1f" fill="#FFF4E6"/>'
        ) % (cx, cy, s * 1.0, cx, cy, s * .76, cx, cy, s * .52, cx, cy, s * .28)
    if i == 3:
        out = '<g fill="#FB923C" fill-opacity=".45">'
        for r in (-1, 0, 1):
            for c in (-1, 0, 1):
                if r == 0 and c == 0:
                    continue
                out += '<circle cx="%.1f" cy="%.1f" r="%.1f"/>' % (cx + c * s * .5, cy + r * s * .5, s * .15)
        return out + '</g><circle cx="%.1f" cy="%.1f" r="%.1f" fill="#fff"/>' % (cx, cy, s * .2)
    return (
        '<circle cx="%.1f" cy="%.1f" r="%.1f" fill="#C2410C"/><circle cx="%.1f" cy="%.1f" r="%.1f" fill="#0B1220" fill-opacity=".92"/>'
        '<circle cx="%.1f" cy="%.1f" r="%.1f" fill="#fff" fill-opacity=".92"/>'
    ) % (cx - s * .3, cy - s * .2, s * .55, cx + s * .3, cy - s * .2, s * .55, cx, cy + s * .3, s * .55)


def creative(i, x, y, w, h, tag, lines, under=''):
    bg, fg, tc = PAL[i]
    m = min(w, h)
    pad = m * .07
    n = len(lines)
    mx = max(len(l) for l in lines)
    fs = min(h * .15, (w - 2 * pad) / (mx * .56))
    lh = fs * 1.06
    base0 = y + h - pad - (n - 1) * lh - fs * .18
    ft = max(9.0, min(m * .045, fs * .5))
    chip_h = ft * 2
    chip_w = len(tag) * ft * .8 + ft * 1.6
    chip_y = base0 - fs - chip_h - ft * .8
    s = m * .3
    out = '<clipPath id="pc%d"><rect x="%.1f" y="%.1f" width="%.1f" height="%.1f" rx="3"/></clipPath>' % (i, x, y, w, h)
    out += '<g class="sv-panel" clip-path="url(#pc%d)"><rect x="%.1f" y="%.1f" width="%.1f" height="%.1f" fill="%s"/>' % (i, x, y, w, h, bg)
    out += art(i, x + w - s * 1.08 - pad, y + s * 1.08 + pad, s)
    out += under
    out += '<g class="sv-lines"><rect x="%.1f" y="%.1f" width="%.1f" height="%.1f" rx="%.1f" fill="none" stroke="%s" stroke-width="1"/>' % (x + pad, chip_y, chip_w, chip_h, chip_h / 2, tc)
    out += '<text class="sv-tag" x="%.1f" y="%.1f" font-size="%.1f" fill="%s" letter-spacing="%.1f">%s</text>' % (x + pad + ft * .8, chip_y + chip_h / 2 + ft * .36, ft, tc, ft * .08, tag.upper())
    for k, line in enumerate(lines):
        out += '<text class="sv-t" x="%.1f" y="%.1f" font-size="%.1f" fill="%s">%s</text>' % (x + pad, base0 + k * lh, fs, fg, line)
    out += '</g><rect x="%.1f" y="%.1f" width="%.1f" height="%.1f" fill="url(#led%d)"/></g>' % (x, y, w, h, i)
    return out


def people(xs_, fill, r=8, base=G):
    s = ''
    for x in xs_:
        s += '<circle cx="%d" cy="%d" r="%d" fill="%s"/><rect x="%d" y="%d" width="%d" height="%d" rx="%d" fill="%s"/>' % (
            x, base - 44, r, fill, x - r - 3, base - 34, 2 * r + 6, 34, r, fill)
    return s


def scene(i, d):
    tag = d['s_tag'][i]
    lines = d['s_lines'][i]
    defs = (
        '<defs><pattern id="led%d" width="5" height="5" patternUnits="userSpaceOnUse"><circle cx="2.5" cy="2.5" r=".9" fill="#000" fill-opacity=".26"/></pattern>'
        '<linearGradient id="sk%d" x1="0" y1="0" x2="0" y2="1">%s</linearGradient>'
        '<radialGradient id="gl%d"><stop offset="0" stop-color="#C2410C" stop-opacity=".5"/><stop offset="1" stop-color="#C2410C" stop-opacity="0"/></radialGradient></defs>'
    )
    sky = {
        0: '<stop offset="0" stop-color="#E8EEF7"/><stop offset="1" stop-color="#FFF4E6"/>',
        1: '<stop offset="0" stop-color="#F3F5F9"/><stop offset="1" stop-color="#E3E7EE"/>',
        2: '<stop offset="0" stop-color="#263049"/><stop offset="1" stop-color="#16203A"/>',
        3: '<stop offset="0" stop-color="#16203A"/><stop offset="1" stop-color="#431407"/>',
        4: '<stop offset="0" stop-color="#D9E4F2"/><stop offset="1" stop-color="#F5F7FA"/>',
    }[i]
    o = defs % (i, i, sky, i)
    o += '<rect width="640" height="400" fill="url(#sk%d)"/>' % i
    ink = '#0B1220'
    if i == 0:
        o += '<g fill="#CBD6E6"><rect x="0" y="236" width="56" height="140"/><rect x="62" y="270" width="48" height="106"/><rect x="540" y="250" width="52" height="126"/><rect x="598" y="214" width="42" height="162"/></g>'
        o += '<rect y="%d" width="640" height="%d" fill="#D5DCE7"/>' % (G, 400 - G)
        o += '<rect x="302" y="292" width="16" height="%d" fill="%s"/><rect x="%d" y="30" width="500" height="262" rx="8" fill="%s"/>' % (G - 292, ink, 70, ink)
        o += '<rect x="262" y="292" width="96" height="10" fill="%s"/>' % ink
        o += '<ellipse cx="320" cy="%d" rx="230" ry="10" fill="url(#gl0)"/>' % (G + 6)
        o += creative(0, 78, 38, 484, 246, tag, lines)
        o += people([40, 112, 560], '#7C8CA6')
    elif i == 1:
        o += '<rect y="%d" width="640" height="%d" fill="#D5DCE7"/>' % (G, 400 - G)
        o += '<g fill="#fff" fill-opacity=".9"><rect x="40" y="12" width="140" height="6" rx="3"/><rect x="250" y="12" width="140" height="6" rx="3"/><rect x="460" y="12" width="140" height="6" rx="3"/></g>'
        o += '<g fill="#E3E7EE"><rect x="0" y="60" width="150" height="%d"/><rect x="490" y="60" width="150" height="%d"/></g>' % (G - 60, G - 60)
        o += '<g fill="#fff"><rect x="18" y="90" width="114" height="150" rx="4"/><rect x="508" y="90" width="114" height="150" rx="4"/></g>'
        o += '<rect x="222" y="24" width="196" height="340" rx="10" fill="%s"/><rect x="240" y="364" width="160" height="12" rx="4" fill="%s"/>' % (ink, ink)
        o += '<ellipse cx="320" cy="%d" rx="130" ry="8" fill="url(#gl1)"/>' % (G + 8)
        o += creative(1, 230, 32, 180, 300, tag, lines)
        o += people([84, 520, 586], '#8D99AC', 8)
    elif i == 2:
        o += '<g stroke="#fff" stroke-opacity=".06" stroke-width="1">' + ''.join('<path d="M0 %d H640"/>' % y for y in range(20, 380, 24)) + '</g>'
        o += '<rect y="%d" width="640" height="%d" fill="#0E1527"/>' % (G, 400 - G)
        o += '<rect x="77" y="42" width="486" height="244" rx="8" fill="%s"/>' % ink
        o += '<rect x="85" y="50" width="470" height="228" fill="#C2410C"/>'
        o += creative(2, 85, 50, 470, 228, tag, lines, '<g stroke="%s" stroke-width="4"><path d="M239.500 50V278M397.500 50V278M85 164H555"/></g>' % ink)
        o += '<rect x="110" y="286" width="12" height="%d" fill="%s"/><rect x="518" y="286" width="12" height="%d" fill="%s"/>' % (G - 286, ink, G - 286, ink)
        o += '<ellipse cx="320" cy="%d" rx="250" ry="9" fill="url(#gl2)"/>' % (G + 6)
        o += people([40, 600], '#3A4660', 8)
    elif i == 3:
        o += '<polygon points="90,0 150,0 270,%d 20,%d" fill="#FDBA74" fill-opacity=".1"/><polygon points="550,0 490,0 370,%d 620,%d" fill="#FDBA74" fill-opacity=".1"/>' % (G, G, G, G)
        o += '<g fill="#FDBA74"><circle cx="60" cy="60" r="2.2"/><circle cx="580" cy="90" r="2.4"/><circle cx="110" cy="140" r="1.8"/><circle cx="530" cy="40" r="2"/></g>'
        o += '<rect y="%d" width="640" height="%d" fill="#2A0E05"/>' % (G, 400 - G)
        o += '<rect x="182" y="22" width="276" height="306" rx="10" fill="%s"/>' % ink
        o += '<rect x="314" y="328" width="12" height="14" fill="%s"/><rect x="232" y="340" width="176" height="12" rx="6" fill="%s"/>' % (ink, ink)
        o += '<g fill="%s" stroke="#FDBA74" stroke-width="3"><circle cx="258" cy="362" r="14"/><circle cx="382" cy="362" r="14"/></g>' % ink
        o += creative(3, 190, 30, 260, 290, tag, lines)
        x = 12
        while x < 640:
            if not 150 < x < 490:
                o += people([x], '#050A14', 9, G + 22)
            x += 34
    else:
        o += '<rect y="%d" width="640" height="%d" fill="#101A30"/>' % (G, 400 - G)
        o += '<polygon points="120,0 190,0 330,%d 40,%d" fill="#FDBA74" fill-opacity=".09"/><polygon points="520,0 450,0 310,%d 600,%d" fill="#FDBA74" fill-opacity=".09"/>' % (G, G, G, G)
        o += '<rect x="0" y="0" width="640" height="14" fill="%s"/>' % ink
        o += '<path d="M0 34 Q160 66 320 34 T640 34" fill="none" stroke="#3A4660" stroke-width="2"/>'
        cols = ['#C2410C', '#FDBA74', '#FFF4E6', '#FB923C']
        for k in range(16):
            bx = 20 + k * 40
            by = 34 + (14 if 0 < k < 15 and k % 2 == 0 else 6)
            o += '<polygon points="%d,%d %d,%d %d,%d" fill="%s"/>' % (bx, by - 4, bx + 16, by - 4, bx + 8, by + 14, cols[k % 4])
        o += '<rect x="116" y="70" width="408" height="236" rx="8" fill="%s"/>' % ink
        o += '<rect x="90" y="306" width="460" height="14" rx="3" fill="#263049"/>'
        o += '<rect y="%d" width="640" height="22" fill="#16203A"/>' % (G - 22)
        o += creative(4, 124, 78, 392, 220, tag, lines)
        o += '<g fill="#FDBA74"><circle cx="60" cy="110" r="2.4"/><circle cx="590" cy="130" r="2.2"/><circle cx="40" cy="200" r="1.8"/><circle cx="604" cy="220" r="2"/></g>'
        x = 8
        while x < 640:
            o += people([x], '#050A14', 10, G + 24)
            x += 36
    return o


def slides(d):
    html = ''
    for i in range(5):
        label = d['s_label'][i]
        alt = '%s. %s' % (label, ' '.join(d['s_lines'][i]))
        html += (
            '<div class="slide%s"%s>'
            '<svg class="slide__svg" viewBox="0 0 640 400" preserveAspectRatio="xMidYMid slice" role="img" aria-label="%s">%s</svg>'
            '<span class="slide__label">%s</span></div>'
        ) % (' is-active' if i == 0 else '', '' if i == 0 else ' aria-hidden="true"', alt, scene(i, d), label)
    return html


TILE_DECO = [
    ('a', '<svg class="tile__deco" viewBox="0 0 120 120" aria-hidden="true"><g fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.2"><circle cx="70" cy="50" r="48"/><circle cx="70" cy="50" r="34"/><circle cx="70" cy="50" r="20"/></g><circle cx="70" cy="50" r="9" fill="#FDBA74"/></svg>'),
    ('b', '<svg class="tile__deco" viewBox="0 0 120 120" aria-hidden="true"><rect x="38" y="22" width="66" height="66" rx="10" fill="#C2410C" transform="rotate(12 71 55)"/><text x="71" y="68" text-anchor="middle" font-family="Poppins,sans-serif" font-weight="600" font-size="40" fill="#fff" transform="rotate(12 71 55)">%</text></svg>'),
    ('c', '<svg class="tile__deco" viewBox="0 0 120 120" aria-hidden="true"><circle cx="80" cy="110" r="52" fill="#FDBA74"/><circle cx="80" cy="110" r="38" fill="#C2410C"/><circle cx="80" cy="110" r="24" fill="#0B1220"/></svg>'),
    ('d', '<svg class="tile__deco" viewBox="0 0 120 120" aria-hidden="true"><circle cx="48" cy="46" r="30" fill="#C2410C"/><circle cx="78" cy="46" r="30" fill="#0B1220" fill-opacity=".92"/><circle cx="63" cy="72" r="30" fill="#fff" fill-opacity=".9"/></svg>'),
    ('e', '<svg class="tile__deco" viewBox="0 0 120 120" aria-hidden="true"><g fill="#FB923C" fill-opacity=".4"><circle cx="32" cy="32" r="9"/><circle cx="62" cy="32" r="9"/><circle cx="92" cy="32" r="9"/><circle cx="32" cy="62" r="9"/><circle cx="92" cy="62" r="9"/><circle cx="32" cy="92" r="9"/><circle cx="62" cy="92" r="9"/><circle cx="92" cy="92" r="9"/></g><circle cx="62" cy="62" r="12" fill="#fff"/></svg>'),
    ('f', '<svg class="tile__deco" viewBox="0 0 120 120" aria-hidden="true"><g fill="none" stroke="#C2410C" stroke-width="5" stroke-linecap="round"><path d="M30 80a40 40 0 0 1 0-56"/><path d="M46 70a22 22 0 0 1 0-36"/><path d="M62 60a6 6 0 0 1 0-16"/></g><circle cx="72" cy="52" r="8" fill="#0B1220"/></svg>'),
    ('g', '<svg class="tile__deco" viewBox="0 0 120 120" aria-hidden="true"><g fill="#FB923C"><rect x="20" y="70" width="18" height="36" rx="4"/><rect x="46" y="50" width="18" height="56" rx="4" fill-opacity=".7"/><rect x="72" y="28" width="18" height="78" rx="4" fill-opacity=".45"/></g></svg>'),
]


def format_scenes():
    def pe(xs_, base, r=8, fill='#050A14'):
        s = ''
        for x in xs_:
            s += '<circle cx="%d" cy="%d" r="%d" fill="%s"/><rect x="%d" y="%d" width="%d" height="%d" rx="%d" fill="%s"/>' % (
                x, base - 40, r, fill, x - r - 2, base - 30, 2 * r + 4, 34, r, fill)
        return s

    A = (
        '<svg class="fcard__media" viewBox="0 0 300 340" preserveAspectRatio="xMidYMid slice" aria-hidden="true">'
        '<defs><pattern id="ledA" width="5" height="5" patternUnits="userSpaceOnUse"><circle cx="2.5" cy="2.5" r=".9" fill="#000" fill-opacity=".3"/></pattern>'
        '<linearGradient id="flA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C2410C" stop-opacity=".4"/><stop offset="1" stop-color="#C2410C" stop-opacity="0"/></linearGradient></defs>'
        '<rect width="300" height="340" fill="#16203A"/><rect y="252" width="300" height="88" fill="#0E1527"/>'
        '<g fill="#FDBA74" fill-opacity=".9"><ellipse cx="40" cy="26" rx="18" ry="3"/><ellipse cx="115" cy="26" rx="18" ry="3"/><ellipse cx="190" cy="26" rx="18" ry="3"/><ellipse cx="265" cy="26" rx="18" ry="3"/></g>'
        '<rect x="88" y="62" width="124" height="180" rx="8" fill="#0B1220"/><rect x="96" y="70" width="108" height="164" rx="3" fill="#C2410C"/><rect x="96" y="70" width="108" height="164" fill="url(#ledA)"/>'
        '<circle cx="150" cy="108" r="19" fill="#FFF4E6"/><rect x="108" y="150" width="56" height="8" rx="4" fill="#fff"/><rect x="108" y="166" width="84" height="8" rx="4" fill="#fff" fill-opacity=".7"/><rect x="108" y="196" width="40" height="14" rx="7" fill="#0B1220"/>'
        '<rect x="88" y="254" width="124" height="54" fill="url(#flA)"/>'
        + pe([40, 252, 286], 256) + pe([68], 262, 7, '#0B1220') + '</svg>')
    B = (
        '<svg class="fcard__media" viewBox="0 0 300 340" preserveAspectRatio="xMidYMid slice" aria-hidden="true">'
        '<defs><linearGradient id="skB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF4E6"/><stop offset="1" stop-color="#FDBA74"/></linearGradient>'
        '<pattern id="ledB" width="5" height="5" patternUnits="userSpaceOnUse"><circle cx="2.5" cy="2.5" r=".9" fill="#000" fill-opacity=".3"/></pattern></defs>'
        '<rect width="300" height="340" fill="url(#skB)"/><circle cx="242" cy="62" r="28" fill="#FB923C"/>'
        '<g fill="#16203A"><rect x="0" y="196" width="52" height="144"/><rect x="58" y="226" width="42" height="114"/><rect x="212" y="206" width="48" height="134"/><rect x="266" y="176" width="40" height="164"/></g>'
        '<rect x="144" y="172" width="12" height="130" fill="#0B1220"/>'
        '<rect x="78" y="66" width="144" height="110" rx="7" fill="#0B1220"/><rect x="85" y="73" width="130" height="96" rx="3" fill="#C2410C"/><rect x="85" y="73" width="130" height="96" fill="url(#ledB)"/>'
        '<circle cx="190" cy="106" r="14" fill="#FDBA74"/><rect x="98" y="120" width="64" height="9" rx="4.5" fill="#fff"/><rect x="98" y="138" width="42" height="9" rx="4.5" fill="#fff" fill-opacity=".7"/>'
        '<rect y="298" width="300" height="42" fill="#0B1220"/>'
        + pe([36, 116, 196, 268], 306, 8, '#16203A') + '</svg>')
    mods = ''
    dxy = [(-60, -40), (60, -40), (-70, 0), (70, 0), (-60, 40), (60, 40)]
    k = 0
    for r_ in range(3):
        for c_ in range(2):
            dx, dy = dxy[k]
            mods += '<g class="mod" style="--dx:%dpx;--dy:%dpx;--k:%d"><rect x="%d" y="%d" width="54" height="46" rx="4" fill="%s"/><rect x="%d" y="%d" width="54" height="46" rx="4" fill="url(#ledC)"/></g>' % (
                dx, dy, k, 93 + c_ * 58, 52 + r_ * 50, '#C2410C' if (r_ + c_) % 2 == 0 else '#D9541A', 93 + c_ * 58, 52 + r_ * 50)
            k += 1
    C = (
        '<svg class="fcard__media" viewBox="0 0 300 340" preserveAspectRatio="xMidYMid slice" aria-hidden="true">'
        '<defs><pattern id="ledC" width="5" height="5" patternUnits="userSpaceOnUse"><circle cx="2.5" cy="2.5" r=".9" fill="#000" fill-opacity=".3"/></pattern></defs>'
        '<rect width="300" height="340" fill="#16203A"/>'
        '<g transform="translate(0 -34)"><g fill="none" stroke="#fff" stroke-opacity=".08"><path d="M0 250H300M0 280H300M0 310H300"/></g>'
        '<rect x="88" y="46" width="124" height="158" rx="8" fill="#0B1220"/>' + mods +
        '<rect x="144" y="206" width="12" height="30" fill="#0B1220"/><rect x="84" y="234" width="132" height="12" rx="6" fill="#0B1220"/>'
        '<circle cx="104" cy="262" r="10" fill="#0B1220" stroke="#FDBA74" stroke-width="3"/><circle cx="196" cy="262" r="10" fill="#0B1220" stroke="#FDBA74" stroke-width="3"/></g></svg>')
    crowd = ''
    for base, fill, off in [(300, '#2A0E05', 0), (330, '#050A14', 14)]:
        x = 10 + off
        while x < 300:
            crowd += '<circle cx="%d" cy="%d" r="9" fill="%s"/><rect x="%d" y="%d" width="26" height="46" rx="11" fill="%s"/>' % (x, base - 42, fill, x - 13, base - 30, fill)
            x += 30
    conf = ''.join('<circle cx="%d" cy="%d" r="%.1f" fill="%s"/>' % (cx, cy, r, c) for cx, cy, r, c in [
        (30, 70, 2, '#FB923C'), (270, 90, 2.4, '#FDBA74'), (60, 140, 1.6, '#fff'), (240, 40, 1.8, '#fff'), (110, 40, 2, '#FDBA74'), (200, 130, 1.5, '#FB923C'), (280, 170, 1.6, '#fff')])
    D = (
        '<svg class="fcard__media" viewBox="0 0 300 340" preserveAspectRatio="xMidYMid slice" aria-hidden="true">'
        '<defs><linearGradient id="bgD" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0B1220"/><stop offset="1" stop-color="#431407"/></linearGradient>'
        '<pattern id="ledD" width="5" height="5" patternUnits="userSpaceOnUse"><circle cx="2.5" cy="2.5" r=".9" fill="#000" fill-opacity=".3"/></pattern></defs>'
        '<rect width="300" height="340" fill="url(#bgD)"/>'
        '<polygon class="beam beam--l" points="50,0 92,0 190,236 10,236" fill="#FDBA74" fill-opacity=".13"/>'
        '<polygon class="beam beam--r" points="250,0 208,0 110,236 290,236" fill="#FDBA74" fill-opacity=".13"/>'
        + conf +
        '<rect x="62" y="96" width="176" height="108" rx="7" fill="#0B1220"/><rect x="69" y="103" width="162" height="94" rx="3" fill="#C2410C"/><rect x="69" y="103" width="162" height="94" fill="url(#ledD)"/>'
        '<circle cx="150" cy="150" r="30" fill="none" stroke="#FFF4E6" stroke-width="2"/><circle cx="150" cy="150" r="17" fill="none" stroke="#FFF4E6" stroke-width="2"/><circle cx="150" cy="150" r="6" fill="#FFF4E6"/>'
        '<rect x="40" y="204" width="220" height="10" fill="#16203A"/>' + crowd + '</svg>')
    return A, B, C, D


def scene_e(label):
    sq = ''
    for i in range(12):
        cx_, cy_ = i % 3, i // 3
        on = i < 9
        sq += '<rect class="mo%s" style="--k:%d" x="%d" y="%d" width="40" height="40" rx="7" fill="%s"/>' % (' mo--on' if on else '', i, 80 + cx_ * 50, 62 + cy_ * 50, '#C2410C' if on else '#263049')
    return (
        '<svg class="fcard__media" viewBox="0 0 300 340" preserveAspectRatio="xMidYMid slice" aria-hidden="true">'
        '<rect width="300" height="340" fill="#0B1220"/>'
        '<text x="150" y="40" text-anchor="middle" font-family="Poppins,sans-serif" font-weight="600" font-size="26" fill="#fff">%s</text>%s</svg>' % (label, sq))


def blocks(lang, d):
    base = '' if lang == 'fr' else '../'
    legal_href = os.path.relpath(LEGAL_SLUG[lang], os.path.dirname(INDEX_FILES[lang]) or '.')
    keys = ['cc', 'event', 'axe']
    types_html = ''
    for n, k in enumerate(keys):
        types_html += (
            '<button type="button" class="type%s" data-type="%s" aria-pressed="%s">'
            '<span class="type__n">%02d</span>'
            '<span class="type__body"><span class="type__title">%s</span><span class="type__desc">%s</span></span></button>\n'
        ) % (' is-active' if n == 0 else '', k, 'true' if n == 0 else 'false', n + 1, d['ty_t'][n], d['ty_d'][n])

    tiles_html = ''
    for n, (cls, deco) in enumerate(TILE_DECO):
        tiles_html += (
            '<li class="tile tile--%s reveal"><a class="tile__link" href="#devis" data-profil="%s">%s'
            '<span class="tile__tag">%s</span><span class="tile__title">%s</span><span class="tile__desc">%s</span>'
            '<span class="tile__go" aria-hidden="true">→</span></a></li>\n'
        ) % (cls, d['act'][n], deco, d['act'][n], d['w_t'][n], d['w_d'][n])

    A, B, C, D = format_scenes()
    scs = [A, B, C, D, scene_e(d['media12'])]
    per_attr = [None, None, None, d['per'][0], d['per'][1]]
    fm_html = ''
    for n in range(5):
        link = '<a class="fcard__link" href="#devis"%s>%s <span aria-hidden="true">→</span></a>' % (
            ' data-periode="%s"' % per_attr[n] if per_attr[n] else '', d['fm_link'])
        fm_html += (
            '<li class="fcard">%s<div class="fcard__closed"><h3>%s</h3><span class="fcard__hint" aria-hidden="true">%s</span></div>'
            '<div class="fcard__open"><h3>%s</h3><p>%s</p>%s</div></li>\n'
        ) % (scs[n], d['f_t'][n], d['fm_hint'], d['f_t'][n], d['f_p'][n], link)

    steps_html = ''
    for n in range(4):
        steps_html += '<li class="reveal"><span class="steps__n">%d</span><h3>%s</h3><p>%s</p></li>\n' % (n + 1, d['st_t'][n], d['st_p'][n])

    faq_html = ''.join('<details><summary>%s</summary><p>%s</p></details>\n' % (d['q'][n], d['a'][n]) for n in range(5))
    dots_html = ''.join('<button type="button" aria-label="%s %d"%s></button>' % (d['ex'], n + 1, ' aria-current="true"' if n == 0 else '') for n in range(5))
    profil_opts = '<option value="">%s</option>' % d['o_profil0'] + ''.join('<option>%s</option>' % a for a in d['act'])
    def radios(name, first, items):
        h = '<label class="chip"><input type="radio" name="%s" value="" checked><span>%s</span></label>' % (name, first)
        for it in items:
            h += '<label class="chip"><input type="radio" name="%s" value="%s"><span>%s</span></label>' % (name, it, it)
        return h
    loc_opts = radios('lieu', d['o_place0'], d['loc'])
    per_opts = radios('periode', d['o_place0'], d['per'])
    prog = ''.join('<li%s><span class="qprog__n">%d</span><span class="qprog__t">%s</span></li>' % (' aria-current="step"' if n == 0 else '', n + 1, d['qs_labels'][n]) for n in range(3))

    sw = ''
    for L in ORDER:
        cur = ' aria-current="page"' if L == lang else ''
        sw += '<li><a href="%s%s" lang="%s" hreflang="%s"%s>%s</a></li>' % (base, INDEX_FILES[L], L, L, cur, L.upper())

    hreflang = ''.join('  <link rel="alternate" hreflang="%s" href="%s/%s">\n' % (L, SITE, SLUG[L]) for L in ORDER)
    hreflang += '  <link rel="alternate" hreflang="x-default" href="%s/">\n' % SITE

    return {
        'BASE': base, 'LANG': lang, 'TYPES': types_html, 'TILES': tiles_html, 'FORMATS': fm_html, 'STEPS': steps_html,
        'FAQ': faq_html, 'DOTS_NAV': dots_html, 'PROFIL_OPTS': profil_opts, 'LOC_OPTS': loc_opts, 'PER_OPTS': per_opts, 'QPROG': prog,
        'LANGSW': sw, 'HREFLANG': hreflang, 'CANON': '%s/%s' % (SITE, SLUG[lang]), 'SLIDES': slides(d), 'MAP': build_map(lang, d),
        'LEGAL_HREF': legal_href, 'I18N_JSON': json.dumps(dict(d['js'], cap_prefix=d['cap_prefix'], types=d['ty_t']), ensure_ascii=False).replace('</', '<\\/'),
        'INDEX_HREF': os.path.relpath(INDEX_FILES[lang], os.path.dirname(LEGAL_FILES[lang]) or '.'),
    }


def render(tpl, mapping):
    for k, v in mapping.items():
        tpl = tpl.replace('{{' + k + '}}', v)
    return tpl


def main():
    index_tpl = open(os.path.join(HERE, 'index.template.html'), encoding='utf-8').read()
    legal_tpl = open(os.path.join(HERE, 'legal.template.html'), encoding='utf-8').read()
    for lang in ORDER:
        d = LANGS[lang]
        m = blocks(lang, d)
        flat = {k: v for k, v in d.items() if isinstance(v, str)}
        for n in range(3):
            flat['qs_h_%d' % n] = d['qs_h'][n]
        flat['form_legal'] = d['form_legal'].replace('{legal_href}', m['LEGAL_HREF'])
        mapping = dict(m)
        mapping.update(flat)
        for tpl, out in ((index_tpl, INDEX_FILES[lang]), (legal_tpl, LEGAL_FILES[lang])):
            html = render(tpl, mapping)
            path = os.path.join(ROOT, out)
            os.makedirs(os.path.dirname(path), exist_ok=True)
            open(path, 'w', encoding='utf-8').write(html)
            print(out, len(html))


if __name__ == '__main__':
    main()
