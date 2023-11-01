*** Settings ***
Library     Browser


*** Test Cases ***
Test Keyword Filtering
    New Browser    Chromium    headless=False
    New Page    https://robotframework-browser.org/
    Get Title    ==    Browser Library
    Click    a >> "keyword documentation"
    Switch Page    NEW
    Get Title    ==    Browser
    Get URL    ends    robotframework-browser/Browser.html
    Type Text    input[placeholder="Search"]    Style
    ${style_elements}=    Get Elements    id=keyword-shortcuts-container >> a > span:has-text("Style")
    FOR    ${element}    IN    @{style_elements}
        Get Style    ${element}    background-color    ==    rgb(255, 255, 0)
    END
    Length Should Be    ${style_elements}    2
