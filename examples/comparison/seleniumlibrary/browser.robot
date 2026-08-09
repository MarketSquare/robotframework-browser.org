*** Settings ***
Library     Browser


*** Test Cases ***
Test Eight Components
    New Browser    chromium    headless=No
    New Page    https://www.selenium.dev/selenium/web/web-form.html
    Get Title    ==    Web form
    Type Text    [name="my-text"]    Selenium
    Click    button
    Get Text    id=message    ==    Received!
