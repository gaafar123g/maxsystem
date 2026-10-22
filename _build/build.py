# -*- coding: utf-8 -*-
"""
MAX SYSTEM — static site generator (optional).

The finished website is the set of .html files next to this folder. You do NOT need to run this script
to use the site. Run it only if you want to regenerate every page after editing a template or content.json:

    pip install jinja2
    python _build/build.py --site-url https://www.your-domain.com

Arabic pages are written to the project root, English pages to /en.
"""
import argparse
import copy
import json
import re
from pathlib import Path

from jinja2 import Environment, FileSystemLoader, select_autoescape

from extra import EXTRA, ICONS, ICONS_WHY, MONTHS

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
PLACEHOLDER_SITE = "https://www.your-domain.com"
LANGS = ("ar", "en")
DIRS = {"ar": "rtl", "en": "ltr"}
OG_LOCALE = {"ar": "ar_AR", "en": "en_US"}

# CDN assets (official, version-pinned). Replace with local copies in /assets/vendor if you prefer to self-host.
CDN = {
    "bs_css_ltr": "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css",
    "bs_css_rtl": "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.rtl.min.css",
    "bs_js": "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js",
    "icons": "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css",
    "fonts": "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&display=swap",
}


def deep_merge(base, extra):
    for k, v in extra.items():
        if isinstance(v, dict) and isinstance(base.get(k), dict):
            deep_merge(base[k], v)
        else:
            base[k] = v
    return base


def load_content():
    data = json.loads((HERE / "content.json").read_text(encoding="utf-8"))
    for lang in LANGS:
        deep_merge(data["dict"][lang], copy.deepcopy(EXTRA[lang]))
    return data


def short(text, limit=158):
    text = " ".join(text.split())
    if len(text) <= limit:
        return text
    cut = text[:limit].rsplit(" ", 1)[0]
    return cut.rstrip(" ,.;:،؛") + "…"


def fmt_date(iso, lang):
    y, m, d = (int(x) for x in iso.split("-"))
    return f"{d} {MONTHS[lang][m - 1]} {y}"


def reading_minutes(article, lang):
    parts = [article["title"][lang], article["excerpt"][lang]]
    for s in article["sections"]:
        parts.append(s["heading"][lang])
        parts.extend(p[lang] for p in s["paragraphs"])
    words = len(" ".join(parts).split())
    return max(1, round(words / (180 if lang == "ar" else 200)))


def build(site_url, out_root, test_assets=None):
    content = load_content()
    services = content["services"]
    articles = sorted(content["articles"], key=lambda a: a["date"], reverse=True)
    cdn = dict(CDN)
    if test_assets:
        cdn.update(test_assets)

    env = Environment(
        loader=FileSystemLoader(str(HERE / "templates")),
        autoescape=select_autoescape(["html", "j2"]),
        trim_blocks=True,
        lstrip_blocks=True,
    )

    # ───────── page registry (same files in both languages)
    pages = [dict(file="index.html", key="home", tpl="home.html.j2")]
    pages += [dict(file="about.html", key="about", tpl="about.html.j2")]
    pages += [dict(file="services.html", key="services", tpl="services.html.j2")]
    pages += [dict(file=f"service-{s['slug']}.html", key="services", tpl="service.html.j2", service=s) for s in services]
    pages += [dict(file="projects.html", key="projects", tpl="projects.html.j2")]
    pages += [dict(file="blog.html", key="blog", tpl="blog.html.j2")]
    pages += [dict(file=f"blog-{a['slug']}.html", key="blog", tpl="article.html.j2", article=a) for a in articles]
    pages += [dict(file="contact.html", key="contact", tpl="contact.html.j2")]
    pages += [dict(file="privacy-policy.html", key="privacy", tpl="legal.html.j2", doc="privacy")]
    pages += [dict(file="terms-and-conditions.html", key="terms", tpl="legal.html.j2", doc="terms")]
    pages += [dict(file="404.html", key="404", tpl="404.html.j2", noindex=True, root_assets=True)]

    def abs_url(file, lang):
        path = ("en/" if lang == "en" else "") + ("" if file == "index.html" else file)
        return f"{site_url}/{path}"

    def meta_for(page, lang, d):
        key = page["key"]
        brand = d["brand_name"]
        if page["tpl"] == "service.html.j2":
            s = page["service"]
            return f"{s['title'][lang]} | {brand}", short(s["intro"][lang])
        if page["tpl"] == "article.html.j2":
            a = page["article"]
            return f"{a['title'][lang]} | {brand}", short(a["excerpt"][lang])
        if key == "home":
            return d["meta"]["home"]["title"], d["meta"]["home"]["description"]
        if key == "404":
            return f"{d['notFound']['title']} | {brand}", d["notFound"]["text"]
        m = d["meta"][key]
        return f"{m['title']} | {brand}", m["description"]

    written = []
    for lang in LANGS:
        d = content["dict"][lang]
        d["brand_name"] = "ماكس سيستم للبرمجيات" if lang == "ar" else "MAX SYSTEM"
        other = "en" if lang == "ar" else "ar"
        out_dir = out_root / ("en" if lang == "en" else "")
        out_dir.mkdir(parents=True, exist_ok=True)

        js_i18n = {
            "a11y": d["a11y"], "common": d["common"], "cookie": d["cookie"], "blog": d["blog"],
            "footer": d["footer"], "ui": d["ui"], "formx": d["formx"], "form": d["form"],
            "contactx": d["contactx"], "markets": {"strip": d["markets"]["strip"]},
        }

        for page in pages:
            file = page["file"]
            root_assets = page.get("root_assets", False)
            A = "/" if root_assets else ("" if lang == "ar" else "../")
            title, description = meta_for(page, lang, d)

            def u(target, _lang=lang, _root=root_assets):
                # internal link from a page of language `_lang` to another page of the same language
                if _root:
                    return ("/en/" if _lang == "en" else "/") + target
                return target

            def alt_url(target, _lang=lang, _root=root_assets):
                if _root:  # the 404 page can be served from any depth, so it uses root-relative links
                    return ("/en/" if _lang == "ar" else "/") + target
                return ("en/" + target) if _lang == "ar" else ("../" + target)

            ctx = dict(
                lang=lang, dir=DIRS[lang], other=other, d=d, page=page, file=file, key=page["key"],
                title=title, description=description, A=A, u=u, alt_url=alt_url,
                canonical=abs_url(file, lang), noindex=page.get("noindex", False),
                alts=[("ar", abs_url(file, "ar")), ("en", abs_url(file, "en")), ("x-default", abs_url(file, "ar"))],
                site=site_url, cdn=cdn, og_locale=OG_LOCALE[lang], og_alt_locale=OG_LOCALE[other],
                services=services, articles=articles, faqs=content["faqs"], projects=content["projects"],
                project_categories=content["projectCategories"], blog_categories=content["blogCategories"],
                why_items=content["whyItems"], process_steps=content["processSteps"], tech_groups=content["techGroups"],
                icons=ICONS, icons_why=ICONS_WHY,
                fmt_date=lambda iso: fmt_date(iso, lang),
                minutes=lambda a: reading_minutes(a, lang),
                js_i18n=js_i18n, is_404=(page["key"] == "404"),
            )
            ctx["faq_ld"] = [
                {"@type": "Question", "name": f["q"][lang], "acceptedAnswer": {"@type": "Answer", "text": f["a"][lang]}}
                for f in content["faqs"]
            ]
            if "service" in page:
                sv = page["service"]
                ctx["offers_ld"] = [
                    {"@type": "Offer", "itemOffered": {"@type": "Service", "name": it["title"][lang], "description": it["desc"][lang]}}
                    for it in (sv["items"] + (sv.get("platforms") or []))
                ]
                ctx["service"] = page["service"]
                ctx["related"] = [s for s in services if s["slug"] in page["service"]["related"]]
            if "article" in page:
                a = page["article"]
                ctx["article"] = a
                same = [x for x in articles if x["slug"] != a["slug"] and x["category"] == a["category"]]
                rest = [x for x in articles if x["slug"] != a["slug"] and x["category"] != a["category"]]
                ctx["related_articles"] = (same + rest)[:3]
                ctx["cat_label"] = next((c["label"][lang] for c in content["blogCategories"] if c["key"] == a["category"]), a["category"])
            if "doc" in page:
                ctx["doc"] = d["legal"][page["doc"]]

            # breadcrumbs for JSON-LD + visible trail (names, files)
            crumbs = [(d["common"]["home"], "index.html")]
            if page["tpl"] == "service.html.j2":
                crumbs += [(d["servicesPage"]["title"], "services.html"), (page["service"]["title"][lang], None)]
            elif page["tpl"] == "article.html.j2":
                crumbs += [(d["nav"]["blog"], "blog.html"), (page["article"]["title"][lang], None)]
            elif page["key"] not in ("home", "404"):
                names = {"about": d["nav"]["about"], "services": d["servicesPage"]["title"], "projects": d["nav"]["projects"],
                         "blog": d["nav"]["blog"], "contact": d["nav"]["contact"],
                         "privacy": d["legal"]["privacy"]["title"], "terms": d["legal"]["terms"]["title"]}
                crumbs += [(names[page["key"]], None)]
            ctx["crumbs"] = crumbs
            ctx["crumbs_ld"] = [
                {"@type": "ListItem", "position": i + 1, "name": n, "item": abs_url(f, lang) if f else abs_url(file, lang)}
                for i, (n, f) in enumerate(crumbs)
            ]

            html = env.get_template(page["tpl"]).render(**ctx)
            (out_dir / file).write_text(html, encoding="utf-8")
            written.append((lang, file))

    # ───────── sitemap + robots
    entries = [p["file"] for p in pages if not p.get("noindex")]
    lines = ['<?xml version="1.0" encoding="UTF-8"?>',
             '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">']
    for f in entries:
        for lang in LANGS:
            lines.append("  <url>")
            lines.append(f"    <loc>{abs_url(f, lang)}</loc>")
            for hl, lg in (("ar", "ar"), ("en", "en")):
                lines.append(f'    <xhtml:link rel="alternate" hreflang="{hl}" href="{abs_url(f, lg)}"/>')
            lines.append(f'    <xhtml:link rel="alternate" hreflang="x-default" href="{abs_url(f, "ar")}"/>')
            lines.append("  </url>")
    lines.append("</urlset>")
    (out_root / "sitemap.xml").write_text("\n".join(lines) + "\n", encoding="utf-8")
    (out_root / "robots.txt").write_text(f"User-agent: *\nAllow: /\n\nSitemap: {site_url}/sitemap.xml\n", encoding="utf-8")
    return written


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--site-url", default=PLACEHOLDER_SITE)
    ap.add_argument("--out", default=str(ROOT))
    ap.add_argument("--test-assets", help="JSON file mapping CDN keys to local URLs (used only for offline testing)")
    args = ap.parse_args()
    test = json.loads(Path(args.test_assets).read_text()) if args.test_assets else None
    files = build(args.site_url.rstrip("/"), Path(args.out), test)
    print(f"Generated {len(files)} pages ({len(files) // 2} per language) → {args.out}")
