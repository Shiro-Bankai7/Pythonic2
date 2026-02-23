import os
from playwright.sync_api import sync_playwright

BASE_URL = 'http://localhost:4173'
DIST_DIR = 'dist'

ROUTES = [
    '/',
    '/about',
    '/contact',
    '/privacy',
    '/terms',
    '/guides',
    '/tutorials',
    '/articles',
    # Guides
    '/guides/python-memory-management',
    '/guides/advanced-list-comprehensions',
    '/guides/python-decorators-in-depth',
    '/guides/asyncio-and-concurrency',
    '/guides/python-gil-explained',
    '/guides/python-metaprogramming-beyond-basics',
    # Tutorials
    '/tutorials/building-apis-with-fastapi',
    '/tutorials/testing-with-pytest',
    '/tutorials/pandas-and-numpy-basics',
    '/tutorials/web-scraping-with-beautifulsoup',
    '/tutorials/python-security-best-practices',
    '/tutorials/building-cli-tools-python',
    # Articles
    '/articles/python-2-vs-3-legacy',
    '/articles/async-programming-evolution',
    '/articles/python-cloud-native-future',
    '/articles/python-for-web-dev-2025',
    '/articles/the-gil-and-its-future',
    '/articles/why-python-is-perfect-for-beginners',
]

def prerender():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        for route in ROUTES:
            print(f"Prerendering {route}...")
            try:
                page.goto(BASE_URL + route)
                # Wait for main content
                page.wait_for_selector("#root", state="visible")
                page.wait_for_load_state('networkidle')
                page.wait_for_timeout(2000)

                content = page.content()

                # Determine path
                if route == '/':
                    path = os.path.join(DIST_DIR, 'index.html')
                else:
                    dir_path = os.path.join(DIST_DIR, route.lstrip('/'))
                    os.makedirs(dir_path, exist_ok=True)
                    path = os.path.join(dir_path, 'index.html')

                with open(path, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"Saved to {path}")
            except Exception as e:
                print(f"FAILED to prerender {route}: {e}")

        browser.close()

if __name__ == "__main__":
    prerender()
