from Browser import Browser
from Browser import SupportedBrowsers
from Browser import AssertionOperator as AO

browser = Browser()


def test_keyword_filtering():
    browser.new_browser(SupportedBrowsers.chromium, headless=False)
    browser.new_page("https://robotframework-browser.org/")
    assert browser.get_title() == "Browser Library"
    browser.click('a >> "keyword documentation"')
    browser.switch_page("NEW")
    browser.get_title(AO.equals, "Browser")
    browser.get_url(AO.ends, "robotframework-browser/Browser.html")
    browser.type_text('input[placeholder="Search"]', "Style")
    style_elements = browser.get_elements(
        'id=keyword-shortcuts-container >> a > span:has-text("Style")'
    )
    for element in style_elements:
        assert browser.get_style(element, "background-color") == "rgb(255, 255, 0)"
    assert len(style_elements) == 2
    browser.close_browser("ALL")
